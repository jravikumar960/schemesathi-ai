import threading
import time
from collections import deque

from app.config import get_settings

# NOTE: this limiter is per-process only. State is in memory, so it is not
# shared across workers or restarts. It is a hackathon-stage guard, not a
# distributed rate limit.
_lock = threading.Lock()
_failures: dict[tuple[str, str], deque[float]] = {}


def _prune(timestamps: deque[float], now: float, window: float) -> None:
    while timestamps and now - timestamps[0] >= window:
        timestamps.popleft()


def is_blocked(key: tuple[str, str]) -> bool:
    settings = get_settings()
    now = time.monotonic()
    with _lock:
        timestamps = _failures.get(key)
        if timestamps is None:
            return False
        _prune(timestamps, now, settings.auth_rate_limit_window_seconds)
        if not timestamps:
            del _failures[key]
            return False
        return len(timestamps) >= settings.auth_rate_limit_attempts


def record_failure(key: tuple[str, str]) -> None:
    now = time.monotonic()
    window = get_settings().auth_rate_limit_window_seconds
    with _lock:
        timestamps = _failures.setdefault(key, deque())
        _prune(timestamps, now, window)
        timestamps.append(now)


def clear(key: tuple[str, str]) -> None:
    with _lock:
        _failures.pop(key, None)


def reset() -> None:
    with _lock:
        _failures.clear()

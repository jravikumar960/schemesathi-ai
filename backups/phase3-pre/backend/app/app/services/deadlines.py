from datetime import date

DEADLINE_NO_VERIFIED = "NO_VERIFIED_DEADLINE"
DEADLINE_UPCOMING = "UPCOMING"
DEADLINE_EXPIRED = "EXPIRED"
DEADLINE_UNVERIFIED = "UNVERIFIED"


def deadline_status(
    deadline: date | None,
    verification_status: str,
    is_illustrative: bool,
    today: date,
) -> tuple[str, int | None]:
    if deadline is None:
        return (DEADLINE_NO_VERIFIED, None)
    if verification_status != "VERIFIED" or is_illustrative:
        return (DEADLINE_UNVERIFIED, None)
    days = (deadline - today).days
    if days < 0:
        return (DEADLINE_EXPIRED, days)
    return (DEADLINE_UPCOMING, days)  # day 0 means due today

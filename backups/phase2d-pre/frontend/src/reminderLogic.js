// Pure reminder preferences and de-duplication helpers.
// Nothing here requests notification permission or touches the DOM.

export const REMINDER_INTERVAL_OPTIONS = [7, 3, 1];
export const PREFS_KEY = "schemesathi.reminders.v1";
export const FIRED_KEY = "schemesathi.reminders.fired.v1";

const MAX_FIRED = 200;
const MIN_INTERVAL = 1;
const MAX_INTERVAL = 60;

export function normalizeIntervals(values) {
  if (!Array.isArray(values)) return [...REMINDER_INTERVAL_OPTIONS];
  const unique = new Set();
  for (const value of values) {
    if (
      Number.isInteger(value) &&
      value >= MIN_INTERVAL &&
      value <= MAX_INTERVAL
    ) {
      unique.add(value);
    }
  }
  if (unique.size === 0) return [...REMINDER_INTERVAL_OPTIONS];
  return [...unique].sort((a, b) => b - a);
}

function defaultPrefs() {
  return { enabled: false, intervals: [...REMINDER_INTERVAL_OPTIONS] };
}

export function loadPrefs(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(PREFS_KEY));
    if (parsed === null || typeof parsed !== "object") return defaultPrefs();
    return {
      enabled: parsed.enabled === true,
      intervals: normalizeIntervals(parsed.intervals),
    };
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(storage, prefs) {
  try {
    storage.setItem(
      PREFS_KEY,
      JSON.stringify({
        enabled: Boolean(prefs && prefs.enabled),
        intervals: normalizeIntervals(prefs && prefs.intervals),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function loadFired(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(FIRED_KEY));
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function markFired(storage, fired, keys) {
  const base = Array.isArray(fired) ? fired : [];
  const extra = Array.isArray(keys) ? keys : [];
  const merged = [...new Set([...base, ...extra])].slice(-MAX_FIRED);
  try {
    storage.setItem(FIRED_KEY, JSON.stringify(merged));
  } catch {
    // Storage may be full or disabled; the in-memory list is still returned.
  }
  return merged;
}

export function dueReminder({ schemeSlug, deadlineIso, daysRemaining, intervals, fired } = {}) {
  if (!Number.isInteger(daysRemaining) || daysRemaining < 0) return null;
  const list = Array.isArray(intervals) ? intervals : [];
  const applicable = list.filter((interval) => interval >= daysRemaining);
  if (applicable.length === 0) return null;
  const interval = Math.min(...applicable);
  const key = schemeSlug + "|" + deadlineIso + "|" + interval;
  if (Array.isArray(fired) && fired.includes(key)) return null;
  return {
    key,
    interval,
    daysRemaining,
    message: "Reminder: " + schemeSlug + " deadline in " + daysRemaining + " day(s).",
  };
}

export function notificationStatus(api) {
  if (api === undefined || api === null) return "unsupported";
  const permission = api.permission;
  if (permission === "granted" || permission === "denied") return permission;
  return "default";
}

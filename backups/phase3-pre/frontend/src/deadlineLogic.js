// Pure date and deadline helpers. All calendar arithmetic uses UTC day numbers
// so results do not depend on the user's timezone or DST.

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86400000;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function parseIsoDate(value) {
  if (typeof value !== "string" || !ISO_PATTERN.test(value)) return null;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

export function utcDayNumber(date) {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      MS_PER_DAY
  );
}

export function daysUntil(deadlineIso, todayIso) {
  const deadline = parseIsoDate(deadlineIso);
  const today = parseIsoDate(todayIso);
  if (!deadline || !today) return null;
  return utcDayNumber(deadline) - utcDayNumber(today);
}

export function deadlineStatus(deadlineIso, verificationStatus, isIllustrative, todayIso) {
  if (deadlineIso === null || deadlineIso === undefined) {
    return { status: "NO_VERIFIED_DEADLINE", daysRemaining: null };
  }
  if (verificationStatus !== "VERIFIED" || isIllustrative === true) {
    return { status: "UNVERIFIED", daysRemaining: null };
  }
  const days = daysUntil(deadlineIso, todayIso);
  if (days === null) {
    return { status: "UNVERIFIED", daysRemaining: null };
  }
  if (days < 0) {
    return { status: "EXPIRED", daysRemaining: days };
  }
  return { status: "UPCOMING", daysRemaining: days };
}

export function formatDisplayDate(isoDate) {
  const date = parseIsoDate(isoDate);
  if (!date) return "";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function todayIso(now = new Date()) {
  const yyyy = String(now.getFullYear()).padStart(4, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

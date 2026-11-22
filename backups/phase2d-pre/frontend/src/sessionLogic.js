// Session key for the application tracker. If storage is blocked or full,
// a key is still returned for this page load (tracking then does not persist).
export const SESSION_KEY = "schemesathi_session";

export function getOrCreateSessionKey(storage, makeId) {
  let existing;
  try {
    existing = storage.getItem(SESSION_KEY);
  } catch {
    return makeId();
  }
  if (existing) return existing;
  const key = makeId();
  try {
    storage.setItem(SESSION_KEY, key);
  } catch {
    // Storage refused the write; keep the key for this page load only.
  }
  return key;
}

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REMINDER_INTERVAL_OPTIONS,
  PREFS_KEY,
  FIRED_KEY,
  normalizeIntervals,
  loadPrefs,
  savePrefs,
  loadFired,
  markFired,
  dueReminder,
  notificationStatus,
} from "../src/reminderLogic.js";

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function throwingStorage() {
  return {
    getItem() {
      throw new Error("storage unavailable");
    },
    setItem() {
      throw new Error("storage unavailable");
    },
    removeItem() {
      throw new Error("storage unavailable");
    },
  };
}

test("constants are exported with the expected values", () => {
  assert.deepEqual(REMINDER_INTERVAL_OPTIONS, [7, 3, 1]);
  assert.equal(PREFS_KEY, "schemesathi.reminders.v1");
  assert.equal(FIRED_KEY, "schemesathi.reminders.fired.v1");
});

test("normalizeIntervals keeps valid unique integers sorted descending", () => {
  assert.deepEqual(normalizeIntervals([1, "x", 7, 7, 3, 99, 0]), [7, 3, 1]);
  assert.deepEqual(normalizeIntervals("x"), [7, 3, 1]);
  assert.deepEqual(normalizeIntervals([]), [7, 3, 1]);
});

test("loadPrefs returns defaults for malformed storage", () => {
  const storage = fakeStorage();
  storage.setItem(PREFS_KEY, "{");
  assert.deepEqual(loadPrefs(storage), { enabled: false, intervals: [7, 3, 1] });
});

test("loadPrefs returns defaults when storage throws", () => {
  assert.deepEqual(loadPrefs(throwingStorage()), { enabled: false, intervals: [7, 3, 1] });
});

test("savePrefs then loadPrefs round-trips", () => {
  const storage = fakeStorage();
  assert.equal(savePrefs(storage, { enabled: true, intervals: [3, 1] }), true);
  assert.deepEqual(loadPrefs(storage), { enabled: true, intervals: [3, 1] });
});

test("savePrefs returns false when storage throws", () => {
  assert.equal(savePrefs(throwingStorage(), { enabled: true, intervals: [3] }), false);
});

test("loadFired returns only string arrays", () => {
  const storage = fakeStorage();
  assert.deepEqual(loadFired(storage), []);
  storage.setItem(FIRED_KEY, JSON.stringify(["a", 2]));
  assert.deepEqual(loadFired(storage), []);
  storage.setItem(FIRED_KEY, JSON.stringify(["a"]));
  assert.deepEqual(loadFired(storage), ["a"]);
});

test("markFired appends and de-duplicates", () => {
  const storage = fakeStorage();
  const merged = markFired(storage, ["a"], ["a", "b"]);
  assert.deepEqual(merged, ["a", "b"]);
  assert.deepEqual(loadFired(storage), ["a", "b"]);
});

test("markFired returns the array even when storage throws", () => {
  assert.deepEqual(markFired(throwingStorage(), ["a"], ["b"]), ["a", "b"]);
});

test("dueReminder returns null when no interval applies", () => {
  const args = { schemeSlug: "s", deadlineIso: "2027-03-31", intervals: [7, 3, 1], fired: [] };
  assert.equal(dueReminder({ ...args, daysRemaining: 10 }), null);
  assert.equal(dueReminder({ ...args, daysRemaining: -1 }), null);
});

test("dueReminder picks the smallest applicable interval", () => {
  const args = { schemeSlug: "s", deadlineIso: "2027-03-31", intervals: [7, 3, 1], fired: [] };
  assert.equal(dueReminder({ ...args, daysRemaining: 6 }).interval, 7);
  assert.equal(dueReminder({ ...args, daysRemaining: 2 }).interval, 3);
  assert.equal(dueReminder({ ...args, daysRemaining: 0 }).interval, 1);
});

test("dueReminder returns null once the key has fired", () => {
  const args = { schemeSlug: "s", deadlineIso: "2027-03-31", intervals: [7, 3, 1] };
  const first = dueReminder({ ...args, daysRemaining: 6, fired: [] });
  assert.ok(first);
  assert.equal(dueReminder({ ...args, daysRemaining: 6, fired: [first.key] }), null);
});

test("notificationStatus maps the permission state", () => {
  assert.equal(notificationStatus(undefined), "unsupported");
  assert.equal(notificationStatus(null), "unsupported");
  assert.equal(notificationStatus({ permission: "denied" }), "denied");
  assert.equal(notificationStatus({ permission: "granted" }), "granted");
  assert.equal(notificationStatus({ permission: "weird" }), "default");
});

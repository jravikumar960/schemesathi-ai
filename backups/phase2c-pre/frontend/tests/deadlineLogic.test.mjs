import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseIsoDate,
  daysUntil,
  deadlineStatus,
  formatDisplayDate,
  todayIso,
} from "../src/deadlineLogic.js";

test("parseIsoDate rejects invalid calendar dates and wrong formats", () => {
  assert.equal(parseIsoDate("2027-02-30"), null);
  assert.equal(parseIsoDate("31-03-2027"), null);
  assert.equal(parseIsoDate(null), null);
});

test("parseIsoDate accepts a real date", () => {
  const date = parseIsoDate("2027-03-31");
  assert.ok(date instanceof Date);
  assert.equal(date.getUTCFullYear(), 2027);
  assert.equal(date.getUTCMonth(), 2);
  assert.equal(date.getUTCDate(), 31);
});

test("daysUntil counts calendar days in both directions", () => {
  assert.equal(daysUntil("2027-03-31", "2027-03-21"), 10);
  assert.equal(daysUntil("2027-03-21", "2027-03-21"), 0);
  assert.equal(daysUntil("2026-11-01", "2026-11-21"), -20);
});

test("deadlineStatus with no deadline", () => {
  assert.deepEqual(deadlineStatus(null, "VERIFIED", false, "2026-11-21"), {
    status: "NO_VERIFIED_DEADLINE",
    daysRemaining: null,
  });
});

test("deadlineStatus is UNVERIFIED for illustrative data", () => {
  assert.deepEqual(
    deadlineStatus("2027-03-31", "UNVERIFIED_ILLUSTRATIVE", true, "2026-11-21"),
    { status: "UNVERIFIED", daysRemaining: null }
  );
});

test("deadlineStatus is UPCOMING with days remaining", () => {
  assert.deepEqual(deadlineStatus("2027-03-31", "VERIFIED", false, "2026-11-21"), {
    status: "UPCOMING",
    daysRemaining: 130,
  });
});

test("deadlineStatus is EXPIRED with negative days", () => {
  assert.deepEqual(deadlineStatus("2026-11-01", "VERIFIED", false, "2026-11-21"), {
    status: "EXPIRED",
    daysRemaining: -20,
  });
});

test("formatDisplayDate formats valid dates and blanks invalid ones", () => {
  assert.equal(formatDisplayDate("2027-03-31"), "31 Mar 2027");
  assert.equal(formatDisplayDate("bad"), "");
});

test("todayIso uses local calendar parts, zero-padded", () => {
  assert.equal(todayIso(new Date(2026, 0, 5, 12)), "2026-01-05");
});

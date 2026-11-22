import test from "node:test";
import assert from "node:assert/strict";
import {
  groupTrackerRecords,
  groupTrackerOptions,
} from "../src/schemeLogic.js";

const schemes = [
  { slug: "demo", verification_status: "UNVERIFIED_ILLUSTRATIVE", is_illustrative: true },
  { slug: "official", verification_status: "VERIFIED", is_illustrative: false },
];

test("verified applications are separated from demo applications", () => {
  const result = groupTrackerRecords([
    { id: 1, scheme_slug: "demo" },
    { id: 2, scheme_slug: "official" },
  ], schemes);

  assert.deepEqual(result.verified.map(a => a.id), [2]);
  assert.deepEqual(result.other.map(a => a.id), [1]);
});

test("unknown scheme records are never treated as verified", () => {
  const result = groupTrackerRecords([{ id: 3, scheme_slug: "missing" }], schemes);
  assert.equal(result.verified.length, 0);
  assert.equal(result.other.length, 1);
});

test("scheme options separate verified and demo entries", () => {
  const result = groupTrackerOptions(schemes);
  assert.equal(result.verified[0].slug, "official");
  assert.equal(result.other[0].slug, "demo");
});

test("empty or invalid inputs do not crash grouping", () => {
  assert.deepEqual(groupTrackerRecords(null, null), { verified: [], other: [] });
  assert.deepEqual(groupTrackerOptions(null), { verified: [], other: [] });
});

import test from "node:test";
import assert from "node:assert/strict";
import { categorizeSchemes } from "../src/schemeLogic.js";

test("separates verified, unverified and illustrative schemes", () => {
  const schemes = [
    { slug: "a", verification_status: "VERIFIED", is_illustrative: false },
    { slug: "b", verification_status: "UNVERIFIED_PROGRAMME", is_illustrative: false },
    { slug: "c", verification_status: "UNVERIFIED_ILLUSTRATIVE", is_illustrative: true },
  ];

  const groups = categorizeSchemes(schemes);

  assert.deepEqual(groups.verified.map(s => s.slug), ["a"]);
  assert.deepEqual(groups.unverified.map(s => s.slug), ["b"]);
  assert.deepEqual(groups.illustrative.map(s => s.slug), ["c"]);
});

test("does not promote inconsistent records to verified", () => {
  const groups = categorizeSchemes([
    { slug: "invalid", verification_status: "VERIFIED", is_illustrative: true },
    { slug: "unknown", verification_status: "UNKNOWN", is_illustrative: false },
  ]);

  assert.equal(groups.verified.length, 0);
  assert.equal(groups.unverified.length, 0);
  assert.equal(groups.illustrative.length, 2);
});

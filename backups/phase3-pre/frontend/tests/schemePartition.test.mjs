import test from "node:test";
import assert from "node:assert/strict";
import { partitionSchemes } from "../src/schemeLogic.js";

test("verified records are separated from illustrative records", () => {
  const items = [
    { slug: "demo", verification_status: "UNVERIFIED_ILLUSTRATIVE", is_illustrative: true },
    { slug: "telangana", verification_status: "VERIFIED", is_illustrative: false },
  ];

  const result = partitionSchemes(items);

  assert.deepEqual(result.verified.map(x => x.slug), ["telangana"]);
  assert.deepEqual(result.other.map(x => x.slug), ["demo"]);
});

test("missing verification metadata is not treated as verified", () => {
  const result = partitionSchemes([
    { slug: "unknown", verification_status: "VERIFIED" },
  ]);

  assert.equal(result.verified.length, 0);
  assert.equal(result.other.length, 1);
});

test("empty records return empty partitions", () => {
  const result = partitionSchemes([]);

  assert.deepEqual(result, { verified: [], other: [] });
});

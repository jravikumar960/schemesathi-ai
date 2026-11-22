import { test } from "node:test";
import assert from "node:assert/strict";
import { isVerifiedScheme } from "../src/schemeLogic.js";

test("explicit VERIFIED with is_illustrative false is verified", () => {
  assert.equal(
    isVerifiedScheme({ verification_status: "VERIFIED", is_illustrative: false }),
    true
  );
});

test("missing is_illustrative is not verified (fail safe)", () => {
  assert.equal(isVerifiedScheme({ verification_status: "VERIFIED" }), false);
});

test("is_illustrative true is not verified", () => {
  assert.equal(
    isVerifiedScheme({ verification_status: "VERIFIED", is_illustrative: true }),
    false
  );
});

test("string 'false' is not verified (non-boolean)", () => {
  assert.equal(
    isVerifiedScheme({ verification_status: "VERIFIED", is_illustrative: "false" }),
    false
  );
});

test("UNVERIFIED_ILLUSTRATIVE with is_illustrative false is not verified", () => {
  assert.equal(
    isVerifiedScheme({
      verification_status: "UNVERIFIED_ILLUSTRATIVE",
      is_illustrative: false,
    }),
    false
  );
});

test("UNVERIFIED_ILLUSTRATIVE with is_illustrative true is not verified", () => {
  assert.equal(
    isVerifiedScheme({
      verification_status: "UNVERIFIED_ILLUSTRATIVE",
      is_illustrative: true,
    }),
    false
  );
});

test("null, undefined and empty object are not verified", () => {
  assert.equal(isVerifiedScheme(null), false);
  assert.equal(isVerifiedScheme(undefined), false);
  assert.equal(isVerifiedScheme({}), false);
});

test("Telangana-like record is verified", () => {
  assert.equal(
    isVerifiedScheme({
      slug: "telangana-post-matric-scholarships",
      verification_status: "VERIFIED",
      is_illustrative: false,
    }),
    true
  );
});

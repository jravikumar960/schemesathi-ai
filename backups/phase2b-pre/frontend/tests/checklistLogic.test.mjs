import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify,
  documentIds,
  storageKey,
  readPrepared,
  writePrepared,
  loadChecklist,
  progress,
  isConditionalDocument,
} from "../src/checklistLogic.js";

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

test("slugify normalises text", () => {
  assert.equal(slugify("Caste Certificate (SC)"), "caste-certificate-sc");
  assert.equal(slugify("  ---  "), "item");
  assert.equal(slugify(""), "item");
});

test("documentIds makes repeated bases unique in input order", () => {
  assert.deepEqual(documentIds(["Bank", "Bank"]), ["bank", "bank-2"]);
});

test("storageKey uses the versioned prefix", () => {
  assert.equal(storageKey("s", "d"), "schemesathi.checklist.v1.s.d");
});

test("readPrepared is false for missing, malformed or wrong-shaped values", () => {
  const storage = fakeStorage();
  assert.equal(readPrepared(storage, "s", "d"), false);

  storage.setItem(storageKey("s", "d"), "{");
  assert.equal(readPrepared(storage, "s", "d"), false);

  storage.setItem(storageKey("s", "d"), "[]");
  assert.equal(readPrepared(storage, "s", "d"), false);

  storage.setItem(storageKey("s", "d"), JSON.stringify({ prepared: "yes" }));
  assert.equal(readPrepared(storage, "s", "d"), false);
});

test("readPrepared never throws when storage throws", () => {
  assert.equal(readPrepared(throwingStorage(), "s", "d"), false);
});

test("writePrepared then readPrepared round-trips true", () => {
  const storage = fakeStorage();
  assert.equal(writePrepared(storage, "s", "d", true), true);
  assert.equal(readPrepared(storage, "s", "d"), true);
});

test("writePrepared false then readPrepared is false", () => {
  const storage = fakeStorage();
  writePrepared(storage, "s", "d", true);
  assert.equal(writePrepared(storage, "s", "d", false), true);
  assert.equal(readPrepared(storage, "s", "d"), false);
});

test("writePrepared returns false when storage throws", () => {
  assert.equal(writePrepared(throwingStorage(), "s", "d", true), false);
});

test("loadChecklist builds ids and a prepared map", () => {
  const storage = fakeStorage();
  writePrepared(storage, "s", "bank", true);
  const result = loadChecklist(storage, "s", ["Bank", "Caste Certificate"]);
  assert.deepEqual(result.ids, ["bank", "caste-certificate"]);
  assert.deepEqual(result.prepared, { bank: true, "caste-certificate": false });
});

test("progress with zero documents has percent 0", () => {
  assert.deepEqual(progress([], {}), { total: 0, prepared: 0, remaining: 0, percent: 0 });
});

test("progress counts prepared documents", () => {
  assert.deepEqual(progress(["a", "b", "c"], { a: true }), {
    total: 3,
    prepared: 1,
    remaining: 2,
    percent: 33,
  });
});

test("isConditionalDocument detects source wording only", () => {
  assert.equal(isConditionalDocument("Income certificate (where applicable)"), true);
  assert.equal(isConditionalDocument("Caste certificate"), false);
});

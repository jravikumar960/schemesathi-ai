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
  APPLICABILITY,
  readRecord,
  writeRecord,
  loadRecords,
  progressRecords,
  resetRecords,
  recordKey,
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

test("v1 checkbox migrates to a v2 prepared/needed record", () => {
  const storage = fakeStorage();
  writePrepared(storage, "s", "bank-passbook", true);
  assert.deepEqual(readRecord(storage, "s", "bank-passbook"), {
    prepared: true,
    applicability: "needed",
  });
});

test("readRecord with no stored data returns prepared false, needed", () => {
  assert.deepEqual(readRecord(fakeStorage(), "s", "d"), {
    prepared: false,
    applicability: "needed",
  });
});

test("corrupt v2 record falls back to the v1 value", () => {
  const storage = fakeStorage();
  storage.setItem(recordKey("s", "d"), "{");
  storage.setItem(storageKey("s", "d"), JSON.stringify({ prepared: true }));
  assert.equal(readRecord(storage, "s", "d").prepared, true);
});

test("v2 record with bogus applicability and no v1 is treated as needed", () => {
  const storage = fakeStorage();
  storage.setItem(
    recordKey("s", "d"),
    JSON.stringify({ prepared: true, applicability: "bogus" })
  );
  assert.deepEqual(readRecord(storage, "s", "d"), {
    prepared: false,
    applicability: "needed",
  });
});

test("writeRecord then readRecord round-trips prepared and not_sure", () => {
  const storage = fakeStorage();
  assert.equal(
    writeRecord(storage, "s", "d", { prepared: true, applicability: "not_sure" }),
    true
  );
  assert.deepEqual(readRecord(storage, "s", "d"), {
    prepared: true,
    applicability: "not_sure",
  });
});

test("writeRecord with an unknown applicability stores needed", () => {
  const storage = fakeStorage();
  writeRecord(storage, "s", "d", { prepared: false, applicability: "weird" });
  assert.equal(readRecord(storage, "s", "d").applicability, "needed");
});

test("writeRecord returns false and does not throw when storage throws", () => {
  assert.equal(
    writeRecord(throwingStorage(), "s", "d", { prepared: true, applicability: "needed" }),
    false
  );
});

test("readRecord returns defaults and does not throw when storage throws", () => {
  assert.deepEqual(readRecord(throwingStorage(), "s", "d"), {
    prepared: false,
    applicability: "needed",
  });
});

test("loadRecords builds ids, records and conditional flags", () => {
  const storage = fakeStorage();
  const docs = ["Bank passbook", "Income certificate (where applicable)"];
  const result = loadRecords(storage, "s", docs);
  assert.equal(result.ids.length, 2);
  assert.deepEqual(result.conditional, {
    [result.ids[0]]: false,
    [result.ids[1]]: true,
  });
});

test("progressRecords excludes a conditional not_applicable document", () => {
  const records = {
    a: { prepared: true, applicability: "needed" },
    b: { prepared: false, applicability: "needed" },
    c: { prepared: false, applicability: "not_applicable" },
  };
  assert.deepEqual(
    progressRecords(["a", "b", "c"], records, { a: false, b: false, c: true }),
    { total: 2, prepared: 1, remaining: 1, percent: 50, notApplicable: 1 }
  );
});

test("progressRecords does not exclude not_applicable when not conditional", () => {
  const records = {
    a: { prepared: true, applicability: "needed" },
    b: { prepared: false, applicability: "needed" },
    c: { prepared: false, applicability: "not_applicable" },
  };
  const result = progressRecords(["a", "b", "c"], records, { a: false, b: false, c: false });
  assert.equal(result.total, 3);
  assert.equal(result.notApplicable, 0);
});

test("progressRecords counts a conditional not_sure document", () => {
  const records = { a: { prepared: false, applicability: "not_sure" } };
  const result = progressRecords(["a"], records, { a: true });
  assert.equal(result.total, 1);
  assert.equal(result.prepared, 0);
  assert.equal(result.remaining, 1);
});

test("progressRecords with no documents is all zero", () => {
  assert.deepEqual(progressRecords([], {}, {}), {
    total: 0,
    prepared: 0,
    remaining: 0,
    percent: 0,
    notApplicable: 0,
  });
});

test("progressRecords excludes a conditional not_applicable even when prepared", () => {
  const records = { a: { prepared: true, applicability: "not_applicable" } };
  const result = progressRecords(["a"], records, { a: true });
  assert.equal(result.total, 0);
  assert.equal(result.prepared, 0);
});

test("resetRecords clears every record and returns true", () => {
  const storage = fakeStorage();
  writeRecord(storage, "s", "a", { prepared: true, applicability: "not_sure" });
  writeRecord(storage, "s", "b", { prepared: true, applicability: "not_applicable" });
  assert.equal(resetRecords(storage, "s", ["a", "b"]), true);
  assert.deepEqual(readRecord(storage, "s", "a"), { prepared: false, applicability: "needed" });
  assert.deepEqual(readRecord(storage, "s", "b"), { prepared: false, applicability: "needed" });
});

test("recordKey uses the v2 prefix", () => {
  assert.equal(recordKey("s", "d"), "schemesathi.checklist.v2.s.d");
});

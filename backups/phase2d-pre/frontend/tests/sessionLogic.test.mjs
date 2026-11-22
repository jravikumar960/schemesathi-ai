import { test } from "node:test";
import assert from "node:assert/strict";
import { SESSION_KEY, getOrCreateSessionKey } from "../src/sessionLogic.js";

function makeStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    _map: map,
  };
}

function counterId(prefix = "id") {
  let n = 0;
  const fn = () => {
    n += 1;
    return `${prefix}-${n}`;
  };
  fn.count = () => n;
  return fn;
}

test("(a) an existing stored key is returned and makeId is not called", () => {
  const storage = makeStorage();
  storage.setItem(SESSION_KEY, "existing-key");
  const makeId = counterId();
  assert.equal(getOrCreateSessionKey(storage, makeId), "existing-key");
  assert.equal(makeId.count(), 0);
});

test("(b) when nothing is stored, makeId result is stored and reused", () => {
  const storage = makeStorage();
  const makeId = counterId();
  const first = getOrCreateSessionKey(storage, makeId);
  assert.equal(first, "id-1");
  assert.equal(storage.getItem(SESSION_KEY), "id-1");
  const second = getOrCreateSessionKey(storage, makeId);
  assert.equal(second, "id-1");
  assert.equal(makeId.count(), 1);
});

test("(c) an empty stored string is treated as missing", () => {
  const storage = makeStorage();
  storage.setItem(SESSION_KEY, "");
  const makeId = counterId();
  assert.equal(getOrCreateSessionKey(storage, makeId), "id-1");
  assert.equal(makeId.count(), 1);
  assert.equal(storage.getItem(SESSION_KEY), "id-1");
});

test("(d) a storage whose getItem throws returns makeId result without throwing", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {},
  };
  const makeId = counterId();
  assert.equal(getOrCreateSessionKey(storage, makeId), "id-1");
  assert.equal(makeId.count(), 1);
});

test("(e) a storage whose setItem throws still returns makeId result", () => {
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("quota exceeded");
    },
  };
  const makeId = counterId();
  assert.equal(getOrCreateSessionKey(storage, makeId), "id-1");
});

// Pure helpers for the personalised document preparation checklist.
// No DOM, no npm dependencies. Storage is any object with getItem/setItem.

const KEY_PREFIX = "schemesathi.checklist.v1.";

export function slugify(text) {
  const slug = String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

// Accepts an array of strings or of objects with a `text` field.
// Returns unique ids in input order; repeated bases get "-2", "-3", ...
export function documentIds(documents) {
  if (!Array.isArray(documents)) return [];
  const used = new Set();
  const ids = [];
  for (const doc of documents) {
    const text = typeof doc === "string" ? doc : doc && doc.text;
    const base = slugify(text);
    let candidate = base;
    let n = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${n}`;
      n += 1;
    }
    used.add(candidate);
    ids.push(candidate);
  }
  return ids;
}

export function storageKey(schemeSlug, documentId) {
  return KEY_PREFIX + schemeSlug + "." + documentId;
}

export function readPrepared(storage, schemeSlug, documentId) {
  try {
    const raw = storage.getItem(storageKey(schemeSlug, documentId));
    const parsed = JSON.parse(raw);
    return (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      parsed.prepared === true
    );
  } catch {
    return false;
  }
}

export function writePrepared(storage, schemeSlug, documentId, prepared) {
  try {
    storage.setItem(
      storageKey(schemeSlug, documentId),
      JSON.stringify({ prepared: Boolean(prepared) })
    );
    return true;
  } catch {
    return false;
  }
}

export function loadChecklist(storage, schemeSlug, documents) {
  const ids = documentIds(documents);
  const prepared = {};
  for (const id of ids) {
    prepared[id] = readPrepared(storage, schemeSlug, id);
  }
  return { ids, prepared };
}

export function progress(ids, preparedMap) {
  const list = Array.isArray(ids) ? ids : [];
  const map = preparedMap || {};
  const total = list.length;
  const prepared = list.filter((id) => map[id] === true).length;
  const remaining = total - prepared;
  const percent = total === 0 ? 0 : Math.round((prepared / total) * 100);
  return { total, prepared, remaining, percent };
}

// Derived only from the source wording (e.g. "(where applicable)"),
// not from a data field, because the verified record has no such field.
export function isConditionalDocument(text) {
  return /\b(where applicable|as applicable|if applicable|for applicable|where required|if required|if any)\b/i.test(
    String(text ?? "")
  );
}

export const APPLICABILITY = {
  NEEDED: "needed",
  NOT_APPLICABLE: "not_applicable",
  NOT_SURE: "not_sure",
};

const VALID_APPLICABILITY = [APPLICABILITY.NEEDED, APPLICABILITY.NOT_APPLICABLE, APPLICABILITY.NOT_SURE];
const V2_PREFIX = "schemesathi.checklist.v2.";

export function recordKey(schemeSlug, documentId) {
  return V2_PREFIX + schemeSlug + "." + documentId;
}

// Reads the v2 record. If it is missing or invalid, migrates the original v1
// checkbox value (readPrepared) as prepared/needed. Never throws.
export function readRecord(storage, schemeSlug, documentId) {
  try {
    const raw = storage.getItem(recordKey(schemeSlug, documentId));
    if (raw !== null && raw !== undefined) {
      const parsed = JSON.parse(raw);
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        typeof parsed.prepared === "boolean" &&
        VALID_APPLICABILITY.includes(parsed.applicability)
      ) {
        return { prepared: parsed.prepared, applicability: parsed.applicability };
      }
    }
  } catch {
    // Corrupt or unreadable v2 record: fall through to the v1 migration.
  }
  return {
    prepared: readPrepared(storage, schemeSlug, documentId),
    applicability: APPLICABILITY.NEEDED,
  };
}

export function writeRecord(storage, schemeSlug, documentId, record) {
  try {
    const applicability = VALID_APPLICABILITY.includes(record && record.applicability)
      ? record.applicability
      : APPLICABILITY.NEEDED;
    storage.setItem(
      recordKey(schemeSlug, documentId),
      JSON.stringify({ prepared: Boolean(record && record.prepared), applicability })
    );
    return true;
  } catch {
    return false;
  }
}

// Returns { ids, records, conditional }; conditional[id] is true when the
// document wording marks it conditional. Never throws.
export function loadRecords(storage, schemeSlug, documents) {
  const list = Array.isArray(documents) ? documents.filter((d) => typeof d === "string") : [];
  const ids = documentIds(list);
  const records = {};
  const conditional = {};
  list.forEach((text, index) => {
    const id = ids[index];
    records[id] = readRecord(storage, schemeSlug, id);
    conditional[id] = isConditionalDocument(text);
  });
  return { ids, records, conditional };
}

// Only a CONDITIONAL document marked NOT_APPLICABLE leaves the denominator.
// NOT_SURE counts toward the total and the remaining count.
export function progressRecords(ids, records, conditional) {
  const list = Array.isArray(ids) ? ids : [];
  const recs = records || {};
  const cond = conditional || {};
  let total = 0;
  let prepared = 0;
  let notApplicable = 0;
  for (const id of list) {
    const rec = recs[id] || {};
    if (cond[id] === true && rec.applicability === APPLICABILITY.NOT_APPLICABLE) {
      notApplicable += 1;
      continue;
    }
    total += 1;
    if (rec.prepared === true) prepared += 1;
  }
  const remaining = total - prepared;
  const percent = total === 0 ? 0 : Math.round((prepared / total) * 100);
  return { total, prepared, remaining, percent, notApplicable };
}

export function resetRecords(storage, schemeSlug, ids) {
  let allSaved = true;
  for (const id of Array.isArray(ids) ? ids : []) {
    if (!writeRecord(storage, schemeSlug, id, { prepared: false, applicability: APPLICABILITY.NEEDED })) {
      allSaved = false;
    }
  }
  return allSaved;
}


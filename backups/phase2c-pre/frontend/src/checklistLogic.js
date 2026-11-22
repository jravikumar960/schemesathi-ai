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

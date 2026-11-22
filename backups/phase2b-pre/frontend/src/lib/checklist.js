// Pure helpers for the interactive document checklist.
// Storage is duck-typed: anything exposing getItem / setItem works.

const KEY_PREFIX = "schemesathi.checklist.v1.";

export function slugify(text) {
  const slug = String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

export function documentIds(documents) {
  const seen = new Map();
  const ids = [];
  for (const doc of documents ?? []) {
    const base = slugify(typeof doc === "string" ? doc : doc?.text);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    ids.push(count === 1 ? base : `${base}-${count}`);
  }
  return ids;
}

export function storageKey(schemeSlug, documentId) {
  return KEY_PREFIX + schemeSlug + "." + documentId;
}

export function readPrepared(storage, schemeSlug, documentId) {
  try {
    const raw = storage.getItem(storageKey(schemeSlug, documentId));
    if (raw === null || raw === undefined) return false;
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return false;
    }
    return parsed.prepared === true;
  } catch {
    return false;
  }
}

export function writePrepared(storage, schemeSlug, documentId, prepared) {
  try {
    storage.setItem(
      storageKey(schemeSlug, documentId),
      JSON.stringify({ prepared: Boolean(prepared) }),
    );
    return true;
  } catch {
    return false;
  }
}

export function loadChecklist(storage, schemeSlug, documents) {
  try {
    const ids = documentIds(documents);
    const prepared = {};
    for (const id of ids) {
      prepared[id] = readPrepared(storage, schemeSlug, id);
    }
    return { ids, prepared };
  } catch {
    return { ids: [], prepared: {} };
  }
}

export function progress(ids, preparedMap) {
  const total = ids.length;
  const preparedCount = ids.filter((id) => preparedMap?.[id] === true).length;
  return {
    total,
    prepared: preparedCount,
    remaining: total - preparedCount,
    percent: total === 0 ? 0 : Math.round((preparedCount / total) * 100),
  };
}

// Derived only from the source wording of the document text,
// not from any data field in the scholarship record.
export function isConditionalDocument(text) {
  return /\b(where applicable|as applicable|if applicable|for applicable|where required|if required|if any)\b/i.test(text);
}

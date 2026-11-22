import { useState } from 'react';
import { loadRecords, progressRecords, writeRecord } from '../checklistLogic.js';

// Checklist data stays on this browser; it is not uploaded or linked to an account.
export default function SchemeDocumentChecklist({ scheme, onChange }) {
  const documents = Array.isArray(scheme?.document_requirements)
    ? scheme.document_requirements.filter(item => typeof item === 'string') : [];
  const [version, setVersion] = useState(0);
  if (!scheme?.slug || !documents.length) return null;
  const loaded = loadRecords(window.localStorage, scheme.slug, documents);
  const stats = progressRecords(loaded.ids, loaded.records, loaded.conditional);
  function toggle(id, checked) {
    const old = loaded.records[id] || { prepared: false, applicability: 'needed' };
    const saved = writeRecord(window.localStorage, scheme.slug, id, { ...old, prepared: checked });
    setVersion(value => value + 1);
    onChange?.();
    if (!saved) window.alert('Could not save checklist progress in this browser.');
  }
  return <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/40 p-4" data-checklist-version={version}>
    <p className="font-semibold text-slate-900">Documents prepared: {stats.prepared} of {stats.total}</p>
    <p className="mt-1 text-xs text-slate-500">Saved on this browser only; not synced to your account. Do not upload identity documents here.</p>
    <ul className="mt-3 space-y-3">{documents.map((doc, index) => {
      const id = loaded.ids[index];
      const record = loaded.records[id] || {};
      return <li key={id}><label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" className="mt-1 accent-violet-600" checked={record.prepared === true}
          onChange={event => toggle(id, event.target.checked)} />
        <span>{doc}</span>
      </label></li>;
    })}</ul>
  </div>;
}

import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, LoaderCircle, ShieldCheck } from "lucide-react";
import {
  isConditionalDocument,
  loadChecklist,
  progress,
  writePrepared,
} from "../checklistLogic.js";

const SAVE_WARNING = "Progress could not be saved in this browser.";

// Only strings are treated as document text; anything else is ignored so a
// malformed document_requirements value cannot break the render.
function normalizeDocuments(requirements) {
  if (!Array.isArray(requirements)) return [];
  return requirements.filter((doc) => typeof doc === "string");
}

function pickVerifiedScheme(schemes) {
  return (
    schemes.find(
      (s) =>
        s &&
        s.verification_status === "VERIFIED" &&
        s.is_illustrative !== true
    ) || null
  );
}

export default function DocumentChecklist() {
  const [loadState, setLoadState] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [scheme, setScheme] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [ids, setIds] = useState([]);
  const [preparedMap, setPreparedMap] = useState({});
  const [saveWarning, setSaveWarning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSchemes() {
      setLoadState("loading");
      try {
        const response = await fetch("/api/schemes");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        const verified = pickVerifiedScheme(list);

        if (verified) {
          const docs = normalizeDocuments(verified.document_requirements);
          const checklist = loadChecklist(
            window.localStorage,
            verified.slug,
            docs
          );
          setScheme(verified);
          setDocuments(docs);
          setIds(checklist.ids);
          setPreparedMap(checklist.prepared);
        } else {
          setScheme(null);
          setDocuments([]);
          setIds([]);
          setPreparedMap({});
        }
        setSaveWarning(false);
        setLoadState("ready");
      } catch {
        if (!cancelled) {
          setLoadState("error");
        }
      }
    }

    void loadSchemes();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function toggleDocument(id) {
    const next = !preparedMap[id];
    const saved = writePrepared(window.localStorage, scheme.slug, id, next);
    setPreparedMap((prev) => ({ ...prev, [id]: next }));
    setSaveWarning(!saved);
  }

  function resetChecklist() {
    let allSaved = true;
    const cleared = {};
    for (const id of ids) {
      const saved = writePrepared(window.localStorage, scheme.slug, id, false);
      if (!saved) allSaved = false;
      cleared[id] = false;
    }
    setPreparedMap(cleared);
    setSaveWarning(!allSaved);
  }

  function renderBody() {
    if (loadState === "loading") {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Loading documents…</span>
        </div>
      );
    }

    if (loadState === "error") {
      return (
        <div className="space-y-3">
          <p className="text-red-600">Could not load scheme information.</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-white sm:w-auto"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!scheme) {
      return (
        <p className="text-slate-600">
          No verified scheme available. Check back later.
        </p>
      );
    }

    const stats = progress(ids, preparedMap);
    const allDone = stats.total > 0 && stats.remaining === 0;

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-[#101B3B]">{scheme.name}</p>
        </div>

        <div className="space-y-2">
          <div
            role="progressbar"
            aria-label="Documents prepared"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats.percent}
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-600">
            <span>
              {stats.prepared} of {stats.total} prepared
            </span>
            <span>{stats.remaining} remaining</span>
            <span>{stats.percent}%</span>
          </div>
          {allDone && (
            <p className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              All listed documents are prepared.
            </p>
          )}
        </div>

        {documents.length === 0 ? (
          <p className="text-slate-600">
            No documents are listed for this scheme.
          </p>
        ) : (
          <ul className="space-y-3">
            {documents.map((text, index) => {
              const id = ids[index];
              const checked = preparedMap[id] === true;
              const conditional = isConditionalDocument(text);
              return (
                <li
                  key={id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start"
                >
                  <label
                    htmlFor={`doc-${id}`}
                    className="flex flex-1 cursor-pointer items-start gap-3"
                  >
                    <input
                      id={`doc-${id}`}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDocument(id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
                    />
                    <span className="flex flex-col gap-1">
                      <span className="text-slate-800">{text}</span>
                      {conditional && (
                        <span className="w-fit rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                          Conditional — applies only if relevant to you
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {saveWarning && (
          <p role="alert" className="text-sm text-red-600">
            {SAVE_WARNING}
          </p>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
          <p>
            Keep originals ready. SchemeSathi does not collect, upload or store
            your certificates or ID numbers.
          </p>
        </div>

        {documents.length > 0 && (
          <button
            type="button"
            onClick={resetChecklist}
            className="w-full rounded-lg border border-indigo-600 px-5 py-3 text-indigo-600 sm:w-auto"
          >
            Reset checklist
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardList className="text-indigo-600" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-[#101B3B]">Document checklist</h2>
        </div>
        <p className="text-sm text-slate-500">
          Tick off the documents you have ready for a verified scheme.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-4 sm:p-6">{renderBody()}</div>
    </section>
  );
}

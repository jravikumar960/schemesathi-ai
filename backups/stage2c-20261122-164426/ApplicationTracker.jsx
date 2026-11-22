import { useEffect, useState } from "react";
import { CalendarClock, ClipboardList } from "lucide-react";
import { loadRecords, progressRecords } from "../checklistLogic.js";
import { getOrCreateSessionKey } from "../sessionLogic.js";
import { groupTrackerRecords, categorizeSchemes } from "../schemeLogic.js";
import { formatDisplayDate } from "../deadlineLogic.js";

const STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "COMPLETED",
];

function getSessionKey() {
  return getOrCreateSessionKey(window.localStorage, () => crypto.randomUUID());
}

// Deadlines are optional: any failure returns null so applications still load.
async function requestDeadlines() {
  try {
    const response = await fetch("/api/deadlines");
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function describeDeadline(deadline) {
  if (!deadline) return "Deadline unavailable";
  switch (deadline.deadline_status) {
    case "UPCOMING":
      return `Deadline: ${formatDisplayDate(deadline.deadline)} — ${deadline.days_remaining} days left`;
    case "EXPIRED":
      return `Deadline passed on ${formatDisplayDate(deadline.deadline)}`;
    case "NO_VERIFIED_DEADLINE":
      return "No verified deadline available. Check the official portal.";
    case "UNVERIFIED":
      return "Deadline not verified";
    default:
      return "Deadline unavailable";
  }
}

function nextActionText(status, remaining) {
  if (status === "COMPLETED") return "Completed";
  if (remaining > 0) {
    return `Prepare ${remaining} remaining document(s) in the checklist`;
  }
  if (status === "NOT_STARTED") {
    return "Start your application on the official portal";
  }
  return "Keep the official portal updated and check the deadline";
}

export default function ApplicationTracker() {
  const [sessionKey] = useState(getSessionKey);
  const [schemes, setSchemes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const { verified: verifiedApps, other: nonVerifiedApps } =
    groupTrackerRecords(applications, schemes);
  const pendingSlugs = new Set(
    schemes.filter((scheme) =>
      scheme.verification_status === "UNVERIFIED_PROGRAMME" &&
      scheme.is_illustrative === false
    ).map((scheme) => scheme.slug)
  );
  const pendingApps = nonVerifiedApps.filter(
    (application) => pendingSlugs.has(application.scheme_slug)
  );
  const demoApps = nonVerifiedApps.filter(
    (application) => !pendingSlugs.has(application.scheme_slug)
  );
  const {
    verified: verifiedOptions,
    unverified: pendingOptions,
    illustrative: demoOptions,
  } = categorizeSchemes(schemes);

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : `HTTP ${response.status}`
      );
    }

    return data;
  }

  async function loadData() {
    setLoading(true);
    try {
      const [schemeData, applicationData] = await Promise.all([
        api("/api/schemes"),
        api(`/api/applications?session_key=${encodeURIComponent(sessionKey)}`),
      ]);

      setSchemes(
        Array.isArray(schemeData) ? schemeData : schemeData.schemes || []
      );
      setApplications(applicationData);
      setError("");
    } catch (err) {
      setError(err.message);
    }

    const deadlineData = await requestDeadlines();
    setDeadlines(deadlineData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialData() {
      setLoading(true);
      try {
        const [schemeResponse, applicationResponse] = await Promise.all([
          fetch("/api/schemes"),
          fetch(`/api/applications?session_key=${encodeURIComponent(sessionKey)}`),
        ]);

        if (!schemeResponse.ok || !applicationResponse.ok) {
          throw new Error("Unable to load application tracking data.");
        }

        const [schemeData, applicationData] = await Promise.all([
          schemeResponse.json(),
          applicationResponse.json(),
        ]);

        if (cancelled) return;

        setSchemes(
          Array.isArray(schemeData) ? schemeData : schemeData.schemes || []
        );
        setApplications(applicationData);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function fetchInitialDeadlines() {
      const deadlineData = await requestDeadlines();
      if (!cancelled) {
        setDeadlines(deadlineData ?? []);
      }
    }

    void fetchInitialData();
    void fetchInitialDeadlines();

    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

  async function addApplication(event) {
    event.preventDefault();

    if (!selectedScheme) return;

    try {
      await api("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          session_key: sessionKey,
          scheme_slug: selectedScheme,
        }),
      });

      setNotice("Application added successfully.");
      setSelectedScheme("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api(
        `/api/applications/${id}?session_key=${encodeURIComponent(sessionKey)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setNotice("Status updated successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function renderCardDetails(application) {
    const scheme = schemes.find((s) => s.slug === application.scheme_slug);
    const loaded = scheme
      ? loadRecords(
          window.localStorage,
          scheme.slug,
          scheme.document_requirements || []
        )
      : null;
    const readiness = loaded
      ? progressRecords(loaded.ids, loaded.records, loaded.conditional)
      : null;
    const hasDocuments = readiness !== null && readiness.total > 0;
    const remaining = hasDocuments ? readiness.remaining : 0;
    const deadline = deadlines.find(
      (d) => d.slug === application.scheme_slug
    );

    return (
      <div className="mt-3 space-y-2 text-sm">
        <p className="text-slate-700">
          {hasDocuments
            ? `Documents: ${readiness.prepared} of ${readiness.total} prepared`
            : "No document list"}
        </p>

        <p className="flex items-center gap-2 text-slate-700">
          <CalendarClock size={16} className="text-indigo-600" />
          <span>{describeDeadline(deadline)}</span>
        </p>

        <p className="font-medium text-slate-800">
          Next action: {nextActionText(application.status, remaining)}
        </p>
      </div>
    );
  }

  function renderApplicationCard(application) {
    const scheme = schemes.find((item) => item.slug === application.scheme_slug);
    const name = scheme?.name || application.scheme_slug;

    return (
      <article key={application.id} className="min-w-0 rounded-2xl border bg-white p-5">
        <h3 className="break-words font-semibold">{name}</h3>
        <p className="mt-1 text-xs text-amber-700">
          Tracking record only - not an official application status.
        </p>
        {renderCardDetails(application)}
        <select
          value={application.status}
          aria-label={`Status for ${name}`}
          onChange={(event) => updateStatus(application.id, event.target.value)}
          className="mt-4 w-full rounded-lg border p-3"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </article>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Application Tracker</h2>
        <p className="text-sm text-slate-500">
          Track scholarship applications and update their progress.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="text-indigo-600" />
          <h3 className="font-semibold">Add Application</h3>
        </div>

        <form onSubmit={addApplication} className="flex flex-wrap gap-3">
          <select
            value={selectedScheme}
            aria-label="Scholarship to track"
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="flex-1 rounded-lg border p-3"
          >
            <option value="">Select scholarship</option>

            <optgroup label="Verified scholarships">
              {verifiedOptions.map((scheme) => (
                <option key={scheme.slug} value={scheme.slug}>
                  {scheme.name}
                </option>
              ))}
            </optgroup>
            {pendingOptions.length > 0 && (
              <optgroup label="Needs Official Confirmation">
                {pendingOptions.map((scheme) => (
                  <option key={scheme.slug} value={scheme.slug}>
                    {scheme.name} (Unverified)
                  </option>
                ))}
              </optgroup>
            )}
            {demoOptions.length > 0 && (
              <optgroup label="Illustrative demo records only">
                {demoOptions.map((scheme) => (
                  <option key={scheme.slug} value={scheme.slug}>
                    {scheme.name} (Demo)
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-3 text-white"
          >
            Add Tracking
          </button>
        </form>

        {error && <p className="mt-3 text-red-600">{error}</p>}
        {notice && <p className="mt-3 text-green-700">{notice}</p>}
      </div>

      {loading && (
        <p role="status" className="rounded-2xl bg-white p-5 text-sm text-slate-600">
          Loading tracked applications...
        </p>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={loadData}
            className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-sm text-slate-600">
          No applications tracked yet. Choose a scholarship above to start.
        </p>
      )}

      {!loading && verifiedApps.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-bold">Verified scholarship tracking</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {verifiedApps.map((application) => renderApplicationCard(application))}
          </div>
        </div>
      )}

      {!loading && pendingApps.length > 0 && (
        <details className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <summary className="cursor-pointer font-semibold text-amber-900">
            Needs Official Confirmation Tracking ({pendingApps.length})
          </summary>
          <p className="mt-3 text-sm text-amber-800">
            Personal tracking notes only. Eligibility and application
            instructions for these programmes have not been verified.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {pendingApps.map((application) => renderApplicationCard(application))}
          </div>
        </details>
      )}

      {!loading && demoApps.length > 0 && (
        <details className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <summary className="cursor-pointer font-semibold text-amber-900">
            Illustrative Demo Tracking ({demoApps.length})
          </summary>
          <p className="mt-3 text-sm text-amber-800">
            These are local tracking records for unverified or illustrative schemes,
            not confirmed government scholarship applications.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {demoApps.map((application) => renderApplicationCard(application))}
          </div>
        </details>
      )}
    </section>
  );
}


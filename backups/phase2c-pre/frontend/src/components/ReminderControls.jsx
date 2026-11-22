import { useEffect, useRef, useState } from "react";
import { Bell, LoaderCircle } from "lucide-react";
import {
  REMINDER_INTERVAL_OPTIONS,
  dueReminder,
  loadFired,
  loadPrefs,
  markFired,
  normalizeIntervals,
  notificationStatus,
  savePrefs,
} from "../reminderLogic";

const INTERVAL_LABELS = {
  7: "7 days before",
  3: "3 days before",
  1: "1 day before",
};

// Only upcoming items with a real ISO deadline and an integer day count can be scheduled.
// Returns { ok: true, items } or { ok: false, message }. Never throws.
async function loadSchedulable() {
  try {
    const response = await fetch("/api/deadlines");
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, message: "Unable to load reminder data right now. Please try again." };
    }
    if (!Array.isArray(data)) {
      return { ok: false, message: "Unexpected response from the deadlines service." };
    }
    const items = data
      .filter(
        (item) =>
          item &&
          item.deadline_status === "UPCOMING" &&
          typeof item.deadline === "string" &&
          item.deadline !== "" &&
          Number.isInteger(item.days_remaining)
      )
      .map((item) => ({
        slug: item.slug,
        name: item.name,
        deadline: item.deadline,
        daysRemaining: item.days_remaining,
      }));
    return { ok: true, items };
  } catch {
    return { ok: false, message: "Unable to reach the deadlines service. Please try again." };
  }
}

export default function ReminderControls() {
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [items, setItems] = useState([]);
  const [prefs, setPrefs] = useState(() => loadPrefs(window.localStorage));
  const [fired, setFired] = useState(() => loadFired(window.localStorage));
  const [saveFailed, setSaveFailed] = useState(false);
  const [permission, setPermission] = useState(() => notificationStatus(window.Notification));
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    let active = true;
    loadSchedulable().then((result) => {
      if (!active) return;
      if (result.ok) {
        setItems(result.items);
        setLoadState("ready");
      } else {
        setLoadError(result.message);
        setLoadState("error");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function retry() {
    setLoadState("loading");
    setLoadError("");
    loadSchedulable().then((result) => {
      if (result.ok) {
        setItems(result.items);
        setLoadState("ready");
      } else {
        setLoadError(result.message);
        setLoadState("error");
      }
    });
  }

  const hasSchedulable = loadState === "ready" && items.length > 0;
  const controlsDisabled = !hasSchedulable;

  const dueAlerts =
    prefs.enabled && hasSchedulable
      ? items.flatMap((item) => {
          const reminder = dueReminder({
            schemeSlug: item.slug,
            deadlineIso: item.deadline,
            daysRemaining: item.daysRemaining,
            intervals: prefs.intervals,
            fired,
          });
          return reminder ? [{ ...reminder, name: item.name }] : [];
        })
      : [];

  // Browser notifications: at most one per reminder key, tracked in a ref so
  // re-renders never notify twice. Permission is only requested by the button below.
  useEffect(() => {
    if (permission !== "granted") return;
    for (const alert of dueAlerts) {
      if (notifiedRef.current.has(alert.key)) continue;
      notifiedRef.current.add(alert.key);
      try {
        new window.Notification(alert.message);
      } catch {
        // The browser refused; the in-app alert is still shown.
      }
    }
  }, [dueAlerts, permission]);

  function updatePrefs(next) {
    setPrefs(next);
    setSaveFailed(!savePrefs(window.localStorage, next));
  }

  function toggleInterval(value) {
    const selected = prefs.intervals.includes(value);
    if (selected && prefs.intervals.length === 1) return;
    const next = selected
      ? prefs.intervals.filter((interval) => interval !== value)
      : [...prefs.intervals, value];
    updatePrefs({ ...prefs, intervals: normalizeIntervals(next) });
  }

  function dismiss(key) {
    setFired(markFired(window.localStorage, fired, [key]));
  }

  function requestNotificationPermission() {
    if (!window.Notification) return;
    Promise.resolve()
      .then(() => window.Notification.requestPermission())
      .then(() => setPermission(notificationStatus(window.Notification)))
      .catch(() => setPermission(notificationStatus(window.Notification)));
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          <Bell size={22} />
        </div>
        <div>
          <h3 className="text-xl font-bold">Deadline reminders</h3>
          <p className="text-sm text-slate-500">
            Choose when SchemeSathi should remind you about a verified upcoming deadline.
          </p>
        </div>
      </div>

      {loadState === "loading" && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          <LoaderCircle size={18} className="animate-spin" />
          Loading reminder schedule...
        </div>
      )}

      {loadState === "error" && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={retry}
            className="rounded-xl bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {loadState === "ready" && items.length === 0 && (
        <p className="mb-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          Reminders are unavailable: no verified upcoming deadline is recorded.
        </p>
      )}

      {saveFailed && (
        <p role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Your reminder settings could not be saved in this browser.
        </p>
      )}

      <fieldset disabled={controlsDisabled} className="space-y-6 disabled:opacity-50">
        <legend className="sr-only">Reminder settings</legend>

        <label className="flex items-center gap-3 text-sm font-semibold text-slate-900">
          <input
            type="checkbox"
            checked={prefs.enabled}
            onChange={(event) => updatePrefs({ ...prefs, enabled: event.target.checked })}
            className="h-5 w-5 accent-indigo-600"
          />
          Enable in-app reminders
        </label>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900">Remind me</p>
          <div className="flex flex-wrap gap-3">
            {REMINDER_INTERVAL_OPTIONS.map((value) => {
              const selected = prefs.intervals.includes(value);
              const lastSelected = selected && prefs.intervals.length === 1;
              return (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={lastSelected}
                    onChange={() => toggleInterval(value)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {INTERVAL_LABELS[value] ?? `${value} days before`}
                </label>
              );
            })}
          </div>
        </div>

        {prefs.enabled && permission === "default" && (
          <button
            type="button"
            onClick={requestNotificationPermission}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Enable browser notifications
          </button>
        )}

        {prefs.enabled && permission === "denied" && (
          <p className="text-sm text-amber-800">
            Browser notifications are blocked in your browser settings. In-app reminders still work.
          </p>
        )}

        {prefs.enabled && permission === "unsupported" && (
          <p className="text-sm text-amber-800">
            This browser does not support notifications. In-app reminders still work.
          </p>
        )}
      </fieldset>

      {dueAlerts.length > 0 && (
        <div className="mt-6 space-y-3">
          {dueAlerts.map((alert) => (
            <div
              key={alert.key}
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {alert.name}
                </p>
                <p className="text-sm font-medium text-indigo-950">{alert.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(alert.key)}
                className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs leading-6 text-slate-500">
        Notifications appear only while SchemeSathi is open in a browser tab. They are not guaranteed when the site is closed, and no server sends them.
      </p>
    </div>
  );
}

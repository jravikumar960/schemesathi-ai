import { useEffect, useMemo, useRef, useState } from "react";
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
  const [testNotice, setTestNotice] = useState("");
  const notifiedRef = useRef(new Set());
  const requestIdRef = useRef(0);

  // Refresh the schedule when the tab becomes visible and periodically while open.
  // A response from an older request must never overwrite a newer one.
  async function refreshSchedule() {
    const requestId = ++requestIdRef.current;
    const result = await loadSchedulable();
    if (requestId !== requestIdRef.current) return;
    if (result.ok) {
      setItems(result.items);
      setLoadError("");
      setLoadState("ready");
    } else {
      setLoadError(result.message);
      setLoadState("error");
    }
  }

  useEffect(() => {
    let active = true;
    const requestIds = requestIdRef;
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSchedule();
    };
    // Defer initial refresh to a microtask to avoid synchronous state updates
    // in the effect body; skip it if the component has already unmounted.
    Promise.resolve().then(() => {
      if (active) refreshSchedule();
    });
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshSchedule();
    }, 60_000);
    return () => {
      active = false;
      ++requestIds.current;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, []);

  function retry() {
    setLoadState("loading");
    setLoadError("");
    refreshSchedule();
  }

  const hasSchedulable = loadState === "ready" && items.length > 0;
  const controlsDisabled = !hasSchedulable;

  const dueAlerts = useMemo(() => {
    if (!prefs.enabled || !hasSchedulable) return [];
    return items.flatMap((item) => {
      const reminder = dueReminder({
        schemeSlug: item.slug,
        deadlineIso: item.deadline,
        daysRemaining: item.daysRemaining,
        intervals: prefs.intervals,
        fired,
      });
      return reminder ? [{ ...reminder, name: item.name }] : [];
    });
  }, [prefs, items, fired, hasSchedulable]);

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
    // Call directly from the click handler: some browsers require user activation.
    try {
      Promise.resolve(window.Notification.requestPermission())
        .then(() => setPermission(notificationStatus(window.Notification)))
        .catch(() => setPermission(notificationStatus(window.Notification)));
    } catch {
      setPermission(notificationStatus(window.Notification));
    }
  }

  async function sendTestNotification() {
    setTestNotice("");
    if (!window.Notification) {
      setTestNotice("Browser notifications are unsupported here. Your in-app reminders still work while the page is open.");
      return;
    }
    try {
      let status = window.Notification.permission;
      if (status === "default") status = await window.Notification.requestPermission();
      setPermission(status);
      if (status !== "granted") {
        setTestNotice("Notification permission was not granted. Check browser site settings.");
        return;
      }
      new window.Notification("SchemeSathi test reminder", {
        body: "This is a test only. Actual deadline alerts require this tab to stay open.",
      });
      setTestNotice("Test notification requested. Check your browser or operating-system notification settings if it is not visible.");
    } catch {
      setTestNotice("The browser could not display a test notification. Try localhost and review site permissions.");
    }
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

      {loadState === "ready" && items.length > 0 && (
        <p className="mb-5 text-sm text-slate-600">
          {items.length} upcoming verified deadline(s) monitored while this page is open.
          Alerts appear only when the selected day threshold is reached; enabling reminders does not send an immediate test notification.
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

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Test browser notification</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">This is a manual demo test, not a scheduled deadline alert. Browser permission and operating-system settings affect delivery.</p>
        <button type="button" onClick={sendTestNotification} className="mt-3 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Send test notification</button>
        {testNotice && <p role="status" className="mt-2 text-xs text-slate-700">{testNotice}</p>}
      </div>

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
        Reminders are browser-only and require SchemeSathi to remain open. Closing the tab stops delivery; these are not email, SMS, or scheduled background notifications.
      </p>
    </div>
  );
}

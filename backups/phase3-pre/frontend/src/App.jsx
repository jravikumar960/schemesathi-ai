import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import ScholarshipRecommendation from "./components/ScholarshipRecommendation";
import ApplicationTracker from "./components/ApplicationTracker";
import SchemeExplorer from "./components/SchemeExplorer";
import DocumentChecklist from "./components/DocumentChecklist";
import DeadlineDashboard from "./components/DeadlineDashboard";
import ReminderControls from "./components/ReminderControls";

const journey = [
  { icon: MessageSquareText, title: "Tell us", description: "Your situation" },
  { icon: CheckCircle2, title: "Check", description: "Income rules" },
  { icon: FileCheck2, title: "Prepare", description: "Your documents" },
  { icon: ClipboardCheck, title: "Track", description: "Your application" },
];

const examples = [
  "I am a BC student from an urban area. My annual family income is 1.8 lakh.",
  "I belong to the SC category. My annual family income is 2 lakh.",
  "I am an ST student. My annual family income is 2.5 lakh.",
];

function formatField(key) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(key, value) {
  if (key.includes("income") && typeof value === "number") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return String(value);
}

export default function App() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkEligibility(event) {
    event.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setRecommendation(null);
    setProfile({});

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to process your request."
        );
      }

      setAnswer(data.response || "");
      setRecommendation(data.recommendation || null);
      setProfile(data.extracted_profile || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const incomeStatus = recommendation?.income_assessment?.status;
  const statusLabel =
    incomeStatus === "PASS"
      ? "Income check passed"
      : incomeStatus === "FAIL"
        ? "Income limit exceeded"
        : "More information needed";

  return (
    <div className="min-h-screen bg-[#F5F7FC] text-slate-900">
      <header className="border-b border-white/10 bg-[#101B3B] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <a href="#home" className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-500 p-3">
              <GraduationCap size={25} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">
                SchemeSathi <span className="text-indigo-300">AI</span>
              </div>
              <div className="text-xs text-slate-300">
                Your scholarship companion
              </div>
            </div>
          </a>

          <nav aria-label="Main navigation" className="flex flex-wrap gap-5 text-sm text-slate-200">
            <a className="hover:text-white" href="#assessment">Assessment</a>
            <a className="hover:text-white" href="#scholarships">Scholarships</a>
            <a className="hover:text-white" href="#documents">Documents</a>
            <a className="hover:text-white" href="#applications">My applications</a>
            <a className="hover:text-white" href="#deadlines">Deadlines</a>
          </nav>

          <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-2 text-xs text-indigo-200">
            Telangana pilot
          </span>
        </div>
      </header>

      <main id="home">
        <section className="relative overflow-hidden bg-[#101B3B] pb-28 pt-14 text-white">
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-4 py-2 text-xs font-semibold text-indigo-200">
                <Sparkles size={15} />
                CLAIM WHAT'S YOURS
              </div>

              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Your future deserves
                <span className="block text-indigo-300">every opportunity.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                Understand scholarship income requirements, find official
                application guidance, prepare documents, and keep your
                applications organised in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#assessment"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
                >
                  Check my options <ArrowRight size={18} />
                </a>
                <a
                  href="#scholarships"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Explore scholarships <BookOpen size={18} />
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-400/20 p-3 text-indigo-200">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="font-semibold">Guidance you can understand</p>
                  <p className="text-sm text-slate-300">
                    Transparent rules, official sources
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  ["01", "Describe your circumstances"],
                  ["02", "Understand the income check"],
                  ["03", "Review documents and next steps"],
                  ["04", "Track your application progress"],
                ].map(([number, title]) => (
                  <div
                    key={number}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <span className="text-sm font-bold text-indigo-300">{number}</span>
                    <span className="flex-1 text-sm font-medium">{title}</span>
                    <ChevronRight size={17} className="text-slate-400" />
                  </div>
                ))}
              </div>

              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-300">
                <LockKeyhole size={15} className="mt-0.5 shrink-0" />
                No Aadhaar or PAN numbers needed. Preliminary guidance only.
              </p>
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-14 max-w-7xl px-5 lg:px-8">
          <div className="grid grid-cols-2 gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 md:grid-cols-4">
            {journey.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl p-3">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <Icon size={22} />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400">
                    STEP {index + 1}
                  </div>
                  <div className="font-bold">{title}</div>
                  <div className="text-xs text-slate-500">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-14 px-5 py-14 lg:px-8">
          <section id="assessment" className="scroll-mt-8">
            <div className="mb-7">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <MessageSquareText size={17} />
                SCHOLARSHIP ASSESSMENT
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                Let's find your starting point.
              </h2>
              <p className="mt-2 text-slate-500">
                Tell us your category, residence, and annual family income.
                We'll explain the preliminary income assessment.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Describe your situation</h3>
                    <p className="text-sm text-slate-500">
                      Use everyday language. No forms or identity numbers required.
                    </p>
                  </div>
                </div>

                <form onSubmit={checkEligibility}>
                  <label htmlFor="student-message" className="mb-2 block text-sm font-semibold">
                    About you
                  </label>
                  <textarea
                    id="student-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={2000}
                    placeholder="Example: I'm a BC student living in an urban area. My annual family income is 1.8 lakh."
                    className="min-h-40 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-5 leading-7 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />

                  <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Try an example
                  </p>
                  <div className="mb-6 flex flex-wrap gap-2">
                    {examples.map((example, index) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setMessage(example)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        Example {index + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {loading ? (
                      <LoaderCircle size={19} className="animate-spin" />
                    ) : (
                      <Send size={19} />
                    )}
                    {loading ? "Checking your information..." : "Check my scholarship options"}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </form>

                {error && (
                  <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {answer && (
                  <div aria-live="polite" className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <h4 className="font-bold text-indigo-950">Your preliminary assessment</h4>
                      {recommendation && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                      {answer}
                    </p>
                  </div>
                )}
              </div>

              <aside className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                      <Wallet size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Your profile</h3>
                      <p className="text-xs text-slate-500">
                        Extracted from your description
                      </p>
                    </div>
                  </div>

                  {Object.keys(profile).length ? (
                    <dl className="space-y-4">
                      {Object.entries(profile).map(([key, value]) => (
                        <div key={key} className="border-b border-slate-100 pb-3 last:border-0">
                          <dt className="text-xs font-medium text-slate-500">
                            {formatField(key)}
                          </dt>
                          <dd className="mt-1 font-semibold text-slate-900">
                            {formatValue(key, value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-6 text-center">
                      <GraduationCap size={32} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-sm text-slate-500">
                        Your information will appear here after assessment.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                  <div className="mb-3 flex items-center gap-2 font-bold text-emerald-900">
                    <ShieldCheck size={21} />
                    Your privacy matters
                  </div>
                  <p className="text-sm leading-7 text-emerald-900">
                    Never submit Aadhaar, PAN, passport numbers, or other sensitive
                    identifiers. This is a preliminary income assessment, not a
                    government eligibility decision.
                  </p>
                </div>
              </aside>
            </div>

            {recommendation && (
              <div className="mt-7">
                <ScholarshipRecommendation recommendation={recommendation} />
              </div>
            )}
          </section>

          <section id="scholarships" className="scroll-mt-8">
            <SchemeExplorer />
          </section>

          <section id="documents" className="scroll-mt-8">
            <DocumentChecklist />
          </section>

          <section id="applications" className="scroll-mt-8">
            <ApplicationTracker />
          </section>

          <section id="deadlines" className="scroll-mt-8 space-y-6">
            <DeadlineDashboard />
            <ReminderControls />
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
        SchemeSathi AI · Hackathon prototype · Not an official government service
      </footer>
    </div>
  );
}

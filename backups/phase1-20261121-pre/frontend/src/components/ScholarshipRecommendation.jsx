import { ExternalLink, FileText, ShieldCheck } from "lucide-react";

export default function ScholarshipRecommendation({ recommendation }) {
  if (!recommendation) return null;

  const {
    scheme_name,
    description,
    benefit_summary,
    income_assessment,
    document_requirements = [],
    application_steps = [],
    official_url,
    source_verified_on,
    disclaimer,
  } = recommendation;

  const status = income_assessment?.status || "NEEDS_INFORMATION";
  const reason = income_assessment?.reason || "More information is required.";

  const statusStyles = {
    PASS: "bg-emerald-100 text-emerald-800",
    FAIL: "bg-red-100 text-red-800",
    NEEDS_INFORMATION: "bg-amber-100 text-amber-800",
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-indigo-600">
        <ShieldCheck size={20} />
        <span className="text-sm font-semibold">
          Official programme information
        </span>
      </div>

      <h3 className="text-xl font-bold">{scheme_name}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <p className="mt-3 text-sm font-medium">{benefit_summary}</p>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold">Income assessment</span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              statusStyles[status] || statusStyles.NEEDS_INFORMATION
            }`}
          >
            {status.replaceAll("_", " ")}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6">{reason}</p>

        <p className="mt-2 text-xs font-semibold text-amber-800">
          Overall scholarship eligibility: NOT DETERMINED
        </p>
      </div>

      <details className="mt-5 rounded-xl border border-slate-200 p-4">
        <summary className="flex cursor-pointer items-center gap-2 font-semibold">
          <FileText size={18} />
          Document checklist ({document_requirements.length})
        </summary>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
          {document_requirements.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </details>

      <details className="mt-3 rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-semibold">
          How to apply ({application_steps.length} steps)
        </summary>

        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm">
          {application_steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </details>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <a
          href={official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Open Telangana ePASS
          <ExternalLink size={16} />
        </a>

        {source_verified_on && (
          <span className="text-xs text-slate-500">
            Source recorded: {source_verified_on}
          </span>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        {disclaimer}
      </p>
    </section>
  );
}

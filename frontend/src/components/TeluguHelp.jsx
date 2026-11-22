import { useState } from "react";

// Telugu is a reading aid only; the assessment engine still expects English.
const TERMS = [
  ["విద్యార్థి", "Student"],
  ["కుటుంబ వార్షిక ఆదాయం", "Annual family income"],
  ["కుల వర్గం", "Social category"],
  ["దరఖాస్తు గడువు", "Application deadline"],
  ["అవసరమైన పత్రాలు", "Required documents"],
];

export default function TeluguHelp({ onUseExample }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="text-sm font-semibold text-violet-800">
        {open ? "Hide Telugu help" : "తెలుగు సహాయం / Telugu help"}
      </button>
      {open && <div className="mt-3 space-y-3 text-sm text-slate-700">
        <p>తెలుగులో మార్గదర్శకం మాత్రమే. అర్హత తనిఖీ కోసం ప్రస్తుతం ఆంగ్లంలో వివరాలు ఇవ్వండి.</p>
        <p className="text-xs text-slate-600">Telugu reading assistance only. Eligibility assessment currently uses English input; this is not automatic translation.</p>
        <dl className="grid gap-2 sm:grid-cols-2">{TERMS.map(([telugu, english]) => <div key={english} className="rounded-lg bg-white p-2"><dt lang="te" className="font-medium">{telugu}</dt><dd className="text-xs text-slate-500">{english}</dd></div>)}</dl>
        <p lang="te">నేను తెలంగాణలో బీటెక్ చదువుతున్న విద్యార్థిని. మా కుటుంబ వార్షిక ఆదాయం రూ.1.8 లక్షలు.</p>
        <button type="button" onClick={() => onUseExample("I am a student studying B.Tech in Telangana. My annual family income is ₹1.8 lakh.")} className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-800">Use English equivalent in assessment</button>
      </div>}
    </div>
  );
}

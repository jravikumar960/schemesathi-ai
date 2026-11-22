const SECTIONS = [
  { key: "eligible", heading: "Eligible on available rules" },
  { key: "needs_information", heading: "Needs more information" },
  { key: "not_eligible", heading: "Not eligible on available rules" },
  { key: "not_determined", heading: "Not determined (rules not verified)" },
];

export default function SchemeGroups({ groups }) {
  if (!groups) return null;

  const lists = SECTIONS.map((section) => ({
    ...section,
    items: groups?.[section.key] ?? [],
  }));

  if (lists.every((section) => section.items.length === 0)) return null;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">
        Scheme status overview
      </h3>
      <p className="mt-1 text-sm text-slate-700">
        Based on the information you gave. This is not a final decision; check
        the official portal.
      </p>

      {lists
        .filter((section) => section.items.length > 0)
        .map((section) => (
          <div key={section.key} className="mt-4">
            <h4 className="text-sm font-semibold text-slate-800">
              {section.heading}
            </h4>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {section.items.map((item) => (
                <li
                  key={item.scheme_slug ?? item.scheme_name}
                  className="text-sm text-slate-700"
                >
                  {item.scheme_name}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

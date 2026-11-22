export function isVerifiedScheme(scheme) {
  return (
    scheme !== null &&
    typeof scheme === "object" &&
    scheme.verification_status === "VERIFIED" &&
    scheme.is_illustrative === false
  );
}

export function partitionSchemes(items) {
  const verified = [];
  const other = [];

  for (const item of items) {
    if (isVerifiedScheme(item)) {
      verified.push(item);
    } else {
      other.push(item);
    }
  }

  return { verified, other };
}
export function groupTrackerRecords(applications, schemes) {
  const verified = [];
  const other = [];

  const schemeMap = new Map(
    (Array.isArray(schemes) ? schemes : [])
      .filter(s => s && typeof s.slug === "string")
      .map(s => [s.slug, s])
  );

  for (const application of Array.isArray(applications) ? applications : []) {
    const scheme = schemeMap.get(application?.scheme_slug);

    if (isVerifiedScheme(scheme)) {
      verified.push(application);
    } else {
      other.push(application);
    }
  }

  return { verified, other };
}

export function groupTrackerOptions(schemes) {
  return partitionSchemes(Array.isArray(schemes) ? schemes : []);
}

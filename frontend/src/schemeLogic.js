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


export function categorizeSchemes(items) {
  const verified = [];
  const unverified = [];
  const illustrative = [];

  for (const scheme of Array.isArray(items) ? items : []) {
    if (isVerifiedScheme(scheme)) {
      verified.push(scheme);
    } else if (
      scheme?.verification_status === "UNVERIFIED_PROGRAMME" &&
      scheme?.is_illustrative === false
    ) {
      unverified.push(scheme);
    } else {
      illustrative.push(scheme);
    }
  }

  return { verified, unverified, illustrative };
}

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

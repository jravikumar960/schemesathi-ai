// Verified-scheme identification. A scheme counts as verified only when the
// API explicitly says so. A missing or non-boolean is_illustrative field is
// treated as NOT verified (fail safe).
export function isVerifiedScheme(scheme) {
  return (
    scheme !== null &&
    typeof scheme === "object" &&
    scheme.verification_status === "VERIFIED" &&
    scheme.is_illustrative === false
  );
}

/** @typedef {import('./types.js').UserProfile} UserProfile */

/**
 * Numeric comparison of dotted versions: `1.10` > `1.9`.
 * @returns {-1 | 0 | 1}
 */
export function compareVersions(a, b) {
  const left = String(a).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const right = String(b).split('.').map((part) => Number.parseInt(part, 10) || 0);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/**
 * @param {Partial<UserProfile> | null | undefined} profile
 * @param {string} currentTermsVersion
 * @returns {'intro' | 'terms' | 'done'}
 */
export function getOnboardingStep(profile, currentTermsVersion) {
  const accepted = profile?.termsAcceptedVersion;
  if (accepted && compareVersions(accepted, currentTermsVersion) >= 0) return 'done';
  return profile?.introSeen ? 'terms' : 'intro';
}

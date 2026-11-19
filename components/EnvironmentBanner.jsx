/**
 * EnvironmentBanner displays a subtle indicator for non-production environments
 * without leaking sensitive infrastructure details.
 */
export default function EnvironmentBanner() {
  const isDev = import.meta.env.DEV;
  if (!isDev) return null;

  // In development, return null to maintain clean CyberHub UI
  return null;
}

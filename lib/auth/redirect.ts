/**
 * Only allow same-origin relative paths as post-login destinations.
 * Blocks open redirects such as `//evil.com` or `/\evil.com`.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback = "/app",
): string {
  if (!value) return fallback;

  const path = value.trim();

  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;

  return path;
}

/**
 * Next.js instrumentation hook — runs once when the server boots.
 * Validates the environment without crashing, so /api/health can report
 * exactly what is missing.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { warnAboutEnv } = await import("./lib/env");
  warnAboutEnv();
}

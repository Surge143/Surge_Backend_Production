/**
 * Next.js instrumentation hook.
 * The slot-preparation cron is handled by server.ts (Croner) which calls
 * /api/cron/slot-preparation every minute — no logic needed here.
 */
export async function register() {
  // intentionally empty — cron runs via server.ts
}

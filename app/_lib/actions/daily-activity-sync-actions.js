/**
 * @file Unified Daily Activity sync façade — one entry point that reconciles
 *   every connected integration (Google Calendar/Tasks + Todoist) at once.
 *   Powers the page-load auto-sync and the header "Sync all" control so members
 *   don't have to push/pull each service separately. Each underlying action is
 *   best-effort and independently authorised; a failure in one never blocks the
 *   other.
 * @module daily-activity-sync-actions
 */

'use server';

import { pullGoogleCompletionsAction } from './google-calendar-actions';
import { pullTodoistCompletionsAction } from './todoist-actions';

/**
 * Reconcile remote completion/changes from all connected integrations into the
 * local todos. Pull-only (no new imports) — predictable and idempotent, so it's
 * safe to run automatically on every page load. New-item imports stay opt-in via
 * each service's manual "Pull" button.
 *
 * @returns {Promise<{ google: number, todoist: number, updated: number }>}
 *   Per-service and total count of todos changed.
 */
export async function pullAllCompletionsAction() {
  const [google, todoist] = await Promise.all([
    pullGoogleCompletionsAction().catch(() => ({ updated: 0 })),
    pullTodoistCompletionsAction().catch(() => ({ updated: 0 })),
  ]);

  const g = google?.updated ?? 0;
  const t = todoist?.updated ?? 0;
  return { google: g, todoist: t, updated: g + t };
}

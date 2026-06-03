/**
 * @file Todoist connection actions for the member Daily Activity page.
 * All access is scoped to the authenticated member's user_id.
 * @module todoist-actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { requireActionAuth } from '@/app/_lib/auth/action-guard';
import { isValidUUID } from '@/app/_lib/utils/validation';
import {
  getConnection,
  deleteConnection,
  setSyncEnabled,
  pushTodoistTask,
  syncTodoistChildSubtasks,
  pullFromTodoist,
} from '@/app/_lib/integrations/todoist';

const PATH = '/account/member/daily-activity';

async function memberId() {
  const auth = await requireActionAuth('member');
  if (auth.error) return { error: auth.error };
  return { userId: auth.user.id };
}

/** Current connection state for the UI. */
export async function getTodoistStatusAction() {
  const a = await memberId();
  if (a.error) return { connected: false };
  const conn = await getConnection(a.userId);
  return {
    connected: !!conn,
    email: conn?.todoist_user_email || null,
    name: conn?.todoist_user_name || null,
    syncEnabled: conn ? conn.sync_enabled !== false : false,
  };
}

/** Disconnect: drop the stored token and detach mirrored task ids. */
export async function disconnectTodoistAction() {
  const a = await memberId();
  if (a.error) return { error: a.error };
  try {
    await deleteConnection(a.userId);
  } catch (err) {
    console.error('disconnectTodoistAction:', err?.message);
    return { error: 'Failed to disconnect.' };
  }
  revalidatePath(PATH);
  return { success: true };
}

/** Turn auto-mirroring on or off. */
export async function setTodoistSyncEnabledAction(enabled) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  try {
    await setSyncEnabled(a.userId, !!enabled);
  } catch (err) {
    console.error('setTodoistSyncEnabledAction:', err?.message);
    return { error: 'Failed to update sync setting.' };
  }
  revalidatePath(PATH);
  return { success: true };
}

/** Explicitly push selected tasks to Todoist. */
export async function pushTodosToTodoistAction(taskIds = []) {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const conn = await getConnection(a.userId);
  if (!conn) return { error: 'Todoist is not connected.' };

  const ids = [...new Set(taskIds.filter(isValidUUID))];
  if (ids.length === 0) return { success: true, pushed: 0 };

  const { data: rows, error } = await supabaseAdmin
    .from('todos')
    .select('*')
    .eq('user_id', a.userId)
    .in('id', ids);

  if (error) {
    console.error('pushTodosToTodoistAction (load tasks):', error.message);
    return { error: 'Failed to load tasks.' };
  }

  let pushedCount = 0;
  for (const r of rows || []) {
    const todoPayload = {
      id: r.id,
      title: r.title,
      notes: r.notes || r.description || '',
      priority: r.priority,
      dueDate: r.start_date || null,
      completed: !!r.completed,
      todoistTaskId: r.todoist_task_id || null,
    };

    const tid = await pushTodoistTask(a.userId, todoPayload, { force: true });
    if (tid) {
      pushedCount++;
      let subtaskMap = r.todoist_subtask_ids || {};
      if (r.subtasks && r.subtasks.length > 0) {
        subtaskMap = await syncTodoistChildSubtasks(
          a.userId,
          tid,
          r.subtasks,
          r.todoist_subtask_ids || {}
        );
      }

      await supabaseAdmin
        .from('todos')
        .update({
          todoist_task_id: tid,
          todoist_subtask_ids: subtaskMap,
          todoist_synced_at: new Date().toISOString(),
        })
        .eq('id', r.id)
        .eq('user_id', a.userId);
    }
  }

  revalidatePath(PATH);
  return { success: true, pushed: pushedCount };
}

/** Explicitly pull tasks/completions from Todoist (manual "Pull" button — imports new tasks too). */
export async function pullFromTodoistAction() {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const conn = await getConnection(a.userId);
  if (!conn) return { error: 'Todoist is not connected.' };

  const result = await pullFromTodoist(a.userId);
  if (result?.error) return { error: `Failed to pull from Todoist: ${result.error}` };

  revalidatePath(PATH);
  return { success: true, imported: result.imported ?? 0, updated: result.updated ?? 0 };
}

/**
 * Quiet reconcile of already-linked Todoist tasks only (no new imports) — the
 * Todoist counterpart to pullGoogleCompletionsAction, used by the page-load
 * auto-sync and the unified "Sync all" control. Safe to call when disconnected.
 *
 * @returns {Promise<{updated:number}|{error:string}>}
 */
export async function pullTodoistCompletionsAction() {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const conn = await getConnection(a.userId);
  if (!conn) return { updated: 0 };

  const result = await pullFromTodoist(a.userId, { importNew: false });
  if (result?.error) return { error: `Failed to sync Todoist: ${result.error}` };

  if ((result.updated ?? 0) > 0) revalidatePath(PATH);
  return { updated: result.updated ?? 0 };
}

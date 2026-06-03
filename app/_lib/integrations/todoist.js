/**
 * @file Per-member Todoist integration for the Daily Activity page.
 * @module todoist
 *
 * Opt-in, two-way: a member connects their Todoist account via OAuth,
 * we store their access token, and:
 *   • read  — pull active and completed tasks to sync with local to-dos.
 *   • write — mirror local to-dos to Todoist tasks (title, due date, description,
 *             priority, completion, and sub-tasks).
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Map database priority strings to Todoist priority integers (1-4)
// Todoist: 4 = Urgent/P1, 3 = High/P2, 2 = Medium/P3, 1 = Normal/P4
function mapPriorityToTodoist(p) {
  if (p === 1 || p === 'high') return 4;
  if (p === 2 || p === 'medium') return 3;
  if (p === 3 || p === 'low') return 2;
  return 1;
}

// Map Todoist priority integers (1-4) back to database strings
function mapPriorityFromTodoist(p) {
  if (p === 4) return 'high';
  if (p === 3) return 'medium';
  return 'low';
}

/** Callback URL the OAuth flow returns to. */
export function getRedirectUri() {
  const origin = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${origin}/api/integrations/todoist/callback`;
}

/** Consent URL. state is an opaque CSRF nonce. */
export function getAuthUrl(state) {
  const clientId = process.env.TODOIST_CLIENT_ID;
  if (!clientId) {
    throw new Error('Missing TODOIST_CLIENT_ID');
  }
  const redirectUri = encodeURIComponent(getRedirectUri());
  return `https://todoist.com/oauth/authorize?client_id=${clientId}&scope=data:read_write,data:delete&state=${state}&redirect_uri=${redirectUri}`;
}

/** Exchange an authorization code for an access token. */
export async function exchangeCode(code) {
  const clientId = process.env.TODOIST_CLIENT_ID;
  const clientSecret = process.env.TODOIST_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing TODOIST_CLIENT_ID or TODOIST_CLIENT_SECRET');
  }

  const res = await fetch('https://todoist.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getRedirectUri(),
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to exchange code: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/** Fetch Todoist user info using unified API. */
export async function fetchTodoistUserInfo(token) {
  const res = await fetch('https://api.todoist.com/api/v1/user', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch user info: ${text}`);
  }

  const data = await res.json();
  const user = data.user || data;
  return {
    name: user.full_name || user.name || null,
    email: user.email || null,
  };
}

/** Get the member's Todoist connection. */
export async function getConnection(userId) {
  const { data, error } = await supabaseAdmin
    .from('todoist_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('getConnection:', error?.message);
    return null;
  }
  return data;
}

/** Save a Todoist connection. */
export async function saveConnection(userId, { token, email, name }) {
  const { error } = await supabaseAdmin
    .from('todoist_connections')
    .upsert({
      user_id: userId,
      access_token: token,
      todoist_user_name: name,
      todoist_user_email: email,
      sync_enabled: true,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

/** Disconnect: drop the stored token and detach mirrored task ids. */
export async function deleteConnection(userId) {
  const { error } = await supabaseAdmin
    .from('todoist_connections')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;

  // Clear todoist metadata from the user's tasks
  await supabaseAdmin
    .from('todos')
    .update({
      todoist_task_id: null,
      todoist_synced_at: null,
      todoist_subtask_ids: {},
    })
    .eq('user_id', userId);
}

/** Toggle sync settings. */
export async function setSyncEnabled(userId, enabled) {
  const { error } = await supabaseAdmin
    .from('todoist_connections')
    .update({ sync_enabled: !!enabled, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw error;
}

/** Push a todo task to Todoist. */
export async function pushTodoistTask(userId, todo, { force = false } = {}) {
  try {
    const conn = await getConnection(userId);
    if (!conn || (!force && conn.sync_enabled === false)) return null;

    const token = conn.access_token;
    const body = {
      content: todo.title,
      description: todo.notes || todo.description || '',
      priority: mapPriorityToTodoist(todo.priority),
    };

    if (todo.startKey || todo.dueDate) {
      body.due_date = todo.startKey || todo.dueDate;
    } else {
      body.due_string = 'no date'; // clear due date if un-scheduled
    }

    let tid = todo.todoistTaskId || null;
    if (tid) {
      // Update existing task
      try {
        const res = await fetch(`https://api.todoist.com/api/v1/tasks/${tid}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (res.status === 404) {
          tid = null; // Recreate below if deleted remotely
        } else if (!res.ok) {
          console.error('[pushTodoistTask update failed]', await res.text());
        }
      } catch (err) {
        console.error('[pushTodoistTask update error]', err?.message);
        tid = null;
      }
    }

    if (!tid) {
      // Create new task
      const res = await fetch('https://api.todoist.com/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        tid = data.id;
      } else {
        console.error('[pushTodoistTask create failed]', await res.text());
        return null;
      }
    }

    if (tid) {
      // Sync completion status via POST close/reopen
      try {
        if (todo.completed) {
          await fetch(`https://api.todoist.com/api/v1/tasks/${tid}/close`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        } else {
          await fetch(`https://api.todoist.com/api/v1/tasks/${tid}/reopen`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        }
      } catch (err) {
        console.error('[pushTodoistTask completion toggle error]', err?.message);
      }
    }

    return tid;
  } catch (err) {
    console.error('[pushTodoistTask]', err?.message);
    return null;
  }
}

/** Sync child subtasks nested under a parent task. */
export async function syncTodoistChildSubtasks(userId, parentTaskId, subtasks = [], existingMap = {}) {
  try {
    const conn = await getConnection(userId);
    if (!conn || !parentTaskId) return existingMap;

    const token = conn.access_token;
    const map = { ...(existingMap || {}) };
    const liveIds = new Set();

    for (const s of subtasks) {
      if (!s || !s.id) continue;
      liveIds.add(s.id);

      const body = {
        content: s.title || '(subtask)',
        parent_id: parentTaskId,
      };

      let tid = map[s.id] || null;
      if (tid) {
        try {
          const res = await fetch(`https://api.todoist.com/api/v1/tasks/${tid}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: body.content }),
          });
          if (res.status === 404) {
            tid = null;
            delete map[s.id];
          } else if (!res.ok) {
            console.error('[syncTodoistChildSubtasks update failed]', await res.text());
          }
        } catch (err) {
          console.error('[syncTodoistChildSubtasks update error]', err?.message);
          tid = null;
          delete map[s.id];
        }
      }

      if (!tid) {
        const res = await fetch('https://api.todoist.com/api/v1/tasks', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          tid = data.id;
          map[s.id] = tid;
        } else {
          console.error('[syncTodoistChildSubtasks create failed]', await res.text());
        }
      }

      if (tid) {
        try {
          if (s.completed) {
            await fetch(`https://api.todoist.com/api/v1/tasks/${tid}/close`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
            });
          } else {
            await fetch(`https://api.todoist.com/api/v1/tasks/${tid}/reopen`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
            });
          }
        } catch (err) {
          console.error('[syncTodoistChildSubtasks completion error]', err?.message);
        }
      }
    }

    // Delete subtasks no longer present locally
    for (const [subId, tid] of Object.entries(map)) {
      if (!liveIds.has(subId)) {
        try {
          await fetch(`https://api.todoist.com/api/v1/tasks/${tid}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        } catch (err) {
          console.error('[syncTodoistChildSubtasks delete failed]', err?.message);
        }
        delete map[subId];
      }
    }

    return map;
  } catch (err) {
    console.error('[syncTodoistChildSubtasks]', err?.message);
    return existingMap;
  }
}

/** Complete a task on Todoist. */
export async function setTodoistTaskCompleted(userId, todoistTaskId, completed) {
  try {
    const conn = await getConnection(userId);
    if (!conn || !todoistTaskId) return;

    const token = conn.access_token;
    const url = `https://api.todoist.com/api/v1/tasks/${todoistTaskId}/${completed ? 'close' : 'reopen'}`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } catch (err) {
    console.error('[setTodoistTaskCompleted]', err?.message);
  }
}

/** Delete a task from Todoist. */
export async function deleteTodoistTask(userId, todoistTaskId) {
  try {
    const conn = await getConnection(userId);
    if (!conn || !todoistTaskId) return;

    await fetch(`https://api.todoist.com/api/v1/tasks/${todoistTaskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${conn.access_token}` },
    });
  } catch (err) {
    console.error('[deleteTodoistTask]', err?.message);
  }
}

/**
 * Pull tasks from Todoist → upsert into local `todos` table.
 *
 * Mirrors the Google Calendar/Tasks pull pattern:
 *   1. Fetch all active Todoist tasks.
 *   2. Load existing local todos that have a `todoist_task_id` (already linked).
 *   3. Reconcile linked tasks — update title, description, priority, due date,
 *      completion status from the remote state.
 *   4. Import new root-level Todoist tasks that aren't linked yet,
 *      keyed by `todoist_task_id` so re-pulling never creates duplicates.
 *   5. Add a 'Todoist' label to imported tasks for traceability.
 *
 * @param {string} userId  The authenticated member's user_id.
 * @returns {{ imported: number, updated: number }}
 */
export async function pullFromTodoist(userId) {
  try {
    const conn = await getConnection(userId);
    if (!conn) return { imported: 0, updated: 0 };

    const token = conn.access_token;

    // ── 1. Fetch all active tasks from Todoist ──────────────────────────────
    const activeRes = await fetch('https://api.todoist.com/api/v1/tasks', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!activeRes.ok) {
      const text = await activeRes.text();
      throw new Error(`Todoist tasks fetch failed: ${text}`);
    }
    const rawTasks = await activeRes.json();

    // Todoist API v1 may return a plain array or an object wrapper like
    // { results: [...] }, { items: [...] }, { data: [...] }, or { tasks: [...] }.
    // Handle all known shapes gracefully.
    const rawList = Array.isArray(rawTasks)
      ? rawTasks
      : Array.isArray(rawTasks?.results) ? rawTasks.results
      : Array.isArray(rawTasks?.items)   ? rawTasks.items
      : Array.isArray(rawTasks?.data)    ? rawTasks.data
      : Array.isArray(rawTasks?.tasks)   ? rawTasks.tasks
      : [];

    // Only keep objects that look like real Todoist tasks (must have id + content)
    const remoteTasks = rawList.filter(
      (t) => t && t.id && typeof t.content === 'string' && t.content.trim().length > 0
    );

    // Build a Map of remote tasks keyed by Todoist task ID
    const remoteMap = new Map(remoteTasks.map((t) => [t.id, t]));

    // Build parent → children map for subtask resolution
    const childrenByParent = new Map();
    for (const t of remoteTasks) {
      if (t.parent_id) {
        if (!childrenByParent.has(t.parent_id)) childrenByParent.set(t.parent_id, []);
        childrenByParent.get(t.parent_id).push(t);
      }
    }

    // Helper: convert Todoist child tasks into local subtask format
    // Local subtask shape: { id: string, title: string, completed: boolean }
    function buildLocalSubtasks(parentTodoistId) {
      const children = childrenByParent.get(parentTodoistId) || [];
      const subtasks = [];
      const subtaskIdMap = {}; // { localSubId: todoistChildId }
      for (const c of children) {
        const localId = `todoist-${c.id}`;
        subtasks.push({
          id: localId,
          title: c.content || '(subtask)',
          completed: false,
        });
        subtaskIdMap[localId] = c.id;
      }
      return { subtasks, subtaskIdMap };
    }

    // ── 2. Load existing local todos that already have a todoist_task_id ─────
    const { data: existingLinked, error: loadErr } = await supabaseAdmin
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .not('todoist_task_id', 'is', null);

    if (loadErr) throw loadErr;

    const existingTodoistIds = new Set(
      (existingLinked || []).map((r) => r.todoist_task_id)
    );

    let imported = 0;
    let updated = 0;

    // ── 3. Reconcile existing linked tasks ──────────────────────────────────
    for (const local of existingLinked || []) {
      const tid = local.todoist_task_id;
      const remote = remoteMap.get(tid);

      const patch = {};

      if (!remote) {
        // Task no longer exists on Todoist (completed or deleted remotely).
        if (!local.completed) {
          patch.completed = true;
          patch.completed_at = new Date().toISOString();
        }
      } else {
        // Task still active on Todoist — sync fields.

        if (local.completed) {
          patch.completed = false;
          patch.completed_at = null;
        }

        if (remote.content && remote.content !== local.title) {
          patch.title = remote.content;
        }

        const remoteDesc = remote.description || '';
        const localDesc = local.description || local.notes || '';
        if (remoteDesc !== localDesc) {
          patch.description = remoteDesc;
          patch.notes = remoteDesc;
        }

        const remoteDate = remote.due?.date || null;
        if (remoteDate !== local.start_date) {
          patch.start_date = remoteDate;
        }

        const remotePriority = mapPriorityFromTodoist(remote.priority);
        if (remotePriority !== local.priority) {
          patch.priority = remotePriority;
        }

        // Sync subtasks from Todoist children
        const { subtasks: remoteSubtasks, subtaskIdMap } = buildLocalSubtasks(tid);
        if (remoteSubtasks.length > 0) {
          patch.subtasks = remoteSubtasks;
          patch.todoist_subtask_ids = subtaskIdMap;
        }
      }

      if (Object.keys(patch).length > 0) {
        patch.todoist_synced_at = new Date().toISOString();
        patch.updated_at = new Date().toISOString();
        await supabaseAdmin
          .from('todos')
          .update(patch)
          .eq('id', local.id)
          .eq('user_id', userId);
        updated++;
      }
    }

    // ── 4. Import new root-level Todoist tasks (skip subtasks & already-linked) ─
    const newTasks = remoteTasks.filter(
      (t) => !existingTodoistIds.has(t.id) && !t.parent_id
    );

    for (const t of newTasks) {
      const dueDate = t.due?.date || null;
      const { subtasks, subtaskIdMap } = buildLocalSubtasks(t.id);

      await supabaseAdmin.from('todos').insert({
        user_id: userId,
        title: t.content,
        description: t.description || null,
        notes: t.description || null,
        priority: mapPriorityFromTodoist(t.priority),
        start_date: dueDate,
        labels: ['Todoist'],
        subtasks,
        comments: [],
        completed: false,
        todoist_task_id: t.id,
        todoist_subtask_ids: subtaskIdMap,
        todoist_synced_at: new Date().toISOString(),
      });
      imported++;
    }

    return { imported, updated };
  } catch (err) {
    console.error('[pullFromTodoist]', err?.message);
    return { imported: 0, updated: 0, error: err?.message };
  }
}

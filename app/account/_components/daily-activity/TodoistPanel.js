/**
 * @file Todoist connection panel for the Task view. Wires
 *   the real per-member Todoist integration: reads connection status, starts
 *   the OAuth flow, toggles auto-mirroring, disconnects, and pushes/pulls tasks.
 *
 *   Flow: "Connect" navigates to /api/integrations/todoist/connect,
 *   which redirects through Todoist and lands back on the Daily Activity page
 *   with ?todoist=connected|denied|error — surfaced here as a toast.
 *
 * @module daily-activity/TodoistPanel
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Loader2, ChevronRight, Check, Upload, Download } from 'lucide-react';
import {
  getTodoistStatusAction,
  setTodoistSyncEnabledAction,
  disconnectTodoistAction,
  pushTodosToTodoistAction,
  pullFromTodoistAction,
} from '@/app/_lib/actions/todoist-actions';
import { isValidUUID } from '@/app/_lib/utils/validation';

const CONNECT_URL = '/api/integrations/todoist/connect';

export default function TodoistPanel({ monthTasks = [], onToast, onSynced }) {
  const [status, setStatus] = useState({ connected: false, email: null, name: null, syncEnabled: false });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pullBusy, setPullBusy] = useState(false);
  const [toggling, setToggling] = useState(false);

  const toast = useCallback((text, type) => onToast?.(text, type), [onToast]);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await getTodoistStatusAction();
      setStatus(s);
    } catch {
      setStatus({ connected: false, email: null, name: null, syncEnabled: false });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial status load
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Surface OAuth callback parameter ?todoist=connected|denied|error|missing_config
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('todoist');
    if (!flag) return;
    if (flag === 'connected') {
      toast('Todoist connected successfully.', 'success');
      refreshStatus();
    } else if (flag === 'denied') {
      toast('Todoist connection was cancelled.', 'info');
    } else if (flag === 'missing_config') {
      toast('Todoist client credentials are not configured in your .env.local file.', 'error');
    } else {
      const msg = params.get('message') || 'Todoist connection failed.';
      toast(msg, 'error');
    }
    params.delete('todoist');
    params.delete('message');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, [toast, refreshStatus]);

  const handleToggleSync = async () => {
    if (toggling) return;
    const next = !status.syncEnabled;
    setToggling(true);
    setStatus((s) => ({ ...s, syncEnabled: next })); // optimistic update
    const res = await setTodoistSyncEnabledAction(next);
    setToggling(false);
    if (res?.error) {
      setStatus((s) => ({ ...s, syncEnabled: !next })); // revert
      toast(res.error, 'error');
    } else {
      toast(next ? 'Todoist auto-mirroring enabled.' : 'Todoist auto-mirroring disabled.', 'success');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Todoist? Mirrored tasks will remain in Todoist but will no longer synchronize.')) return;
    setPushBusy(true);
    const res = await disconnectTodoistAction();
    setPushBusy(false);
    if (res?.error) {
      toast(res.error, 'error');
      return;
    }
    setStatus({ connected: false, email: null, name: null, syncEnabled: false });
    toast('Todoist disconnected.', 'info');
  };

  // Push visible tasks to Todoist
  const handlePushNow = async () => {
    if (pushBusy) return;
    const taskIds = monthTasks.filter((t) => isValidUUID(t.id)).map((t) => t.id);
    if (taskIds.length === 0) {
      toast('No tasks to push.', 'info');
      return;
    }
    setPushBusy(true);
    const res = await pushTodosToTodoistAction(taskIds);
    setPushBusy(false);
    if (res?.error) {
      toast(res.error, 'error');
    } else {
      toast(`Pushed ${res.pushed} task${res.pushed === 1 ? '' : 's'} to Todoist.`, 'success');
      onSynced?.();
    }
  };

  // Pull latest tasks and status updates from Todoist
  const handlePullNow = async () => {
    if (pullBusy) return;
    setPullBusy(true);
    const res = await pullFromTodoistAction();
    setPullBusy(false);
    if (res?.error) {
      toast(res.error, 'error');
      return;
    }
    onSynced?.();
    const imp = res.imported ?? 0;
    const upd = res.updated ?? 0;
    const total = imp + upd;
    toast(`Pulled ${total} item${total === 1 ? '' : 's'} from Todoist.`, 'success');
  };

  return (
    <div className="rounded-2xl border border-white/6 bg-white/2 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                status.connected ? 'bg-emerald-400' : 'bg-gray-500'
              }`}
            />
          </div>
          <div className="min-w-0 leading-tight">
            <h4 className="text-xs font-semibold text-white">Todoist Sync</h4>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {loading ? 'Checking…' : status.connected ? status.name || status.email || 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {status.connected ? (
            <>
              <button
                type="button"
                disabled={pushBusy || pullBusy}
                onClick={handlePushNow}
                className="p-1 px-2 bg-red-500/10 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/20 rounded-xl text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Push NEUPC tasks to Todoist"
              >
                {pushBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                <span>Push</span>
              </button>
              <button
                type="button"
                disabled={pushBusy || pullBusy}
                onClick={handlePullNow}
                className="p-1 px-2 bg-blue-500/10 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/20 rounded-xl text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Pull latest Todoist changes"
              >
                {pullBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                <span>Pull</span>
              </button>
            </>
          ) : (
            <a
              href={CONNECT_URL}
              className="p-1 px-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              Connect
            </a>
          )}

          {status.connected && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 hover:bg-white/6 text-gray-400 hover:text-white rounded-lg transition"
              title={expanded ? 'Collapse settings' : 'Expand settings'}
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && status.connected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            <div className="flex justify-between items-center bg-white/2 border border-white/6 p-2.5 rounded-xl">
              <label htmlFor="todoist-mirror" className="text-[11px] font-medium text-gray-300 select-none pr-2">
                Auto-mirror new tasks
              </label>
              <button
                id="todoist-mirror"
                type="button"
                disabled={toggling}
                onClick={handleToggleSync}
                className={`w-8.5 h-5 rounded-full p-[2.5px] transition-all cursor-pointer shrink-0 ${
                  status.syncEnabled ? 'bg-red-600 flex justify-end' : 'bg-white/10 flex justify-start'
                } ${toggling ? 'opacity-60' : ''}`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-md flex items-center justify-center">
                  {status.syncEnabled && <Check className="w-2.5 h-2.5 text-red-600" />}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              disabled={pushBusy || pullBusy}
              className="w-full py-2 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 bg-rose-500/2 rounded-xl cursor-pointer transition text-[11px] font-semibold disabled:opacity-40"
            >
              Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

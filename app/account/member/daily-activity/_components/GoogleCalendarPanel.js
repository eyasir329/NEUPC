/**
 * @file Google Calendar / Tasks connection panel for the Calendar tab. Wires
 *   the real per-member integration (no mock): reads connection status, starts
 *   the OAuth flow, toggles auto-mirroring, disconnects, and pushes the visible
 *   month's items on demand. All work goes through the server actions in
 *   {@link module:google-calendar-actions}; this component holds only UI state.
 *
 *   Flow: "Connect" navigates to /api/integrations/google-calendar/connect,
 *   which redirects through Google and lands back on the Daily Activity page
 *   with ?gcal=connected|denied|error — surfaced here as a toast.
 *
 * @module daily-activity/GoogleCalendarPanel
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, RefreshCw, ChevronRight, Check, Loader2, AlertTriangle, Upload, Download } from 'lucide-react';
import {
  getGoogleCalendarStatusAction,
  setGoogleCalendarSyncEnabledAction,
  disconnectGoogleCalendarAction,
  syncTodosToCalendarAction,
  pullGoogleCompletionsAction,
  pullFromGoogleAction,
} from '@/app/_lib/actions/google-calendar-actions';
import { isValidUUID } from '@/app/_lib/utils/validation';
import { resolveTaskColor, LAYER_DEFAULTS } from '@/app/account/member/daily-activity/_components/utils';

const CONNECT_URL = '/api/integrations/google-calendar/connect';

/**
 * Resolve each item's colour from the expand-modal colour settings (ecm_* in
 * localStorage), read fresh at push time so customised colours are honoured.
 * Returns a plain { [itemId]: hex } map for the server to map to Google colours.
 */
function resolveExpandColors(items, projects) {
  let layerColors = { ...LAYER_DEFAULTS };
  let subColors = {};
  try {
    layerColors = { ...LAYER_DEFAULTS, ...(JSON.parse(localStorage.getItem('ecm_colors') || 'null') || {}) };
    subColors = JSON.parse(localStorage.getItem('ecm_sub_colors') || 'null') || {};
  } catch { /* defaults */ }
  const map = {};
  for (const t of items) {
    const hex = resolveTaskColor(t, layerColors, subColors, projects);
    if (hex) map[t.id] = hex;
  }
  return map;
}

export default function GoogleCalendarPanel({ monthTasks = [], projects = [], timeMin, timeMax, onToast, onSynced }) {
  const [status, setStatus] = useState({ connected: false, email: null, syncEnabled: false, needsReconnect: false });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pullBusy, setPullBusy] = useState(false);
  const [toggling, setToggling] = useState(false);

  const toast = useCallback((text, type) => onToast?.(text, type), [onToast]);

  // Pull completion changes made in Google back into NEUPC, then ask the parent
  // to refresh its task list if anything changed. Best-effort and quiet.
  const pullCompletions = useCallback(async () => {
    try {
      const res = await pullGoogleCompletionsAction();
      if (res?.updated > 0) onSynced?.();
    } catch {
      // ignore — pull is best-effort
    }
  }, [onSynced]);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await getGoogleCalendarStatusAction();
      setStatus(s);
      if (s?.connected) pullCompletions();
    } catch {
      setStatus({ connected: false, email: null, syncEnabled: false });
    } finally {
      setLoading(false);
    }
  }, [pullCompletions]);

  // Initial status load (and a completion pull when connected).
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Surface the OAuth return flag (?gcal=connected|denied|error) once, then
  // strip it from the URL so a refresh doesn't repeat the toast.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('gcal');
    if (!flag) return;
    if (flag === 'connected') {
      toast('Google Calendar connected.', 'success');
      refreshStatus();
    } else if (flag === 'denied') {
      toast('Google Calendar connection was cancelled.', 'info');
    } else {
      toast('Google Calendar connection failed.', 'error');
    }
    params.delete('gcal');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, [toast, refreshStatus]);

  const handleToggleSync = async () => {
    if (toggling) return;
    const next = !status.syncEnabled;
    setToggling(true);
    setStatus((s) => ({ ...s, syncEnabled: next })); // optimistic
    const res = await setGoogleCalendarSyncEnabledAction(next);
    setToggling(false);
    if (res?.error) {
      setStatus((s) => ({ ...s, syncEnabled: !next })); // revert
      toast(res.error, 'error');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Calendar? Mirrored events stay in Google but stop updating.')) return;
    setPushBusy(true);
    const res = await disconnectGoogleCalendarAction();
    setPushBusy(false);
    if (res?.error) { toast(res.error, 'error'); return; }
    setStatus({ connected: false, email: null, syncEnabled: false });
    toast('Google Calendar disconnected.', 'info');
  };

  // Push: visible month's NEUPC todos + feed items → Google (upsert, no duplicates)
  const handlePushNow = async () => {
    if (pushBusy) return;
    const taskIds = monthTasks.filter((t) => isValidUUID(t.id)).map((t) => t.id);
    const feedIds = monthTasks
      .filter((t) => !isValidUUID(t.id) && !t.id.startsWith('gcal-') && !t.id.startsWith('gtask-') && !t.id.startsWith('personal-'))
      .map((t) => t.id);
    const colors = resolveExpandColors(monthTasks, projects);
    setPushBusy(true);
    const res = await syncTodosToCalendarAction({ taskIds, feedIds, timeMin, timeMax, colors });
    if (res?.error) { setPushBusy(false); toast(res.error, 'error'); return; }
    await pullCompletions();
    setPushBusy(false);
    toast(`Pushed ${res.synced} item${res.synced === 1 ? '' : 's'} to Google.`, 'success');
  };

  // Pull: fetch this month's Google events + tasks → merge into app state
  const handlePullNow = async () => {
    if (pullBusy || !timeMin || !timeMax) return;
    setPullBusy(true);
    const [pullRes] = await Promise.all([
      pullFromGoogleAction({ timeMin, timeMax }),
      pullCompletions(),
    ]);
    setPullBusy(false);
    if (pullRes?.error) { toast(pullRes.error, 'error'); return; }
    onSynced?.();
    const tasks = pullRes.imported ?? 0;
    const evs = pullRes.importedEvents ?? 0;
    const total = tasks + evs;
    toast(`Pulled ${total} item${total === 1 ? '' : 's'} from Google.`, 'success');
  };

  return (
    <div className="rounded-2xl border border-white/6 bg-white/2 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                status.connected ? 'bg-emerald-400' : 'bg-gray-500'
              }`}
            />
          </div>
          <div className="min-w-0 leading-tight">
            <h4 className="text-xs font-semibold text-white">Google Calendar</h4>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {loading ? 'Checking…' : status.connected ? status.email || 'Connected' : 'Not connected'}
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
                className="p-1 px-2 bg-violet-500/10 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/20 rounded-xl text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Push this month's NEUPC tasks to Google"
              >
                {pushBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                <span>Push</span>
              </button>
              <button
                type="button"
                disabled={pushBusy || pullBusy}
                onClick={handlePullNow}
                className="p-1 px-2 bg-blue-500/10 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/20 rounded-xl text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                title="Pull latest Google events & tasks into app"
              >
                {pullBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                <span>Pull</span>
              </button>
            </>
          ) : (
            <a
              href={CONNECT_URL}
              className="p-1 px-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
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

      {status.connected && status.needsReconnect && (
        <div className="mt-2.5 flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-amber-300 font-semibold leading-snug">Reconnect required to import all calendars & events.</p>
            <a href={CONNECT_URL} className="text-[9px] text-amber-400 underline underline-offset-2 font-bold mt-0.5 block">Reconnect now →</a>
          </div>
        </div>
      )}

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
              <label htmlFor="gcal-mirror" className="text-[11px] font-medium text-gray-300 select-none pr-2">
                Auto-mirror new tasks to Google
              </label>
              <button
                id="gcal-mirror"
                type="button"
                disabled={toggling}
                onClick={handleToggleSync}
                className={`w-8.5 h-5 rounded-full p-[2.5px] transition-all cursor-pointer shrink-0 ${
                  status.syncEnabled ? 'bg-violet-600 flex justify-end' : 'bg-white/10 flex justify-start'
                } ${toggling ? 'opacity-60' : ''}`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-md flex items-center justify-center">
                  {status.syncEnabled && <Check className="w-2.5 h-2.5 text-violet-600" />}
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

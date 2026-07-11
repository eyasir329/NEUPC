/**
 * @file Session attendance modal.
 * @module AttendanceModal
 */

'use client';

import { useScrollLock } from '@/app/_hooks/useUiEffects';
import { endSessionAction, saveSessionAttendanceAction } from '@/app/_lib/actions/mentor-actions';
import { ActionButton, Avatar } from '@/app/account/_components/ui';
import { motion } from 'framer-motion';
import { Check, CheckCircle2, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

function AttendanceModal({
  session,
  students,
  onClose,
  onSaved,
  isPast = false,
}) {
  useScrollLock();
  const [rows, setRows] = useState(() =>
    students.map((st) => {
      const match = (session.attendance_data || []).find(
        (r) => r.user_id === st.id
      );
      return {
        user_id: st.id,
        name: st.name,
        avatar_url: st.avatar_url,
        attended: match ? match.attended : false,
        points:
          match && match.points !== undefined && match.points !== 0
            ? String(match.points)
            : '',
      };
    })
  );
  const [saving, setSaving] = useState(false);

  const setRow = (userId, patch) =>
    setRows((prev) =>
      prev.map((r) => (r.user_id === userId ? { ...r, ...patch } : r))
    );

  const handleSave = async () => {
    setSaving(true);

    if (!isPast) {
      const endFd = new FormData();
      endFd.set('sessionId', session.id);
      const endResult = await endSessionAction(endFd);
      if (endResult?.error) {
        toast.error(endResult.error);
        setSaving(false);
        return;
      }
    }

    const attendance_data = rows.map((r) => ({
      user_id: r.user_id,
      attended: r.attended,
      points: parseInt(r.points) || 0,
    }));
    const fd = new FormData();
    fd.set('sessionId', session.id);
    fd.set('attendance_data', JSON.stringify(attendance_data));
    const result = await saveSessionAttendanceAction(fd);
    if (result?.error) {
      toast.error(result.error);
      setSaving(false);
      return;
    }

    toast.success(
      isPast
        ? 'Attendance updated successfully'
        : 'Session ended & attendance saved'
    );
    onSaved(attendance_data);
  };

  const attendedCount = rows.filter((r) => r.attended).length;
  const absentCount = rows.length - attendedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-900 shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        {/* Header */}
        <div className="border-b border-white/10 px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[9px] font-black tracking-widest text-emerald-400 uppercase">
                {isPast
                  ? 'Edit Attendance Sheet'
                  : 'Interactive Attendance Sheet'}
              </p>
              <h2 className="truncate text-sm leading-tight font-bold text-white">
                {session.topic}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="animate-all mt-0.5 shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              {
                label: 'Enrolled list',
                value: students.length,
                color: 'text-gray-300',
              },
              {
                label: 'Attended',
                value: attendedCount,
                color: 'text-emerald-400',
              },
              { label: 'Absent', value: absentCount, color: 'text-rose-405' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl border border-white/5 bg-black/30 px-3 py-2.5 text-center"
              >
                <p className={`text-base font-black ${color}`}>{value}</p>
                <p className="text-gray-550 mt-1 text-[10px] font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Action Strip */}
        <div className="flex items-center justify-between border-b border-white/5 bg-black/20 px-5 py-3">
          <span className="font-mono text-[10px] text-gray-500">
            {attendedCount === students.length && students.length > 0
              ? 'All candidates marked present'
              : `${attendedCount} / ${students.length} logged`}
          </span>
          <div className="flex gap-2 text-[10px]">
            <button
              type="button"
              onClick={() =>
                setRows((prev) => prev.map((r) => ({ ...r, attended: true })))
              }
              className="font-bold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              All Present
            </button>
            <span className="text-gray-700">·</span>
            <button
              type="button"
              onClick={() =>
                setRows((prev) => prev.map((r) => ({ ...r, attended: false })))
              }
              className="font-bold text-gray-500 transition-colors hover:text-gray-300"
            >
              Clear Log
            </button>
          </div>
        </div>

        {/* Candidate List */}
        {students.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-gray-500 italic">
            No targeted candidates configured.
          </div>
        ) : (
          <div className="max-h-[400px] flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {rows.map((r) => (
              <div
                key={r.user_id}
                className={`group flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all select-none ${
                  r.attended
                    ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
                    : 'border-white/5 bg-black/20 hover:border-white/10'
                }`}
                onClick={() => setRow(r.user_id, { attended: !r.attended })}
              >
                <div
                  className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border transition-all ${
                    r.attended
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-white/20 bg-transparent group-hover:border-white/40'
                  }`}
                >
                  {r.attended && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>

                <Avatar name={r.name} src={r.avatar_url} size="sm" />

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-xs font-semibold transition-colors ${r.attended ? 'text-white' : 'text-gray-400'}`}
                  >
                    {r.name}
                  </p>
                  <p
                    className={`mt-0.5 font-mono text-[9px] ${r.attended ? 'text-emerald-400' : 'text-gray-600'}`}
                  >
                    {r.attended ? 'Present' : 'Absent'}
                  </p>
                </div>

                {/* Performance points */}
                <div
                  className="flex shrink-0 items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={r.points}
                    onChange={(e) =>
                      setRow(r.user_id, { points: e.target.value })
                    }
                    placeholder="0"
                    className={`w-10 rounded-lg border px-1.5 py-1 text-center text-xs font-bold transition-all outline-none ${
                      r.attended
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 focus:border-emerald-500/60'
                        : 'border-white/10 bg-black/30 text-gray-500 focus:border-white/20'
                    }`}
                  />
                  <span className="font-mono text-[9px] font-bold text-gray-600">
                    pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-2 border-t border-white/10 bg-black/30 px-4 py-4">
          <ActionButton
            tone="ghost"
            onClick={onClose}
            className="flex-1 justify-center py-2.5"
          >
            Cancel
          </ActionButton>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/10 transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-violet-200" />
            )}
            {saving
              ? isPast
                ? 'Updating logs…'
                : 'Closing slot…'
              : isPast
                ? 'Save Changes'
                : 'Close & Log Attendance'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Recording Upload ─────────────────────────────────────────────────────────


export { AttendanceModal };

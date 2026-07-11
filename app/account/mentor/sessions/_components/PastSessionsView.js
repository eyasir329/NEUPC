/**
 * @file Past sessions view grouped by date.
 * @module PastSessionsView
 */

'use client';

import { deleteSessionAction, updateSessionNotesAction } from '@/app/_lib/actions/mentor-actions';
import { ActionButton, Avatar, EmptyState, GlassCard, Pill } from '@/app/account/_components/ui';
import { AnimatePresence } from 'framer-motion';
import { Calendar, Check, CheckCircle2, Clock, Film, Loader2, MessageSquare, Pencil, Plus, Search, Trash2, Tv, Video, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AttendanceModal } from './AttendanceModal';
import { RecordingUpload } from './RecordingUpload';
import { MultiBlockEditor, TaskDescriptionRenderer, formatDate, formatDatetime } from './sessions-shared';

function groupByDate(sessions) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);

  const groups = {
    Today: [],
    Yesterday: [],
    'This week': [],
    'This month': [],
    Earlier: [],
  };
  sessions.forEach((s) => {
    const date = s.session_date?.slice(0, 10);
    const d = new Date(s.session_date);
    if (date === today) groups.Today.push(s);
    else if (date === yesterday) groups.Yesterday.push(s);
    else if (d >= weekAgo) groups['This week'].push(s);
    else if (d >= monthAgo) groups['This month'].push(s);
    else groups.Earlier.push(s);
  });
  return Object.entries(groups).filter(([, v]) => v.length > 0);
}

function ensureJsonDescription(raw) {
  if (!raw) {
    return JSON.stringify([
      { id: crypto.randomUUID(), type: 'richText', content: '' },
    ]);
  }
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch (e) {
      // Not valid JSON
    }
  }
  // Wrap plain text in a rich text block
  return JSON.stringify([
    { id: crypto.randomUUID(), type: 'richText', content: raw },
  ]);
}

function PastSessionsView({
  mentorships,
  mentorId,
  sessions,
  setSessions,
  studentMap,
  bootcamps,
  onStartLog,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Inspector States
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAttendanceEdit, setShowAttendanceEdit] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sessions
      .filter((s) => {
        const effectiveAttended =
          s.attendance_data?.length > 0
            ? s.attendance_data.some((r) => r.attended)
            : s.attended;
        if (filter === 'attended' && !effectiveAttended) return false;
        if (filter === 'missed' && effectiveAttended) return false;
        if (
          q &&
          !s.topic?.toLowerCase().includes(q) &&
          !s.menteeName?.toLowerCase().includes(q)
        )
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  }, [sessions, search, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  // Selected session lookup
  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((s) => s.id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  const selectedSessionBootcamp = useMemo(() => {
    if (!selectedSession) return null;
    return bootcamps.find(
      (b) =>
        b.id === selectedSession.bootcamp_id ||
        b.id === selectedSession.bootcampId
    );
  }, [selectedSession, bootcamps]);

  const isSelectedSessionArchived = selectedSessionBootcamp
    ? selectedSessionBootcamp.status !== 'published'
    : false;

  const sessionStudents = useMemo(() => {
    if (!selectedSession) return [];
    if (
      selectedSession.attendance_data &&
      selectedSession.attendance_data.length > 0
    ) {
      return selectedSession.attendance_data.map((r) => {
        const profile = studentMap.get(r.user_id);
        return {
          id: r.user_id,
          name: profile?.name || 'Unknown Candidate',
          email: profile?.email || '',
          avatar_url: profile?.avatar_url || null,
        };
      });
    }
    return [];
  }, [selectedSession, studentMap]);

  // Sync editor value when selected session changes
  useEffect(() => {
    if (selectedSession) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotesInput(ensureJsonDescription(selectedSession.notes));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditingNotes(false);
    } else {
      setNotesInput(
        JSON.stringify([
          { id: crypto.randomUUID(), type: 'richText', content: '' },
        ])
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEditingNotes(false);
    }
  }, [selectedSession]);

  // Save Notes inside the Inspector
  const handleSaveInspectorNotes = async () => {
    if (!selectedSession) return;
    setSavingNotes(true);
    const fd = new FormData();
    fd.set('sessionId', selectedSession.id);
    fd.set('notes', notesInput);
    const result = await updateSessionNotesAction(fd);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Session logs saved');
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id ? { ...s, notes: notesInput } : s
        )
      );
      setIsEditingNotes(false);
    }
    setSavingNotes(false);
  };

  // Delete session inside the Inspector
  const handleDeleteInspectorSession = async () => {
    if (!selectedSession) return;
    if (!confirm('Completely delete this session log record?')) return;
    setDeleting(true);
    const fd = new FormData();
    fd.set('sessionId', selectedSession.id);
    const result = await deleteSessionAction(fd);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
      setSelectedSessionId(null);
      toast.success('Session record deleted');
    }
    setDeleting(false);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* LEFT PANEL: Log history queue (5-cols) */}
      <div className="space-y-4 lg:col-span-5">
        {/* Controls Grid */}
        <div className="space-y-3 rounded-2xl border border-white/5 bg-zinc-900/50 p-3.5 backdrop-blur-md">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topic, candidate..."
              className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pr-3 pl-9 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap">
            <div className="flex gap-1">
              {[
                { v: 'all', label: 'All' },
                { v: 'attended', label: 'Attended' },
                { v: 'missed', label: 'Missed' },
              ].map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setFilter(t.v)}
                  className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-colors ${
                    filter === t.v
                      ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                      : 'border border-white/5 bg-black/20 text-gray-400 hover:bg-white/2 hover:text-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <ActionButton
              tone="emerald"
              icon={Plus}
              onClick={onStartLog}
              className="py-1.5 text-[10px]"
            >
              Log Session
            </ActionButton>
          </div>
        </div>

        {/* Grouped session list */}
        <div className="max-h-[580px] space-y-5 overflow-y-auto pr-1">
          {grouped.length === 0 ? (
            <GlassCard padding="py-12" className="border-white/5">
              <EmptyState
                icon={Video}
                title={
                  search || filter !== 'all'
                    ? 'No matched records'
                    : 'No logs recorded'
                }
                description={
                  search || filter !== 'all'
                    ? 'Adjust filters to explore.'
                    : 'Log an interactive session below.'
                }
                accent="emerald"
                action={
                  <ActionButton tone="emerald" icon={Plus} onClick={onStartLog}>
                    Log Past Session
                  </ActionButton>
                }
              />
            </GlassCard>
          ) : (
            grouped.map(([label, items]) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center gap-2 pl-0.5">
                  <span className="font-mono text-[9px] font-black tracking-wider text-gray-500 uppercase">
                    {label}
                  </span>
                  <span className="text-gray-650 py-0.2 rounded-full border border-white/5 bg-white/5 px-1.5 text-[9px] font-black">
                    {items.length}
                  </span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="space-y-2">
                  {items.map((s) => {
                    const isSelected = selectedSessionId === s.id;
                    const effectiveAttended =
                      s.attendance_data?.length > 0
                        ? s.attendance_data.some((r) => r.attended)
                        : s.attended;
                    const presentCount =
                      s.attendance_data?.filter((r) => r.attended).length || 0;
                    const totalCount = s.attendance_data?.length || 0;

                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSessionId(s.id)}
                        className={`flex cursor-pointer flex-col gap-2.5 rounded-xl border p-3.5 text-left transition-all select-none ${
                          isSelected
                            ? 'border-emerald-500/50 bg-emerald-950/[0.06] shadow-md shadow-emerald-500/5'
                            : 'border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/2'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`max-w-[220px] truncate text-xs leading-snug font-bold ${isSelected ? 'text-emerald-300' : 'text-gray-100'}`}
                          >
                            {s.topic}
                          </h4>
                          {s.attendance_data?.length > 0 ? (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${presentCount === totalCount ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'text-amber-405 border border-amber-500/20 bg-amber-500/10'}`}
                            >
                              {presentCount}/{totalCount} present
                            </span>
                          ) : (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${effectiveAttended ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'text-rose-455 border border-rose-500/20 bg-rose-500/10'}`}
                            >
                              {effectiveAttended ? 'Attended' : 'Missed'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <div className="flex max-w-[170px] items-center gap-1.5 truncate">
                            {s.menteeAvatars?.length > 1 ? (
                              <div className="flex shrink-0 -space-x-1">
                                {s.menteeAvatars.slice(0, 3).map((av, idx) => (
                                  <Avatar
                                    key={idx}
                                    name="Student"
                                    src={av}
                                    size="sm"
                                  />
                                ))}
                              </div>
                            ) : (
                              <Avatar
                                name={s.menteeName}
                                src={s.menteeAvatar}
                                size="sm"
                                className="shrink-0"
                              />
                            )}
                            <span className="truncate font-medium text-gray-400">
                              {s.menteeName}
                            </span>
                          </div>
                          <span className="font-medium">
                            {formatDate(s.session_date)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Workspace Inspector (7-cols) */}
      <div className="lg:col-span-7">
        <GlassCard
          padding="p-6"
          className="flex min-h-[500px] flex-col justify-between border-white/10"
        >
          {!selectedSession ? (
            <div className="my-auto flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-2xl border border-white/10 bg-white/2 p-4 text-gray-500 shadow-inner">
                <Tv className="h-8 w-8 text-emerald-400/40" />
              </div>
              <h3 className="text-sm font-semibold text-gray-300">
                Inspector Workspace Empty
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">
                Select an interaction slot from the log history queue on the
                left to critique details, audit presence logs, access Drive
                records, and write session summaries.
              </p>
            </div>
          ) : (
            (() => {
              const s = selectedSession;
              const effectiveAttended =
                s.attendance_data?.length > 0
                  ? s.attendance_data.some((r) => r.attended)
                  : s.attended;
              return (
                <div className="space-y-6">
                  {/* Header detail */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {s.bootcampTitle && (
                          <Pill tone="gray">{s.bootcampTitle}</Pill>
                        )}
                        <Pill
                          tone={
                            s.targetType === 'one-on-one'
                              ? 'violet'
                              : s.targetType === 'selected-group'
                                ? 'amber'
                                : 'sky'
                          }
                        >
                          {s.targetType === 'one-on-one'
                            ? '1:1 Session'
                            : s.targetType === 'selected-group'
                              ? 'Group Room'
                              : 'Broadcast'}
                        </Pill>
                      </div>
                      <h3 className="text-base leading-tight font-extrabold text-white">
                        {s.topic}
                      </h3>
                      <p className="text-gray-550 flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDatetime(s.session_date)}
                        {s.duration > 0 && (
                          <>
                            <span className="text-gray-700">·</span>
                            <Clock className="h-3.5 w-3.5" />
                            {s.duration} mins logged
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isSelectedSessionArchived && (
                        <button
                          onClick={handleDeleteInspectorSession}
                          disabled={deleting}
                          className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 text-rose-300 transition-colors hover:bg-rose-500/15 disabled:opacity-50"
                          title="Delete interaction log"
                        >
                          {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedSessionId(null)}
                        className="rounded-lg border border-white/5 bg-white/2 p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
                        title="Close workspace"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Drive Recording Section */}
                  <div className="space-y-2">
                    <h4 className="text-gray-550 text-[10px] font-bold tracking-wider uppercase">
                      Drive Video Vault
                    </h4>
                    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/5 bg-black/30 p-4 md:flex-row md:items-center">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-violet-500/10 bg-violet-500/5 p-2.5 text-violet-400">
                          <Film className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-200">
                            Meet Session Recording
                          </p>
                          <p className="mt-0.5 text-[10px] text-gray-500">
                            {s.recording_url
                              ? 'Active recording indexed successfully.'
                              : 'No recording uploaded to Drive yet.'}
                          </p>
                        </div>
                      </div>
                      <RecordingUpload
                        sessionId={s.id}
                        initialUrl={s.recording_url}
                        onUploaded={(url) => {
                          setSessions((prev) =>
                            prev.map((r) =>
                              r.id === s.id ? { ...r, recording_url: url } : r
                            )
                          );
                        }}
                        readOnly={isSelectedSessionArchived}
                      />
                    </div>
                  </div>

                  {/* Attendance audit sheet */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-gray-555 text-[10px] font-bold tracking-wider uppercase">
                        Attendance Audit Sheet
                      </h4>
                      {!isSelectedSessionArchived && (
                        <button
                          onClick={() => setShowAttendanceEdit(true)}
                          className="flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 transition-colors hover:text-emerald-300"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Manage
                        </button>
                      )}
                    </div>
                    {s.attendance_data?.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/5 bg-black/20 p-3 md:grid-cols-2">
                        {s.attendance_data.map((r) => {
                          const cand = studentMap.get(r.user_id) || {
                            name: 'Enrolled Candidate',
                            email: 'Candidate',
                            avatar_url: null,
                          };

                          return (
                            <div
                              key={r.user_id}
                              className={`flex items-center justify-between rounded-xl border p-2.5 ${
                                r.attended
                                  ? 'border-emerald-500/15 bg-emerald-500/[0.02]'
                                  : 'border-rose-500/15 bg-rose-500/[0.01]'
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <Avatar
                                  name={cand.name}
                                  src={cand.avatar_url}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-gray-200">
                                    {cand.name}
                                  </p>
                                  <p className="truncate text-[9px] text-gray-500">
                                    {cand.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {r.points > 0 && (
                                  <span className="rounded-md border border-violet-500/20 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-extrabold text-violet-300">
                                    +{r.points} pts
                                  </span>
                                )}
                                {r.attended ? (
                                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400" />
                                ) : (
                                  <XCircle className="text-rose-455 h-4.5 w-4.5 shrink-0" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={s.menteeName}
                            src={s.menteeAvatar}
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-semibold text-gray-200">
                              {s.menteeName}
                            </p>
                            <p className="text-gray-550 text-[10px]">
                              {effectiveAttended
                                ? 'Candidate reported presence.'
                                : 'Candidate reported absence.'}
                            </p>
                          </div>
                        </div>
                        <Pill
                          tone={effectiveAttended ? 'emerald' : 'rose'}
                          icon={effectiveAttended ? CheckCircle2 : XCircle}
                        >
                          {effectiveAttended ? 'Attended' : 'Absent'}
                        </Pill>
                      </div>
                    )}
                  </div>

                  {/* Notes logs section */}
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-emerald-400" />
                        <h4 className="text-gray-550 text-[10px] font-bold tracking-wider uppercase">
                          Interactive Discussion logs
                        </h4>
                      </div>
                      {s.notes &&
                        !isEditingNotes &&
                        !isSelectedSessionArchived && (
                          <button
                            onClick={() => {
                              setNotesInput(ensureJsonDescription(s.notes));
                              setIsEditingNotes(true);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase transition-colors hover:text-emerald-300"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit Logs
                          </button>
                        )}
                    </div>

                    <div className="space-y-3.5 text-left">
                      {(!s.notes || isEditingNotes) &&
                      !isSelectedSessionArchived ? (
                        <>
                          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                            <MultiBlockEditor
                              key={
                                selectedSession
                                  ? `inspector-edit-${selectedSession.id}-${isEditingNotes}`
                                  : 'inspector-create'
                              }
                              value={notesInput}
                              onChange={setNotesInput}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            {s.notes && (
                              <button
                                onClick={() => {
                                  setNotesInput(ensureJsonDescription(s.notes));
                                  setIsEditingNotes(false);
                                }}
                                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-white/10"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={handleSaveInspectorNotes}
                              disabled={savingNotes}
                              className="text-emerald-250 inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              {savingNotes ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Syncing logs...
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Save notes
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-xl border border-white/[0.04] bg-[#080a0f]/40 p-4 text-[13px] leading-relaxed text-gray-300">
                          {s.notes ? (
                            <TaskDescriptionRenderer content={s.notes} />
                          ) : (
                            <p className="text-xs text-zinc-500 italic">
                              No notes logged for this archived session.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </GlassCard>
      </div>

      <AnimatePresence>
        {showAttendanceEdit && selectedSession && (
          <AttendanceModal
            session={selectedSession}
            students={sessionStudents}
            isPast={true}
            onClose={() => setShowAttendanceEdit(false)}
            onSaved={(attendanceData) => {
              setShowAttendanceEdit(false);
              setSessions((prev) =>
                prev.map((r) =>
                  r.id === selectedSession.id
                    ? { ...r, attendance_data: attendanceData }
                    : r
                )
              );
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Attendance Modal ─────────────────────────────────────────────────────────


export { PastSessionsView };

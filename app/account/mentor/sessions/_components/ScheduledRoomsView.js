/**
 * @file Scheduled session rooms view with per-row editing.
 * @module ScheduledRoomsView
 */

'use client';

import { cancelSessionAction, endSessionAction, logPastSessionAction, scheduleSessionAction, updateScheduledSessionAction } from '@/app/_lib/actions/mentor-actions';
import { Avatar, EmptyState, GlassCard, Pill, StaggerList } from '@/app/account/_components/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Calendar, Check, CheckCircle2, Clock, ExternalLink, GraduationCap, Loader2, MapPin, Pencil, Search, Tv, User, Users, Video, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AttendanceModal } from './AttendanceModal';
import { RecordingUpload } from './RecordingUpload';
import { MultiBlockEditor, descriptionPreview, formatDatetime } from './sessions-shared';

function ScheduledRoomsView({
  bootcamps,
  mentorships: _mentorships,
  scheduled,
  setScheduled,
  onEndSession,
  logMode = false,
  setLogMode,
  setSessions,
}) {
  const [search, setSearch] = useState('');

  // Form state
  const activeBootcamps = useMemo(
    () => bootcamps.filter((bc) => bc.status === 'published'),
    [bootcamps]
  );
  const [bootcampId, setBootcampId] = useState(() => {
    const active = bootcamps.filter((bc) => bc.status === 'published');
    return active[0]?.id ?? '';
  });
  const [topic, setTopic] = useState('');
  const [targetType, setTargetType] = useState('all-bootcamp');
  const [singleId, setSingleId] = useState('');
  const [groupIds, setGroupIds] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [when, setWhen] = useState('');
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState(() =>
    JSON.stringify([{ id: crypto.randomUUID(), type: 'richText', content: '' }])
  );
  const [submitting, setSubmitting] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [attended, setAttended] = useState(true);
  const [mode, setMode] = useState('online'); // 'online' | 'offline'
  const [location, setLocation] = useState('');

  const activeBootcamp = bootcamps.find((b) => b.id === bootcampId);
  const students = activeBootcamp?.students ?? [];

  const effectiveSingleId = singleId || students[0]?.id || '';

  const handleStartEdit = (session) => {
    setEditingSession(session);
    setBootcampId(
      session.bootcamp_id || session.bootcampId || bootcamps[0]?.id || ''
    );
    setTopic(session.topic || '');
    setTargetType(session.target_type || session.targetType || 'all-bootcamp');

    const rawIds = session.target_student_ids || session.targetStudentIds || [];
    const stIds = Array.isArray(rawIds)
      ? rawIds
      : typeof rawIds === 'string'
        ? rawIds.split(',')
        : [];

    setSingleId(session.targetStudentId || stIds[0] || '');
    setGroupIds(stIds);

    if (session.scheduled_at) {
      try {
        const d = new Date(session.scheduled_at);
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISOTime = new Date(d.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        setWhen(localISOTime);
      } catch (e) {
        setWhen(session.scheduled_at.slice(0, 16));
      }
    } else {
      setWhen('');
    }

    setDuration(session.duration || 60);
    setDescription(
      session.description ||
        JSON.stringify([
          { id: crypto.randomUUID(), type: 'richText', content: '' },
        ])
    );
    setMode(session.location ? 'offline' : 'online');
    setLocation(session.location || '');
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setTopic('');
    setDescription(
      JSON.stringify([
        { id: crypto.randomUUID(), type: 'richText', content: '' },
      ])
    );
    setSingleId('');
    setGroupIds([]);
    setWhen('');
    setDuration(60);
    setTargetType('all-bootcamp');
    setMode('online');
    setLocation('');
    if (bootcamps.length > 0) {
      setBootcampId(bootcamps[0].id);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !when) return;
    setSubmitting(true);

    let attendeeEmails = [];
    if (targetType === 'one-on-one') {
      const s = students.find((s) => s.id === effectiveSingleId);
      if (s?.email) attendeeEmails = [s.email];
    } else if (targetType === 'selected-group') {
      attendeeEmails = groupIds
        .map((id) => students.find((s) => s.id === id)?.email)
        .filter(Boolean);
    } else {
      attendeeEmails = students.map((s) => s.email).filter(Boolean);
    }

    const bc = bootcamps.find((b) => b.id === bootcampId);
    let bootcampTitle = bc?.title?.split(':')[0] ?? 'General';
    if (bc && bc.status !== 'published') {
      bootcampTitle = `${bootcampTitle} (Archived)`;
    }

    const targetStudentName =
      targetType === 'one-on-one'
        ? students.find((s) => s.id === effectiveSingleId)?.name || ''
        : '';
    const targetStudentAvatar =
      targetType === 'one-on-one'
        ? students.find((s) => s.id === effectiveSingleId)?.avatar_url || null
        : null;
    const targetStudentNames =
      targetType === 'selected-group'
        ? groupIds
            .map((id) => students.find((s) => s.id === id)?.name)
            .filter(Boolean)
        : [];
    const targetStudentAvatars =
      targetType === 'selected-group'
        ? groupIds.map(
            (id) => students.find((s) => s.id === id)?.avatar_url || null
          )
        : targetType === 'all-bootcamp'
          ? students.map((s) => s.avatar_url || null)
          : [];
    const targetStudentNamesAll =
      targetType === 'all-bootcamp' ? students.map((s) => s.name) : [];

    const fd = new FormData();
    fd.set('topic', topic.trim());
    fd.set('description', description.trim());
    fd.set('scheduled_at', new Date(when).toISOString());
    fd.set('duration', String(duration));
    fd.set('bootcamp_id', bootcampId || '');
    fd.set('target_type', targetType);
    fd.set(
      'target_student_ids',
      targetType === 'one-on-one' ? effectiveSingleId : groupIds.join(',')
    );
    fd.set('location', mode === 'offline' ? location.trim() : '');

    if (logMode) {
      fd.set('attended', attended ? 'on' : 'off');
      const result = await logPastSessionAction(fd);
      if (result?.error) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      const targetIds =
        targetType === 'one-on-one'
          ? [effectiveSingleId]
          : targetType === 'selected-group'
            ? groupIds
            : students.map((s) => s.id);

      const menteeName =
        targetType === 'one-on-one'
          ? targetStudentName || 'Unknown'
          : targetType === 'selected-group'
            ? targetStudentNames.join(', ') || 'Group'
            : bootcampTitle
              ? `${bootcampTitle} — All`
              : 'All enrolled';

      const avatars =
        targetType === 'one-on-one'
          ? targetStudentAvatar
            ? [targetStudentAvatar]
            : []
          : targetStudentAvatars;

      setSessions?.((prev) => [
        {
          id: result.session.id,
          topic: topic.trim(),
          session_date: new Date(when).toISOString(),
          duration,
          attended,
          notes: description.trim() || null,
          meet_link: null,
          targetType,
          bootcampTitle,
          menteeName,
          menteeAvatars: avatars,
          menteeAvatar: targetStudentAvatar ?? null,
          mentorship_id: null,
          attendance_data: targetIds.map((uid) => ({
            user_id: uid,
            attended,
            points: 0,
          })),
          recording_url: null,
          location: mode === 'offline' ? location.trim() : null,
        },
        ...prev,
      ]);

      toast.success('Session logged');
      handleCancelEdit();
      setLogMode?.(false);
      setSubmitting(false);
      return;
    }

    if (editingSession) {
      fd.set('sessionId', editingSession.id);
      const result = await updateScheduledSessionAction(fd);
      if (result?.error) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      setScheduled((prev) =>
        prev.map((s) =>
          s.id === editingSession.id
            ? {
                ...s,
                topic: topic.trim(),
                description: description.trim(),
                scheduled_at: new Date(when).toISOString(),
                duration,
                bootcamp_id: bootcampId,
                bootcampId,
                bootcampTitle,
                target_type: targetType,
                targetType,
                target_student_ids:
                  targetType === 'one-on-one'
                    ? [effectiveSingleId]
                    : targetType === 'selected-group'
                      ? groupIds
                      : [],
                targetStudentId: effectiveSingleId,
                targetStudentIds:
                  targetType === 'one-on-one'
                    ? [effectiveSingleId]
                    : targetType === 'selected-group'
                      ? groupIds
                      : [],
                targetStudentName,
                targetStudentAvatar,
                targetStudentNames,
                targetStudentAvatars,
                targetStudentNamesAll,
                location: mode === 'offline' ? location.trim() : null,
              }
            : s
        )
      );

      toast.success('Scheduled room updated successfully!');
      handleCancelEdit();
    } else {
      fd.set('attendee_emails', attendeeEmails.join(','));
      const result = await scheduleSessionAction(fd);
      if (result?.error) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      if (result?.meetWarning) toast(result.meetWarning, { icon: '⚠️' });

      setScheduled((prev) => [
        {
          id: result.session.id,
          topic: topic.trim(),
          description: description.trim(),
          scheduled_at: new Date(when).toISOString(),
          duration,
          bootcamp_id: bootcampId,
          bootcampId,
          bootcampTitle,
          target_type: targetType,
          targetType,
          target_student_ids:
            targetType === 'one-on-one'
              ? [effectiveSingleId]
              : targetType === 'selected-group'
                ? groupIds
                : [],
          targetStudentId: effectiveSingleId,
          targetStudentIds:
            targetType === 'one-on-one'
              ? [effectiveSingleId]
              : targetType === 'selected-group'
                ? groupIds
                : [],
          targetStudentName,
          targetStudentAvatar,
          targetStudentNames,
          targetStudentAvatars,
          targetStudentNamesAll,
          meet_link: result.meetLink,
          location: mode === 'offline' ? location.trim() : null,
          status: 'scheduled',
        },
        ...prev,
      ]);

      toast.success(
        mode === 'offline'
          ? 'In-person session scheduled'
          : result.meetLink
            ? 'Room scheduled — Meet link ready!'
            : 'Room scheduled (no Meet link)'
      );
      handleCancelEdit();
    }
    setSubmitting(false);
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this scheduled room?')) return;
    const fd = new FormData();
    fd.set('sessionId', id);
    const result = await cancelSessionAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      setScheduled((prev) => prev.filter((s) => s.id !== id));
      toast.success('Room cancelled');
      if (editingSession?.id === id) {
        handleCancelEdit();
      }
    }
  };

  const filtered = scheduled.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.topic.toLowerCase().includes(q) ||
      (s.bootcampTitle || '').toLowerCase().includes(q)
    );
  });

  const submitDisabled =
    submitting ||
    !topic.trim() ||
    !when ||
    (targetType === 'one-on-one' && !effectiveSingleId) ||
    (targetType === 'selected-group' && groupIds.length === 0) ||
    (mode === 'offline' && !location.trim());

  const hasScheduledRooms = scheduled.length > 0;

  return (
    <div
      className={`grid grid-cols-1 gap-6 ${hasScheduledRooms ? 'lg:grid-cols-12' : 'mx-auto max-w-2xl'}`}
    >
      {/* Scheduler Form */}
      <div className={`${hasScheduledRooms ? 'lg:col-span-5' : 'w-full'}`}>
        <GlassCard padding="p-0" className="overflow-hidden border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/2 px-5 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-gray-200">
                {logMode
                  ? 'Log past session'
                  : editingSession
                    ? 'Edit mentorship room'
                    : 'Schedule mentorship room'}
              </h3>
            </div>
            {logMode ? (
              <button
                type="button"
                onClick={() => {
                  handleCancelEdit();
                  setLogMode?.(false);
                }}
                className="flex cursor-pointer items-center gap-1 font-mono text-[10px] font-bold text-gray-400 transition hover:text-white"
              >
                <X className="h-3 w-3" /> Exit log mode
              </button>
            ) : editingSession ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex cursor-pointer items-center gap-1 font-mono text-[10px] font-bold text-gray-400 transition hover:text-white"
              >
                <X className="h-3 w-3" /> Cancel Edit
              </button>
            ) : (
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {mode === 'offline' ? 'In-person' : 'Google Meet ready'}
              </span>
            )}
          </div>

          <form onSubmit={handleSchedule} className="space-y-5 p-5 text-sm">
            {bootcamps.length === 0 && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                No bootcamps assigned yet — broadcast targeting is unavailable.
              </div>
            )}

            <Step n={1} label="Target bootcamp">
              <div className="relative">
                <select
                  value={bootcampId}
                  onChange={(e) => {
                    setBootcampId(e.target.value);
                    setSingleId('');
                    setGroupIds([]);
                    setGroupSearch('');
                  }}
                  disabled={bootcamps.length === 0}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-gray-200 transition-all duration-300 outline-none hover:bg-black/30 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40 disabled:opacity-50"
                >
                  {bootcamps.length === 0 ? (
                    <option>None assigned</option>
                  ) : (
                    (() => {
                      const options = activeBootcamps.slice();
                      if (editingSession && editingSession.bootcamp_id) {
                        const exists = options.some(
                          (o) => o.id === editingSession.bootcamp_id
                        );
                        if (!exists) {
                          const originalBc = bootcamps.find(
                            (b) => b.id === editingSession.bootcamp_id
                          );
                          if (originalBc) {
                            options.push(originalBc);
                          }
                        }
                      }
                      return options.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}{' '}
                          {b.status !== 'published' ? '(Archived)' : ''}
                        </option>
                      ));
                    })()
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                  <svg
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              <p className="mt-1 flex items-center gap-1.5 pl-0.5 text-[11px] text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {students.length} active candidate
                {students.length === 1 ? '' : 's'} in this track
              </p>
            </Step>

            <Step n={2} label="Session topic">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Advanced Segment Trees & Bitmasks"
                required
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40"
              />
            </Step>

            <Step n={3} label="Invitation mode">
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'one-on-one',
                    icon: User,
                    label: '1:1 Session',
                    desc: 'Single student',
                  },
                  {
                    id: 'selected-group',
                    icon: Users,
                    label: 'Group Room',
                    desc: 'Select members',
                  },
                  {
                    id: 'all-bootcamp',
                    icon: GraduationCap,
                    label: 'Broadcast',
                    desc: 'All enrolled',
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const chosen = targetType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTargetType(opt.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                        chosen
                          ? 'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                          : 'border-white/10 bg-black/20 text-gray-400 hover:bg-black/30 hover:text-gray-200'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${chosen ? 'text-emerald-400' : 'text-gray-400'}`}
                      />
                      <div>
                        <div className="text-[11px] leading-none font-bold">
                          {opt.label}
                        </div>
                        <div className="mt-1 text-[9px] opacity-70">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {targetType === 'one-on-one' && (
                  <motion.div
                    key="one"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/2 p-3"
                  >
                    {students.length > 0 ? (
                      <>
                        <div className="relative">
                          <select
                            value={effectiveSingleId}
                            onChange={(e) => setSingleId(e.target.value)}
                            className="w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-gray-200 outline-none focus:border-emerald-500/40"
                          >
                            {students.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                                {s.email ? ` · ${s.email}` : ''}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-gray-500">
                            <svg
                              className="h-3.5 w-3.5 fill-current"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                        {(() => {
                          const m = students.find(
                            (s) => s.id === effectiveSingleId
                          );
                          if (!m) return null;
                          return (
                            <div className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/2 p-2.5">
                              <Avatar
                                name={m.name}
                                src={m.avatar_url}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-gray-200">
                                  {m.name}
                                </p>
                                <p className="truncate text-[10px] text-gray-500">
                                  {m.email}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <p className="text-rose-455 py-1 text-[11px]">
                        No active candidates in this track.
                      </p>
                    )}
                  </motion.div>
                )}

                {targetType === 'selected-group' && (
                  <motion.div
                    key="group"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/2 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                        Assemble Group
                      </span>
                      <Pill tone="emerald">{groupIds.length} chosen</Pill>
                    </div>
                    {students.length > 0 ? (
                      <>
                        <div className="relative">
                          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            value={groupSearch}
                            onChange={(e) => setGroupSearch(e.target.value)}
                            placeholder="Filter members by name..."
                            className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pr-3 pl-8 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-emerald-500/40"
                          />
                        </div>
                        <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-1.5 pr-1">
                          {students
                            .filter(
                              (s) =>
                                !groupSearch.trim() ||
                                s.name
                                  .toLowerCase()
                                  .includes(groupSearch.toLowerCase()) ||
                                s.email
                                  .toLowerCase()
                                  .includes(groupSearch.toLowerCase())
                            )
                            .map((s) => {
                              const chosen = groupIds.includes(s.id);
                              return (
                                <button
                                  type="button"
                                  key={s.id}
                                  onClick={() =>
                                    setGroupIds((p) =>
                                      chosen
                                        ? p.filter((x) => x !== s.id)
                                        : [...p, s.id]
                                    )
                                  }
                                  className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-left transition-all ${
                                    chosen
                                      ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
                                      : 'border-white/5 bg-black/20 hover:bg-black/30'
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <Avatar
                                      name={s.name}
                                      src={s.avatar_url}
                                      size="sm"
                                    />
                                    <span className="truncate text-xs font-medium text-gray-200">
                                      {s.name}
                                    </span>
                                  </div>
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                                      chosen
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-white/15 bg-white/2'
                                    }`}
                                  >
                                    {chosen && (
                                      <Check className="h-2.5 w-2.5" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </>
                    ) : (
                      <p className="text-rose-455 py-1 text-[11px]">
                        No active candidates in this track.
                      </p>
                    )}
                  </motion.div>
                )}

                {targetType === 'all-bootcamp' && (
                  <motion.div
                    key="all"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="mt-3 flex gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                    <div className="text-xs text-gray-300">
                      <p className="font-semibold text-gray-100">
                        Broadcast invite list
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">
                        All{' '}
                        <span className="font-semibold text-blue-300">
                          {students.length} candidates
                        </span>{' '}
                        currently enrolled in this track will be sent standard
                        Google Calendar invites automatically.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>

            <Step n={4} label="Timeline & Duration">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="datetime-local"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    required
                    {...(logMode
                      ? { max: new Date().toISOString().slice(0, 16) }
                      : { min: new Date().toISOString().slice(0, 16) })}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pr-3 pl-9 text-xs text-gray-200 transition-all duration-300 outline-none focus:border-emerald-500/40"
                  />
                </div>
                <div className="relative">
                  <Clock className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 py-3 pr-3 pl-9 text-xs text-gray-200 outline-none focus:border-emerald-500/40"
                  >
                    {[30, 45, 60, 90, 120].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                    <svg
                      className="h-3.5 w-3.5 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Step>

            <Step n={5} label="Session mode">
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'online',
                    icon: Video,
                    label: 'Online',
                    desc: 'Google Meet',
                  },
                  {
                    id: 'offline',
                    icon: MapPin,
                    label: 'Offline',
                    desc: 'In-person',
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const chosen = mode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMode(opt.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                        chosen
                          ? 'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                          : 'border-white/10 bg-black/20 text-gray-400 hover:bg-black/30 hover:text-gray-200'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${chosen ? 'text-emerald-400' : 'text-gray-400'}`}
                      />
                      <div>
                        <div className="text-[11px] leading-none font-bold">
                          {opt.label}
                        </div>
                        <div className="mt-1 text-[9px] opacity-70">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {mode === 'offline' && (
                <div className="relative mt-3">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Venue / address (e.g. NEUPC Lab Room 304, Dhaka University)"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pr-3 pl-9 text-xs text-gray-200 placeholder-gray-600 transition-all duration-300 outline-none hover:bg-black/30 focus:border-emerald-500/40"
                  />
                </div>
              )}
            </Step>

            <Step n={6} label="Session description">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <MultiBlockEditor
                  key={editingSession ? `edit-${editingSession.id}` : 'create'}
                  value={description}
                  onChange={setDescription}
                />
              </div>
            </Step>

            {logMode && (
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 select-none hover:bg-white/2">
                <input
                  type="checkbox"
                  checked={attended}
                  onChange={(e) => setAttended(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/40"
                />
                <span className="text-xs text-gray-300">
                  Candidate(s) reported as present
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:from-emerald-500 hover:to-teal-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] disabled:cursor-not-allowed disabled:from-gray-800 disabled:to-gray-800 disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  {logMode
                    ? 'Logging…'
                    : editingSession
                      ? 'Saving changes...'
                      : mode === 'offline'
                        ? 'Saving session…'
                        : 'Generating Meet link…'}
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 text-emerald-200" />
                  {logMode
                    ? 'Log Session'
                    : editingSession
                      ? 'Save Changes'
                      : mode === 'offline'
                        ? 'Schedule In-Person Session'
                        : 'Schedule Room & Create Meet Link'}
                </>
              )}
            </button>
          </form>
        </GlassCard>
      </div>

      {/* Scheduled List Panel */}
      {hasScheduledRooms && (
        <div className="flex flex-col gap-4 lg:col-span-7">
          <GlassCard
            padding="p-0"
            className="flex h-full flex-col overflow-hidden border-white/10"
          >
            <div className="flex flex-col gap-3 border-b border-white/10 bg-white/2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-200">
                  Scheduled rooms
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Upcoming interactive mentorship channels
                </p>
              </div>
              <div className="relative sm:w-56">
                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by topic or track..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-1.5 pr-3 pl-8 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-emerald-500/40"
                />
              </div>
            </div>

            <div className="max-h-[670px] flex-1 space-y-3 overflow-y-auto p-5">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Tv}
                  title="No matched rooms"
                  description="Adjust your keyword filter search and try again."
                />
              ) : (
                <StaggerList>
                  {filtered.map((s) => (
                    <ScheduledRow
                      key={s.id}
                      session={s}
                      bootcamps={bootcamps}
                      onCancel={() => handleCancel(s.id)}
                      onEnd={(attendanceData) =>
                        onEndSession(s, attendanceData)
                      }
                      onEndOnly={() => onEndSession(s, [])}
                      onRecordingUploaded={(id, url) =>
                        setScheduled((prev) =>
                          prev.map((r) =>
                            r.id === id ? { ...r, recording_url: url } : r
                          )
                        )
                      }
                      onEdit={() => handleStartEdit(s)}
                    />
                  ))}
                </StaggerList>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function ScheduledRow({
  session: s,
  onCancel,
  onEnd,
  onEndOnly,
  onRecordingUploaded,
  bootcamps,
  onEdit,
}) {
  const [now, setNow] = useState(() => Date.now());
  const [showAttendance, setShowAttendance] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const scheduledMs = s.scheduled_at
    ? new Date(s.scheduled_at).getTime()
    : null;
  const endMs =
    scheduledMs !== null ? scheduledMs + (s.duration || 60) * 60_000 : null;
  const hasStarted = scheduledMs !== null && now >= scheduledMs;
  const hasEnded = endMs !== null && now >= endMs;

  const countdown = useMemo(() => {
    if (hasStarted || scheduledMs === null) return null;
    const diff = scheduledMs - now;
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const sec = Math.floor((diff % 60_000) / 1_000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${sec}s`;
  }, [now, scheduledMs, hasStarted]);

  const isOneOnOne = s.targetType === 'one-on-one';
  const isGroup = s.targetType === 'selected-group';
  const isBroadcast = s.targetType === 'all-bootcamp';

  const target = isOneOnOne
    ? { label: '1:1 Session', icon: User, tone: 'violet' }
    : isGroup
      ? { label: 'Group Room', icon: Users, tone: 'amber' }
      : { label: 'Broadcast', icon: GraduationCap, tone: 'sky' };

  const bc = bootcamps?.find((b) => b.id === s.bootcampId);
  const isArchived = bc ? bc.status !== 'published' : false;
  const allStudents = bc?.students ?? [];
  const sessionStudents = isOneOnOne
    ? allStudents.filter((u) => u.id === s.targetStudentId)
    : isGroup
      ? allStudents.filter((u) => (s.targetStudentIds ?? []).includes(u.id))
      : allStudents;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-xl border border-l-4 border-white/10 bg-white/2 p-4 transition-all hover:border-white/20 hover:bg-white/2 ${hasStarted ? 'border-l-emerald-500' : 'border-l-violet-500'}`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {s.bootcampTitle && <Pill tone="gray">{s.bootcampTitle}</Pill>}
              <Pill tone={target.tone} icon={target.icon}>
                {target.label}
              </Pill>
              {hasStarted ? (
                <Pill tone="emerald" icon={Video}>
                  <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live Room
                </Pill>
              ) : (
                <Pill tone="amber" icon={Clock}>
                  {countdown ?? 'Scheduled'}
                </Pill>
              )}
            </div>

            <h4 className="text-sm leading-tight font-semibold text-white">
              {s.topic}
            </h4>
            <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Calendar className="text-gray-650 h-3.5 w-3.5" />
              {s.scheduled_at ? formatDatetime(s.scheduled_at) : 'TBD'}
              <span className="text-gray-700">·</span>
              <Clock className="text-gray-650 h-3.5 w-3.5" />
              {s.duration || 60} mins
            </p>

            {s.description && descriptionPreview(s.description) && (
              <div className="max-w-xl rounded-lg border border-white/5 bg-white/2 px-3 py-2 text-[11px] leading-relaxed text-gray-400">
                {descriptionPreview(s.description)}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-2">
              <span className="mr-1 text-[9px] font-semibold tracking-wider text-gray-500 uppercase">
                Targeted candidates
              </span>
              {isOneOnOne && (
                <div className="flex items-center gap-1.5">
                  <Avatar
                    name={s.targetStudentName || 'Student'}
                    src={s.targetStudentAvatar}
                    size="sm"
                  />
                  <span className="text-xs font-medium text-gray-300">
                    {s.targetStudentName || 'Student'}
                  </span>
                </div>
              )}
              {isGroup &&
                (() => {
                  const names = s.targetStudentNames || [];
                  const avatars = s.targetStudentAvatars || [];
                  const MAX = 4;
                  const overflow = names.length - MAX;
                  return (
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {names.slice(0, MAX).map((n, i) => (
                          <div
                            key={i}
                            className="rounded-full ring-2 ring-gray-950"
                            title={n}
                          >
                            <Avatar name={n} src={avatars[i]} size="sm" />
                          </div>
                        ))}
                        {overflow > 0 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-[9px] font-bold text-gray-300 ring-2 ring-gray-950">
                            +{overflow}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        ({names.length} candidates)
                      </span>
                    </div>
                  );
                })()}
              {isBroadcast &&
                (() => {
                  const names = s.targetStudentNamesAll || [];
                  const avatars = s.targetStudentAvatars || [];
                  const MAX = 4;
                  const overflow = names.length - MAX;
                  return names.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {names.slice(0, MAX).map((n, i) => (
                          <div
                            key={i}
                            className="rounded-full ring-2 ring-gray-950"
                            title={n}
                          >
                            <Avatar name={n} src={avatars[i]} size="sm" />
                          </div>
                        ))}
                        {overflow > 0 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-[9px] font-bold text-gray-300 ring-2 ring-gray-950">
                            +{overflow}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        Everyone Enrolled ({names.length})
                      </span>
                    </div>
                  ) : (
                    <Pill tone="sky" icon={Users}>
                      Everyone Enrolled
                    </Pill>
                  );
                })()}
            </div>

            {hasStarted && (
              <div className="max-w-md border-t border-white/5 pt-2">
                <RecordingUpload
                  sessionId={s.id}
                  initialUrl={s.recording_url}
                  onUploaded={(url) => onRecordingUploaded?.(s.id, url)}
                  readOnly={isArchived}
                />
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-end">
            {hasStarted ? (
              <>
                {s.location ? (
                  <span
                    className="inline-flex max-w-[260px] items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300"
                    title={s.location}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{s.location}</span>
                  </span>
                ) : s.meet_link && !hasEnded ? (
                  <a
                    href={s.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:scale-102 hover:bg-emerald-500"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Join Meet
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-3.5 py-2 text-xs text-gray-500">
                    {hasEnded ? 'Session Completed' : 'No Meet Link'}
                  </span>
                )}
                {!isArchived && (
                  <>
                    <button
                      onClick={() => setShowAttendance(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                      title="Mark attendance sheet"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Attendance Sheet
                    </button>
                    <button
                      disabled={endingSession}
                      onClick={async () => {
                        setEndingSession(true);
                        const fd = new FormData();
                        fd.set('sessionId', s.id);
                        const res = await endSessionAction(fd);
                        if (res?.error) {
                          toast.error(res.error);
                          setEndingSession(false);
                          return;
                        }
                        toast.success('Session ended');
                        onEndOnly?.();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                      title="End mentorship room"
                    >
                      {endingSession ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      End Session
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs font-semibold text-amber-300">
                  <Clock className="text-amber-405 h-3.5 w-3.5 animate-pulse" />
                  {countdown ?? 'Scheduled'}
                </span>
                {!isArchived && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onEdit}
                      className="rounded-lg border border-white/10 bg-black/30 p-2 text-gray-500 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                      title="Edit scheduled room details"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={onCancel}
                      className="rounded-lg border border-white/10 bg-black/30 p-2 text-gray-500 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
                      title="Cancel room slot"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAttendance && (
          <AttendanceModal
            session={s}
            students={sessionStudents}
            onClose={() => setShowAttendance(false)}
            onSaved={(attendanceData) => {
              setShowAttendance(false);
              onEnd?.(attendanceData);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Step({ n, label, children }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
        <span className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-[10px] font-black text-emerald-400">
          {n}
        </span>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Past Sessions Workspace (Dual Pane Layout) ───────────────────────────────────


export { ScheduledRoomsView };

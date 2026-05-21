'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MultiBlockEditor = dynamic(
  () => import('@/app/account/admin/bootcamps/_components/MultiBlockEditor'),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-xl border border-white/[0.08] bg-white/[0.02]" /> }
);
import { AnimatePresence, motion } from 'framer-motion';
import {
  Video, Plus, Search, X, Calendar, Clock, CheckCircle2, XCircle, Check,
  MessageSquare, Trash2, Loader2, User, Users, GraduationCap,
  AlertCircle, BookOpen, Tv, ExternalLink, Upload, Film,
} from 'lucide-react';
import {
  createMentorshipSessionAction,
  updateSessionNotesAction,
  deleteSessionAction,
  scheduleSessionAction,
  cancelSessionAction,
  endSessionAction,
  saveSessionAttendanceAction,
  uploadSessionRecordingAction,
} from '@/app/_lib/mentor-actions';
import { useScrollLock } from '@/app/_lib/hooks';
import {
  PageShell, PageHeader, GlassCard, StatCard, Avatar, Pill, ActionButton, EmptyState, TabBar,
} from '@/app/account/mentor/_components/_ui';
import toast from 'react-hot-toast';

function descriptionPreview(desc) {
  if (!desc) return '';
  try {
    const blocks = JSON.parse(desc);
    if (Array.isArray(blocks)) {
      return blocks.map(b => b.content || '').join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  } catch {}
  return desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatDatetime = (d) =>
  new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─────────────────────────────────────────────────────────────────────────────

export default function MentorSessionsClient({
  mentorships: rawMentorships = [],
  mentorId,
  bootcamps = [],
  scheduledSessions: initialScheduled = [],
  pastScheduledSessions = [],
}) {
  const mentorships = rawMentorships;
  const [tab, setTab] = useState('rooms');
  const [scheduled, setScheduled] = useState(initialScheduled);

  // Past-sessions: mentorship 1:1 sessions + completed bootcamp-scheduled sessions
  const [sessions, setSessions] = useState(() => {
    const mentorshipPast = mentorships.flatMap((m) => {
      const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
      return (m.mentorship_sessions || [])
        .filter((s) => s.status !== 'scheduled' && s.status !== 'cancelled')
        .map((s) => ({
          ...s,
          menteeName: mentee?.full_name || 'Unknown',
          menteeAvatar: mentee?.avatar_url,
          mentorship_id: m.id,
        }));
    });
    const bootcampPast = pastScheduledSessions.map((s) => {
      const ad = s.attendance_data ?? [];
      const anyPresent = ad.some((r) => r.attended);
      return {
        id: s.id,
        topic: s.topic,
        session_date: s.scheduled_at,
        duration: s.duration,
        attended: ad.length > 0 ? anyPresent : true,
        notes: s.description || null,
        meet_link: null,
        targetType: s.targetType,
        bootcampTitle: s.bootcampTitle || '',
        menteeName: s.targetType === 'one-on-one'
          ? (s.targetStudentName || 'Unknown')
          : s.targetType === 'selected-group'
          ? (s.targetStudentNames?.join(', ') || 'Group')
          : (s.bootcampTitle ? `${s.bootcampTitle} — All` : 'All enrolled'),
        menteeAvatars: s.targetType === 'one-on-one'
          ? (s.targetStudentAvatar ? [s.targetStudentAvatar] : [])
          : (s.targetStudentAvatars ?? []),
        menteeAvatar: s.targetStudentAvatar ?? null,
        mentorship_id: null,
        attendance_data: ad,
      };
    });
    return [...mentorshipPast, ...bootcampPast].sort(
      (a, b) => new Date(b.session_date) - new Date(a.session_date)
    );
  });

  const scheduledToPast = (s, attendanceData) => {
    const ad = attendanceData ?? [];
    const anyPresent = ad.some((r) => r.attended);
    return {
      id: s.id,
      topic: s.topic,
      session_date: s.scheduled_at,
      duration: s.duration,
      attended: ad.length > 0 ? anyPresent : false,
      notes: s.description || null,
      meet_link: null,
      targetType: s.targetType,
      bootcampTitle: s.bootcampTitle || '',
      menteeName: s.targetType === 'one-on-one'
        ? (s.targetStudentName || 'Unknown')
        : s.targetType === 'selected-group'
        ? (s.targetStudentNames?.join(', ') || 'Group')
        : (s.bootcampTitle ? `${s.bootcampTitle} — All` : 'All enrolled'),
      menteeAvatars: s.targetType === 'one-on-one'
        ? (s.targetStudentAvatar ? [s.targetStudentAvatar] : [])
        : (s.targetStudentAvatars ?? []),
      menteeAvatar: s.targetStudentAvatar ?? null,
      mentorship_id: null,
      attendance_data: ad,
    };
  };

  // Auto-expire: move sessions past their end time into past sessions list
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setScheduled((prev) => {
        const expired = prev.filter((s) => {
          const endMs = new Date(s.scheduled_at).getTime() + (s.duration || 60) * 60_000;
          return endMs <= now;
        });
        if (expired.length === 0) return prev;
        setSessions((prevSessions) => [
          ...expired.map((s) => scheduledToPast(s, [])),
          ...prevSessions,
        ]);
        return prev.filter((s) => {
          const endMs = new Date(s.scheduled_at).getTime() + (s.duration || 60) * 60_000;
          return endMs > now;
        });
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEndSession = (session, attendanceData) => {
    setScheduled((prev) => prev.filter((s) => s.id !== session.id));
    setSessions((prev) => [scheduledToPast(session, attendanceData ?? []), ...prev]);
  };

  const allSessions = sessions;

  const now = new Date();
  const pastStats = {
    total: allSessions.length,
    attended: allSessions.filter((s) =>
      s.attendance_data?.length > 0 ? s.attendance_data.some((r) => r.attended) : s.attended
    ).length,
    thisMonth: allSessions.filter((s) => {
      const d = new Date(s.session_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    totalHours: Math.round((allSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60) * 10) / 10,
  };

  return (
    <PageShell>
      <PageHeader
        icon={Video}
        title="Sessions"
        subtitle="Schedule mentorship rooms and log past sessions"
        accent="emerald"
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Scheduled" value={scheduled.length} accent="violet" delay={0} />
        <StatCard label="Past sessions" value={pastStats.total} accent="blue" delay={0.05} />
        <StatCard
          label="Attended"
          value={pastStats.attended}
          accent="emerald"
          delay={0.1}
          sublabel={pastStats.total ? `${Math.round((pastStats.attended / pastStats.total) * 100)}% rate` : null}
        />
        <StatCard label="Hours logged" value={pastStats.totalHours} accent="amber" delay={0.15} />
      </div>

      <div className="mt-5">
        <TabBar
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'rooms', label: 'Scheduled rooms', icon: Tv, count: scheduled.length },
            { value: 'past',  label: 'Past sessions',   icon: Clock, count: allSessions.length },
          ]}
        />
      </div>

      <div className="mt-5">
        {tab === 'rooms' ? (
          <ScheduledRoomsView
            bootcamps={bootcamps}
            mentorships={mentorships}
            scheduled={scheduled}
            setScheduled={setScheduled}
            onEndSession={handleEndSession}
          />
        ) : (
          <PastSessionsView mentorships={mentorships} mentorId={mentorId} sessions={allSessions} setSessions={setSessions} />
        )}
      </div>
    </PageShell>
  );
}

// ─── Scheduled Rooms (Scheduler + List) ───────────────────────────────────────

function ScheduledRoomsView({ bootcamps, mentorships, scheduled, setScheduled, onEndSession }) {
  const [search, setSearch] = useState('');

  // Form state
  const [bootcampId, setBootcampId] = useState(bootcamps[0]?.id ?? '');
  const [topic, setTopic] = useState('');
  const [targetType, setTargetType] = useState('all-bootcamp');
  const [singleId, setSingleId] = useState('');
  const [groupIds, setGroupIds] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [when, setWhen] = useState('');
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState(
    () => JSON.stringify([{ id: crypto.randomUUID(), type: 'richText', content: '' }])
  );
  const [submitting, setSubmitting] = useState(false);

  const activeBootcamp = bootcamps.find((b) => b.id === bootcampId);
  const students = activeBootcamp?.students ?? [];

  // Pick 1:1 mentorship for one-on-one targeting
  const activeMentorships = mentorships.filter((m) => m.status === 'active');

  useEffect(() => {
    setSingleId('');
    setGroupIds([]);
    setGroupSearch('');
  }, [bootcampId]);

  useEffect(() => {
    if (targetType === 'one-on-one' && !singleId && students.length > 0) {
      setSingleId(students[0].id);
    }
  }, [targetType, singleId, students]);

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !when) return;
    setSubmitting(true);

    // Gather attendee emails for Google Calendar invites
    let attendeeEmails = [];
    if (targetType === 'one-on-one') {
      const s = students.find((s) => s.id === singleId);
      if (s?.email) attendeeEmails = [s.email];
    } else if (targetType === 'selected-group') {
      attendeeEmails = groupIds.map((id) => students.find((s) => s.id === id)?.email).filter(Boolean);
    } else {
      attendeeEmails = students.map((s) => s.email).filter(Boolean);
    }

    const bc = bootcamps.find((b) => b.id === bootcampId);
    const bootcampTitle = bc?.title?.split(':')[0] ?? 'General';

    const targetStudentName = targetType === 'one-on-one'
      ? students.find((s) => s.id === singleId)?.name || ''
      : '';
    const targetStudentAvatar = targetType === 'one-on-one'
      ? students.find((s) => s.id === singleId)?.avatar_url || null
      : null;
    const targetStudentNames = targetType === 'selected-group'
      ? groupIds.map((id) => students.find((s) => s.id === id)?.name).filter(Boolean)
      : [];
    const targetStudentAvatars = targetType === 'selected-group'
      ? groupIds.map((id) => students.find((s) => s.id === id)?.avatar_url || null)
      : targetType === 'all-bootcamp'
      ? students.map((s) => s.avatar_url || null)
      : [];
    const targetStudentNamesAll = targetType === 'all-bootcamp'
      ? students.map((s) => s.name)
      : [];

    const fd = new FormData();
    fd.set('topic', topic.trim());
    fd.set('description', description.trim());
    fd.set('scheduled_at', new Date(when).toISOString());
    fd.set('duration', String(duration));
    fd.set('bootcamp_id', bootcampId || '');
    fd.set('target_type', targetType);
    fd.set('target_student_ids',
      targetType === 'one-on-one' ? singleId : groupIds.join(',')
    );
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
        bootcampId,
        bootcampTitle,
        targetType,
        targetStudentId: singleId,
        targetStudentName,
        targetStudentAvatar,
        targetStudentIds: [...groupIds],
        targetStudentNames,
        targetStudentAvatars,
        targetStudentNamesAll,
        meet_link: result.meetLink,
        status: 'scheduled',
      },
      ...prev,
    ]);

    setTopic('');
    setDescription(JSON.stringify([{ id: crypto.randomUUID(), type: 'richText', content: '' }]));
    setSingleId('');
    setGroupIds([]);
    setWhen('');
    toast.success(result.meetLink ? 'Room scheduled — Meet link ready!' : 'Room scheduled (no Meet link)');
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
    }
  };

  const filtered = scheduled.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.topic.toLowerCase().includes(q) || (s.bootcampTitle || '').toLowerCase().includes(q);
  });

  const submitDisabled =
    submitting ||
    !topic.trim() ||
    !when ||
    (targetType === 'one-on-one' && !singleId) ||
    (targetType === 'selected-group' && groupIds.length === 0);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Scheduler */}
      <GlassCard padding="p-0" className={`${scheduled.length === 0 ? 'lg:col-span-12' : 'lg:col-span-6'} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-gray-200">Schedule mentorship room</h3>
          </div>
          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">Google Meet</span>
        </div>

        <form onSubmit={handleSchedule} className="p-5 space-y-4 text-sm">
          {bootcamps.length === 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              No bootcamps assigned yet — broadcast targeting is unavailable.
            </div>
          )}

          <Step n={1} label="Target bootcamp">
            <select
              value={bootcampId}
              onChange={(e) => setBootcampId(e.target.value)}
              disabled={bootcamps.length === 0}
              className="w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/40 cursor-pointer disabled:opacity-50"
            >
              {bootcamps.length === 0 ? (
                <option>None assigned</option>
              ) : (
                bootcamps.map((b) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))
              )}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">
              {students.length} active candidate{students.length === 1 ? '' : 's'} in this track
            </p>
          </Step>

          <Step n={2} label="Session topic">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Segment Tree bounds review"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500/40"
            />
          </Step>

          <Step n={3} label="Invitation mode">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'one-on-one',     icon: User,          label: '1:1',       desc: 'Single student' },
                { id: 'selected-group', icon: Users,         label: 'Group',     desc: 'Select members' },
                { id: 'all-bootcamp',   icon: GraduationCap, label: 'Broadcast', desc: 'All enrolled' },
              ].map((opt) => {
                const Icon = opt.icon;
                const chosen = targetType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTargetType(opt.id)}
                    className={`rounded-xl border p-2.5 text-center transition-all flex flex-col items-center gap-1.5 ${
                      chosen
                        ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                        : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <div className="text-[11px] font-bold leading-none">{opt.label}</div>
                      <div className="text-[9px] opacity-70 mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {targetType === 'one-on-one' && (
                <motion.div
                  key="one"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="mt-3 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  {students.length > 0 ? (
                    <>
                      <select
                        value={singleId}
                        onChange={(e) => setSingleId(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-2 text-xs text-gray-200 outline-none cursor-pointer focus:border-violet-500/40"
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}{s.email ? ` · ${s.email}` : ''}</option>
                        ))}
                      </select>
                      {(() => {
                        const m = students.find((s) => s.id === singleId);
                        if (!m) return null;
                        return (
                          <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                            <Avatar name={m.name} src={m.avatar_url} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-200 truncate">{m.name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{m.email}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <p className="text-[11px] text-rose-300">No active students in this track.</p>
                  )}
                </motion.div>
              )}

              {targetType === 'selected-group' && (
                <motion.div
                  key="group"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="mt-3 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Build group</span>
                    <Pill tone="violet">{groupIds.length} selected</Pill>
                  </div>
                  {students.length > 0 ? (
                    <>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                        <input
                          type="text"
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          placeholder="Search students…"
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500/40"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {students
                          .filter((s) => !groupSearch.trim() ||
                            s.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
                            s.email.toLowerCase().includes(groupSearch.toLowerCase()))
                          .map((s) => {
                            const chosen = groupIds.includes(s.id);
                            return (
                              <button
                                type="button"
                                key={s.id}
                                onClick={() => setGroupIds((p) => chosen ? p.filter((x) => x !== s.id) : [...p, s.id])}
                                className={`w-full flex items-center justify-between rounded-lg border px-2 py-1.5 text-left transition-all ${
                                  chosen
                                    ? 'border-violet-500/30 bg-violet-500/10'
                                    : 'border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar name={s.name} src={s.avatar_url} size="sm" />
                                  <span className="text-xs font-medium text-gray-200 truncate">{s.name}</span>
                                </div>
                                <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                                  chosen ? 'border-violet-500 bg-violet-500 text-white' : 'border-white/15 bg-white/[0.02]'
                                }`}>
                                  {chosen && <Check className="h-2.5 w-2.5" />}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-rose-300">No active students in this track.</p>
                  )}
                </motion.div>
              )}

              {targetType === 'all-bootcamp' && (
                <motion.div
                  key="all"
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                  className="mt-3 flex gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-blue-300 mt-0.5" />
                  <div className="text-xs text-gray-300">
                    <p className="font-semibold text-gray-100">Broadcast to whole track</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      All <span className="font-semibold text-blue-300">{students.length} enrolled candidate{students.length === 1 ? '' : 's'}</span> will receive the Calendar invite.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Step>

          <Step n={4} label="When">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                <input
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-gray-200 outline-none focus:border-violet-500/40"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-gray-200 outline-none focus:border-violet-500/40 cursor-pointer"
                >
                  {[30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
              </div>
            </div>
          </Step>

          <Step n={5} label="Session content & details">
            <div className="rounded-xl overflow-hidden">
              <MultiBlockEditor
                value={description}
                onChange={setDescription}
              />
            </div>
          </Step>

          <button
            type="submit"
            disabled={submitDisabled}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Meet link…</>
              : <><Calendar className="h-4 w-4" /> Schedule room &amp; create Meet link</>}
          </button>
        </form>
      </GlassCard>

      {/* Scheduled list — only rendered once there's something to show */}
      {scheduled.length > 0 && <GlassCard padding="p-0" className="lg:col-span-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Scheduled rooms</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Upcoming mentorship classrooms</p>
          </div>
          <div className="relative sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topic or track…"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500/40"
            />
          </div>
        </div>

        <div className="p-5 space-y-3 max-h-[640px] overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Tv}
              title={scheduled.length === 0 ? 'No rooms scheduled' : 'No matches'}
              description={scheduled.length === 0
                ? 'Use the form to queue your first mentorship room.'
                : 'Adjust your search and try again.'}
            />
          ) : (
            filtered.map((s) => (
              <ScheduledRow
                key={s.id}
                session={s}
                bootcamps={bootcamps}
                onCancel={() => handleCancel(s.id)}
                onEnd={(attendanceData) => onEndSession(s, attendanceData)}
                onEndOnly={() => onEndSession(s, [])}
                onRecordingUploaded={(id, url) =>
                  setScheduled((prev) => prev.map((r) => r.id === id ? { ...r, recording_url: url } : r))
                }
              />
            ))
          )}
        </div>
      </GlassCard>}
    </div>
  );
}

function ScheduledRow({ session: s, onCancel, onEnd, onEndOnly, onRecordingUploaded, bootcamps }) {
  const [now, setNow] = useState(() => Date.now());
  const [showAttendance, setShowAttendance] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const scheduledMs = s.scheduled_at ? new Date(s.scheduled_at).getTime() : null;
  const endMs = scheduledMs !== null ? scheduledMs + (s.duration || 60) * 60_000 : null;
  const hasStarted = scheduledMs !== null && now >= scheduledMs;
  const hasEnded = endMs !== null && now >= endMs;

  const countdown = useMemo(() => {
    if (hasStarted || scheduledMs === null) return null;
    const diff = scheduledMs - now;
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  }, [now, scheduledMs, hasStarted]);

  const isOneOnOne  = s.targetType === 'one-on-one';
  const isGroup     = s.targetType === 'selected-group';
  const isBroadcast = s.targetType === 'all-bootcamp';

  const target = isOneOnOne
    ? { label: '1:1', icon: User, tone: 'violet' }
    : isGroup
    ? { label: 'Group', icon: Users, tone: 'amber' }
    : { label: 'Broadcast', icon: GraduationCap, tone: 'sky' };

  // Resolve full student list for this session (for the attendance modal)
  const bc = bootcamps?.find((b) => b.id === s.bootcampId);
  const allStudents = bc?.students ?? [];
  const sessionStudents = isOneOnOne
    ? allStudents.filter((u) => u.id === s.targetStudentId)
    : isGroup
    ? allStudents.filter((u) => (s.targetStudentIds ?? []).includes(u.id))
    : allStudents;

  return (
    <>
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.1]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {s.bootcampTitle && <Pill tone="gray">{s.bootcampTitle}</Pill>}
            <Pill tone={target.tone} icon={target.icon}>{target.label}</Pill>
            {hasStarted
              ? <Pill tone="emerald" icon={Video}>Live</Pill>
              : <Pill tone="amber" icon={Clock}>{countdown ?? 'Scheduled'}</Pill>
            }
          </div>

          <h4 className="text-sm font-semibold text-white leading-tight">{s.topic}</h4>
          <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Calendar className="h-3 w-3" />
            {s.scheduled_at ? formatDatetime(s.scheduled_at) : 'TBD'}
          </p>

          {s.description && descriptionPreview(s.description) && (
            <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-[11px] text-gray-400 leading-relaxed">
              {descriptionPreview(s.description)}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.04] pt-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Invited</span>
            {isOneOnOne && (
              <div className="flex items-center gap-1.5">
                <Avatar name={s.targetStudentName || 'Student'} src={s.targetStudentAvatar} size="sm" />
                <span className="text-xs text-gray-300">{s.targetStudentName || 'Student'}</span>
              </div>
            )}
            {isGroup && (() => {
              const names = s.targetStudentNames || [];
              const avatars = s.targetStudentAvatars || [];
              const MAX = 5;
              const overflow = names.length - MAX;
              return (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {names.slice(0, MAX).map((n, i) => (
                      <div key={i} className="ring-2 ring-gray-900 rounded-full" title={n}>
                        <Avatar name={n} src={avatars[i]} size="sm" />
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="h-6 w-6 rounded-full ring-2 ring-gray-900 bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-300">
                        +{overflow}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{names.length} member{names.length !== 1 ? 's' : ''}</span>
                </div>
              );
            })()}
            {isBroadcast && (() => {
              const names = s.targetStudentNamesAll || [];
              const avatars = s.targetStudentAvatars || [];
              const MAX = 5;
              const overflow = names.length - MAX;
              return names.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {names.slice(0, MAX).map((n, i) => (
                      <div key={i} className="ring-2 ring-gray-900 rounded-full" title={n}>
                        <Avatar name={n} src={avatars[i]} size="sm" />
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="h-6 w-6 rounded-full ring-2 ring-gray-900 bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-300">
                        +{overflow}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">Everyone enrolled ({names.length})</span>
                </div>
              ) : (
                <Pill tone="sky" icon={Users}>Everyone enrolled</Pill>
              );
            })()}
          </div>

          {hasStarted && (
            <div className="border-t border-white/[0.04] pt-2">
              <RecordingUpload
                sessionId={s.id}
                initialUrl={s.recording_url}
                onUploaded={(url) => onRecordingUploaded?.(s.id, url)}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-end">
          {hasStarted ? (
            <>
              {s.meet_link && !hasEnded ? (
                <a
                  href={s.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition-colors"
                >
                  <Video className="h-3.5 w-3.5" />
                  Join Meet
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-gray-500">
                  {hasEnded ? 'Session ended' : 'No Meet link'}
                </span>
              )}
              <button
                onClick={() => setShowAttendance(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors"
                title="Record attendance"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Attendance
              </button>
              <button
                disabled={endingSession}
                onClick={async () => {
                  setEndingSession(true);
                  const fd = new FormData();
                  fd.set('sessionId', s.id);
                  const res = await endSessionAction(fd);
                  if (res?.error) { toast.error(res.error); setEndingSession(false); return; }
                  toast.success('Session ended');
                  onEndOnly?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors disabled:opacity-50"
                title="End session"
              >
                {endingSession ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                End session
              </button>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                <Clock className="h-3.5 w-3.5" />
                {countdown ?? 'Scheduled'}
              </span>
              <button
                onClick={onCancel}
                className="p-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-rose-500/10 hover:border-rose-500/30 text-gray-500 hover:text-rose-300 transition-colors"
                title="Cancel room"
              >
                <X className="h-3.5 w-3.5" />
              </button>
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
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-500/15 text-[9px] font-bold text-violet-300">{n}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Past Sessions (real backend) ─────────────────────────────────────────────

function groupByDate(sessions) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);

  const groups = { Today: [], Yesterday: [], 'This week': [], 'This month': [], Earlier: [] };
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

function PastSessionsView({ mentorships, mentorId, sessions, setSessions }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editNotes, setEditNotes] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sessions
      .filter((s) => {
        const effectiveAttended = s.attendance_data?.length > 0
          ? s.attendance_data.some((r) => r.attended)
          : s.attended;
        if (filter === 'attended' && !effectiveAttended) return false;
        if (filter === 'missed' && effectiveAttended) return false;
        if (q && !s.topic?.toLowerCase().includes(q) && !s.menteeName?.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  }, [sessions, search, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    const fd = new FormData();
    fd.set('sessionId', editNotes.sessionId);
    fd.set('notes', editNotes.notes);
    const result = await updateSessionNotesAction(fd);
    if (result?.error) toast.error(result.error);
    else { toast.success('Notes saved'); setEditNotes(null); }
    setSavingNotes(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this session record?')) return;
    setDeleting(id);
    const fd = new FormData();
    fd.set('sessionId', id);
    const result = await deleteSessionAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Session deleted');
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topic or mentee…"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-emerald-500/40"
          />
        </div>
        <div className="flex gap-2">
          {[
            { v: 'all', label: 'All' },
            { v: 'attended', label: 'Attended' },
            { v: 'missed', label: 'Missed' },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setFilter(t.v)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filter === t.v
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200'
                  : 'bg-white/[0.02] border border-white/[0.08] text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              }`}
            >
              {t.label}
            </button>
          ))}
          <ActionButton tone="emerald" icon={Plus} onClick={() => setShowModal(true)}>
            Log session
          </ActionButton>
        </div>
      </div>

      {grouped.length === 0 ? (
        <GlassCard padding="py-12">
          <EmptyState
            icon={Video}
            title={search || filter !== 'all' ? 'No matching sessions' : 'No sessions logged yet'}
            description={search || filter !== 'all' ? 'Try adjusting the filters.' : 'Log your first session to start tracking.'}
            accent="emerald"
            action={
              <ActionButton tone="emerald" icon={Plus} onClick={() => setShowModal(true)}>
                Log session
              </ActionButton>
            }
          />
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {grouped.map(([label, items]) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</h3>
                <span className="text-[11px] text-gray-600">{items.length}</span>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>
              <div className="space-y-2">
                {items.map((s) => (
                  <PastSessionCard
                    key={s.id}
                    session={s}
                    editing={editNotes?.sessionId === s.id}
                    editNotes={editNotes}
                    setEditNotes={setEditNotes}
                    onSaveNotes={handleSaveNotes}
                    savingNotes={savingNotes}
                    onDelete={() => handleDelete(s.id)}
                    deleting={deleting === s.id}
                    onRecordingUploaded={(id, url) =>
                      setSessions((prev) => prev.map((r) => r.id === id ? { ...r, recording_url: url } : r))
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <LogSessionModal
            mentorships={mentorships}
            onClose={() => setShowModal(false)}
            mentorId={mentorId}
            onSessionLogged={(session, menteeName, menteeAvatar) => {
              setSessions((prev) => [{ ...session, menteeName, menteeAvatar }, ...prev]);
              setShowModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PastSessionCard({ session: s, editing, editNotes, setEditNotes, onSaveNotes, savingNotes, onDelete, deleting, onRecordingUploaded }) {
  return (
    <GlassCard padding="p-4" className={editing ? 'border-emerald-500/30' : ''}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{s.topic}</h3>
            {s.attendance_data?.length > 0 ? (() => {
              const present = s.attendance_data.filter((r) => r.attended).length;
              const total = s.attendance_data.length;
              const tone = present === total ? 'emerald' : present === 0 ? 'rose' : 'amber';
              const icon = present === total ? CheckCircle2 : present === 0 ? XCircle : AlertCircle;
              return <Pill tone={tone} icon={icon}>{present}/{total} present</Pill>;
            })() : (
              <Pill tone={s.attended ? 'emerald' : 'rose'} icon={s.attended ? CheckCircle2 : XCircle}>
                {s.attended ? 'Attended' : 'Missed'}
              </Pill>
            )}
            {s.meet_link && (
              <a
                href={s.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                <Video className="h-3 w-3" /> Meet recording
                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </a>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              {s.menteeAvatars?.length > 1 ? (
                <div className="flex -space-x-1">
                  {s.menteeAvatars.slice(0, 3).map((av, i) => (
                    <Avatar key={i} name={s.menteeName} src={av} size="sm" />
                  ))}
                  {s.menteeAvatars.length > 3 && (
                    <div className="h-5 w-5 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-[8px] font-bold text-gray-300">
                      +{s.menteeAvatars.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <Avatar name={s.menteeName} src={s.menteeAvatar} size="sm" />
              )}
              <span className="text-gray-300 truncate max-w-[180px]" title={s.menteeName}>{s.menteeName}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-500" />
              {formatDate(s.session_date)}
            </span>
            {s.duration > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                {s.duration} min
              </span>
            )}
          </div>
          {!editing && s.attendance_data?.length > 0 && (
            <AttendanceSummary data={s.attendance_data} />
          )}
          {!editing && s.notes && descriptionPreview(s.notes) && (
            <div className="mt-3 flex gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 text-xs text-gray-400">
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-600" />
              <p className="whitespace-pre-wrap leading-relaxed">{descriptionPreview(s.notes)}</p>
            </div>
          )}
          {!editing && (
            <div className="mt-3">
              <RecordingUpload
                sessionId={s.id}
                initialUrl={s.recording_url}
                onUploaded={(url) => onRecordingUploaded?.(s.id, url)}
              />
            </div>
          )}
          {editing && (
            <div className="mt-3 space-y-2">
              <textarea
                rows={3}
                value={editNotes.notes}
                onChange={(e) => setEditNotes({ ...editNotes, notes: e.target.value })}
                placeholder="What did you cover?"
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-emerald-500/40"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <ActionButton tone="ghost" onClick={() => setEditNotes(null)}>Cancel</ActionButton>
                <ActionButton tone="emerald" icon={savingNotes ? Loader2 : CheckCircle2} onClick={onSaveNotes} disabled={savingNotes}>
                  {savingNotes ? 'Saving…' : 'Save'}
                </ActionButton>
              </div>
            </div>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 gap-1.5 self-end sm:self-start">
            <button
              onClick={() => setEditNotes({ sessionId: s.id, notes: s.notes || '' })}
              className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-gray-400 hover:text-white transition-colors"
              title={s.notes ? 'Edit notes' : 'Add notes'}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="p-2 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-300 transition-colors disabled:opacity-50"
              title="Delete"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ─── Log Session Modal ────────────────────────────────────────────────────────

function LogSessionModal({ mentorships, onClose, mentorId, onSessionLogged }) {
  useScrollLock();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeMentorships = mentorships.filter((m) => m.status === 'active');
  const [selectedMentorshipId, setSelectedMentorshipId] = useState(activeMentorships[0]?.id || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.target);
    fd.set('created_by', mentorId);
    const result = await createMentorshipSessionAction(fd);
    if (result?.error) { setError(result.error); setLoading(false); return; }

    const msId = fd.get('mentorship_id');
    const ms = activeMentorships.find((m) => m.id === msId);
    const mentee = ms?.['users!mentorships_mentee_id_fkey'] || ms?.users;
    const menteeName = mentee?.full_name || 'Unknown';
    const menteeAvatar = mentee?.avatar_url;

    // Build a local session object to optimistically add to state
    const localSession = {
      id: `local-${Date.now()}`,
      mentorship_id: msId,
      topic: fd.get('topic'),
      session_date: new Date(fd.get('session_date')).toISOString(),
      duration: parseInt(fd.get('duration')) || null,
      notes: fd.get('notes') || null,
      attended: fd.get('attended') === 'on',
    };

    toast.success('Session logged');
    onSessionLogged(localSession, menteeName, menteeAvatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Log past session</h2>
              <p className="text-[11px] text-gray-500">Record a mentorship interaction</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-white/[0.05] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="Mentee" required>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select
                name="mentorship_id"
                required
                value={selectedMentorshipId}
                onChange={(e) => setSelectedMentorshipId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500/40"
              >
                <option value="">Select mentee…</option>
                {activeMentorships.map((m) => {
                  const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
                  return <option key={m.id} value={m.id}>{mentee?.full_name || 'Unknown'}</option>;
                })}
              </select>
            </div>
            {activeMentorships.length === 0 && (
              <p className="mt-1 text-[11px] text-amber-400">No active mentorships available.</p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  name="session_date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500/40"
                />
              </div>
            </Field>
            <Field label="Duration (min)">
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="number"
                  name="duration"
                  min="15"
                  step="15"
                  defaultValue="60"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-500/40"
                />
              </div>
            </Field>
          </div>

          <Field label="Topic" required>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                name="topic"
                required
                placeholder="e.g. Recursion drills"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-9 pr-3 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/40"
              />
            </div>
          </Field>

          <Field label="Notes">
            <textarea
              name="notes"
              rows={3}
              placeholder="What you covered, follow-ups…"
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/40"
            />
          </Field>

          <label className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 cursor-pointer hover:bg-white/[0.04]">
            <input
              type="checkbox"
              name="attended"
              defaultChecked
              className="h-4 w-4 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/40"
            />
            <span className="text-sm text-gray-300">Mentee attended</span>
          </label>

          <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
            <ActionButton tone="ghost" onClick={onClose} className="flex-1 justify-center">Cancel</ActionButton>
            <button
              type="submit"
              disabled={loading || activeMentorships.length === 0}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {loading ? 'Logging…' : 'Log session'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}{required && <span className="text-rose-400"> *</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Attendance Summary (inline in PastSessionCard) ──────────────────────────

function AttendanceSummary({ data }) {
  const total = data.length;
  const attended = data.filter((r) => r.attended).length;
  const withPoints = data.filter((r) => r.points > 0);
  const avgPoints = withPoints.length
    ? Math.round((withPoints.reduce((acc, r) => acc + r.points, 0) / withPoints.length) * 10) / 10
    : null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Attendance</span>
      <span className={`text-xs font-semibold ${attended === total ? 'text-emerald-300' : attended === 0 ? 'text-rose-300' : 'text-amber-300'}`}>
        {attended}/{total} present
      </span>
      {avgPoints !== null && (
        <span className="flex items-center gap-1 text-xs text-violet-300 font-semibold">
          avg {avgPoints} pts
        </span>
      )}
      <div className="flex flex-wrap gap-1.5 ml-auto">
        {data.map((r) => (
          <div
            key={r.user_id}
            title={`${r.attended ? 'Present' : 'Absent'}${r.points ? ` · ${r.points} pts` : ''}`}
            className={`h-5 w-5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
              r.attended ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            }`}
          >
            {r.attended ? r.points || '✓' : '✗'}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Attendance Modal ─────────────────────────────────────────────────────────

function AttendanceModal({ session, students, onClose, onSaved }) {
  useScrollLock();
  const [rows, setRows] = useState(() =>
    students.map((s) => ({ user_id: s.id, name: s.name, avatar_url: s.avatar_url, attended: false, points: '' }))
  );
  const [saving, setSaving] = useState(false);

  const setRow = (userId, patch) =>
    setRows((prev) => prev.map((r) => (r.user_id === userId ? { ...r, ...patch } : r)));

  const handleSave = async () => {
    setSaving(true);

    // End the session first
    const endFd = new FormData();
    endFd.set('sessionId', session.id);
    const endResult = await endSessionAction(endFd);
    if (endResult?.error) { toast.error(endResult.error); setSaving(false); return; }

    // Save attendance
    const attendance_data = rows.map((r) => ({
      user_id: r.user_id,
      attended: r.attended,
      points: parseInt(r.points) || 0,
    }));
    const fd = new FormData();
    fd.set('sessionId', session.id);
    fd.set('attendance_data', JSON.stringify(attendance_data));
    const result = await saveSessionAttendanceAction(fd);
    if (result?.error) { toast.error(result.error); setSaving(false); return; }

    toast.success('Session ended & attendance saved');
    onSaved(attendance_data);
  };

  const attendedCount = rows.filter((r) => r.attended).length;

  const absentCount = rows.length - attendedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 w-full sm:max-w-md flex flex-col rounded-t-3xl sm:rounded-2xl border border-white/[0.08] bg-[#0f1117] shadow-2xl overflow-hidden max-h-[90dvh]"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400 mb-1">Attendance</p>
              <h2 className="text-base font-bold text-white leading-tight truncate">{session.topic}</h2>
            </div>
            <button
              onClick={onClose}
              className="mt-0.5 shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stats bar */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Invited', value: students.length, color: 'text-gray-300' },
              { label: 'Present', value: attendedCount, color: 'text-emerald-400' },
              { label: 'Absent', value: absentCount, color: 'text-rose-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-center">
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.04]">
          <span className="text-[11px] text-gray-500">
            {attendedCount === students.length && students.length > 0 ? 'All present' : `${attendedCount} of ${students.length} marked`}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRows((prev) => prev.map((r) => ({ ...r, attended: true })))}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              All present
            </button>
            <span className="text-gray-700">·</span>
            <button
              type="button"
              onClick={() => setRows((prev) => prev.map((r) => ({ ...r, attended: false })))}
              className="text-[11px] font-semibold text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Student list */}
        {students.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No students were targeted for this session.
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
            {rows.map((r) => (
              <div
                key={r.user_id}
                className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all cursor-pointer select-none ${
                  r.attended
                    ? 'border-emerald-500/20 bg-emerald-500/[0.06]'
                    : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                }`}
                onClick={() => setRow(r.user_id, { attended: !r.attended })}
              >
                {/* Toggle */}
                <div className={`shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  r.attended
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-white/20 bg-transparent group-hover:border-white/40'
                }`}>
                  {r.attended && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </div>

                <Avatar name={r.name} src={r.avatar_url} size="sm" />

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate transition-colors ${r.attended ? 'text-white' : 'text-gray-400'}`}>
                    {r.name}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${r.attended ? 'text-emerald-400' : 'text-gray-600'}`}>
                    {r.attended ? 'Present' : 'Absent'}
                  </p>
                </div>

                {/* Points */}
                <div
                  className="shrink-0 flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={r.points}
                    onChange={(e) => setRow(r.user_id, { points: e.target.value })}
                    placeholder="0"
                    className={`w-12 rounded-lg border px-2 py-1 text-center text-xs font-semibold outline-none transition-all ${
                      r.attended
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 focus:border-emerald-500/60'
                        : 'border-white/[0.06] bg-white/[0.02] text-gray-500 focus:border-white/20'
                    }`}
                  />
                  <span className="text-[10px] text-gray-600">pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/[0.06] flex gap-2">
          <ActionButton tone="ghost" onClick={onClose} className="flex-1 justify-center">Cancel</ActionButton>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save attendance'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Recording Upload ─────────────────────────────────────────────────────────

function RecordingUpload({ sessionId, initialUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(initialUrl || null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set('sessionId', sessionId);
    fd.set('recording', file);
    const result = await uploadSessionRecordingAction(fd);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setRecordingUrl(result.recordingUrl);
      onUploaded?.(result.recordingUrl);
      toast.success('Recording uploaded to Drive');
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {recordingUrl ? (
        <a
          href={recordingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition-colors"
        >
          <Film className="h-3.5 w-3.5" />
          View recording
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      ) : null}
      <label className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
        uploading
          ? 'border-white/10 bg-white/[0.02] text-gray-500 cursor-not-allowed'
          : 'border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300'
      }`}>
        {uploading
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
          : <><Upload className="h-3.5 w-3.5" /> {recordingUrl ? 'Replace' : 'Upload recording'}</>}
        <input
          type="file"
          accept="video/*"
          className="sr-only"
          disabled={uploading}
          onChange={handleFile}
        />
      </label>
    </div>
  );
}

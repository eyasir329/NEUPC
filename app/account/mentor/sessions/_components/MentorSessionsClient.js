/**
 * @file Mentor sessions client component
 * @module MentorSessionsClient
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MultiBlockEditor = dynamic(
  () => import('@/app/account/admin/bootcamps/_components/MultiBlockEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/2" />
    ),
  }
);
import { AnimatePresence, motion } from 'framer-motion';
import {
  Video,
  Plus,
  Search,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Check,
  MessageSquare,
  Trash2,
  Loader2,
  User,
  Users,
  GraduationCap,
  AlertCircle,
  BookOpen,
  Tv,
  ExternalLink,
  Upload,
  Film,
  Pencil,
  MapPin,
} from 'lucide-react';
import {
  updateSessionNotesAction,
  deleteSessionAction,
  scheduleSessionAction,
  logPastSessionAction,
  updateScheduledSessionAction,
  cancelSessionAction,
  endSessionAction,
  saveSessionAttendanceAction,
  uploadSessionRecordingAction,
} from '@/app/_lib/actions/mentor-actions';
import { useScrollLock } from '@/app/_hooks/useUiEffects';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  Avatar,
  Pill,
  ActionButton,
  EmptyState,
  TabBar,
  StaggerList,
} from '@/app/account/_components/ui';
import toast from 'react-hot-toast';

function descriptionPreview(desc) {
  if (!desc) return '';
  try {
    const blocks = JSON.parse(desc);
    if (Array.isArray(blocks)) {
      return blocks
        .map((b) => b.content || '')
        .join(' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  } catch {}
  return desc
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function TaskDescriptionRenderer({ content }) {
  if (!content) return null;
  let html = '';
  try {
    const blocks = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(blocks)) {
      html = blocks.map((b) => b.content || '').join('');
    } else {
      html = content;
    }
  } catch {
    html = content;
  }
  if (!html) return null;
  return (
    <div
      className="tiptap-viewer-content text-[13px] whitespace-pre-wrap text-gray-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
const formatDatetime = (d) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function MentorSessionsClient({
  mentorships: rawMentorships = [],
  mentorId,
  bootcamps = [],
  scheduledSessions: initialScheduled = [],
  pastScheduledSessions = [],
}) {
  const mentorships = rawMentorships;
  const [tab, setTab] = useState('rooms');
  const [logMode, setLogMode] = useState(false);
  const [scheduled, setScheduled] = useState(initialScheduled);

  const startLogMode = () => {
    setLogMode(true);
    setTab('rooms');
  };

  const studentMap = useMemo(() => {
    const map = new Map();
    mentorships.forEach((m) => {
      const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
      if (mentee?.id) {
        map.set(mentee.id, {
          name: mentee.full_name || 'Unknown',
          email: mentee.email || '',
          avatar_url: mentee.avatar_url,
        });
      }
    });
    bootcamps.forEach((bc) => {
      (bc.students || []).forEach((s) => {
        if (s.id) {
          map.set(s.id, {
            name: s.name || 'Unknown',
            email: s.email || '',
            avatar_url: s.avatar_url,
          });
        }
      });
    });
    return map;
  }, [mentorships, bootcamps]);

  // Past-sessions: mentorship 1:1 sessions + completed bootcamp-scheduled sessions
  const [sessions, setSessions] = useState(() => {
    const mentorshipPast = mentorships.flatMap((m) => {
      const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
      return (m.mentorship_sessions || [])
        .filter((s) => s.status !== 'scheduled' && s.status !== 'cancelled')
        .map((s) => {
          const ad =
            s.attendance_data && s.attendance_data.length > 0
              ? s.attendance_data
              : mentee?.id
                ? [
                    {
                      user_id: mentee.id,
                      attended: s.attended ?? true,
                      points: s.points || 0,
                    },
                  ]
                : [];
          return {
            ...s,
            menteeName: mentee?.full_name || 'Unknown',
            menteeAvatar: mentee?.avatar_url,
            menteeEmail: mentee?.email || '',
            menteeId: mentee?.id,
            mentorship_id: m.id,
            attendance_data: ad,
          };
        });
    });
    const bootcampPast = pastScheduledSessions.map((s) => {
      let ad = s.attendance_data ?? [];
      if (ad.length === 0) {
        const bc = bootcamps.find((b) => b.id === s.bootcamp_id);
        const allBCStudents = bc?.students ?? [];
        let targetIds = [];
        if (s.target_type === 'one-on-one') {
          targetIds = s.target_student_ids ?? [];
        } else if (s.target_type === 'selected-group') {
          targetIds = s.target_student_ids ?? [];
        } else {
          targetIds = allBCStudents.map((st) => st.id);
        }
        ad = targetIds.map((uid) => ({
          user_id: uid,
          attended: s.attended ?? true,
          points: 0,
        }));
      }
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
        bootcampTitle: (() => {
          const bc = bootcamps.find((b) => b.id === s.bootcamp_id);
          const title = s.bootcampTitle || bc?.title || '';
          if (bc && bc.status !== 'published') {
            return `${title} (Archived)`;
          }
          return title;
        })(),
        menteeName:
          s.targetType === 'one-on-one'
            ? s.targetStudentName || 'Unknown'
            : s.targetType === 'selected-group'
              ? s.targetStudentNames?.join(', ') || 'Group'
              : s.bootcampTitle
                ? `${s.bootcampTitle} — All`
                : 'All enrolled',
        menteeAvatars:
          s.targetType === 'one-on-one'
            ? s.targetStudentAvatar
              ? [s.targetStudentAvatar]
              : []
            : (s.targetStudentAvatars ?? []),
        menteeAvatar: s.targetStudentAvatar ?? null,
        mentorship_id: null,
        attendance_data: ad,
        recording_url: s.recording_url || null,
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
      bootcampTitle: (() => {
        const bc = bootcamps.find((b) => b.id === s.bootcamp_id);
        const title = s.bootcampTitle || bc?.title || '';
        if (bc && bc.status !== 'published') {
          return `${title} (Archived)`;
        }
        return title;
      })(),
      menteeName:
        s.targetType === 'one-on-one'
          ? s.targetStudentName || 'Unknown'
          : s.targetType === 'selected-group'
            ? s.targetStudentNames?.join(', ') || 'Group'
            : s.bootcampTitle
              ? `${s.bootcampTitle} — All`
              : 'All enrolled',
      menteeAvatars:
        s.targetType === 'one-on-one'
          ? s.targetStudentAvatar
            ? [s.targetStudentAvatar]
            : []
          : (s.targetStudentAvatars ?? []),
      menteeAvatar: s.targetStudentAvatar ?? null,
      mentorship_id: null,
      attendance_data: ad,
      recording_url: s.recording_url || null,
    };
  };

  // Auto-expire: move sessions past their end time into past sessions list
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setScheduled((prev) => {
        const expired = prev.filter((s) => {
          const endMs =
            new Date(s.scheduled_at).getTime() + (s.duration || 60) * 60_000;
          return endMs <= now;
        });
        if (expired.length === 0) return prev;
        setSessions((prevSessions) => [
          ...expired.map((s) => scheduledToPast(s, [])),
          ...prevSessions,
        ]);
        return prev.filter((s) => {
          const endMs =
            new Date(s.scheduled_at).getTime() + (s.duration || 60) * 60_000;
          return endMs > now;
        });
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleEndSession = (session, attendanceData) => {
    setScheduled((prev) => prev.filter((s) => s.id !== session.id));
    setSessions((prev) => [
      scheduledToPast(session, attendanceData ?? []),
      ...prev,
    ]);
  };

  const allSessions = sessions;

  const now = new Date();
  const pastStats = {
    total: allSessions.length,
    attended: allSessions.filter((s) =>
      s.attendance_data?.length > 0
        ? s.attendance_data.some((r) => r.attended)
        : s.attended
    ).length,
    thisMonth: allSessions.filter((s) => {
      const d = new Date(s.session_date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length,
    totalHours:
      Math.round(
        (allSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60) * 10
      ) / 10,
  };

  return (
    <PageShell>
      <PageHeader
        icon={Video}
        title="Sessions"
        subtitle="Schedule mentorship sessions, take notes, and track attendance."
        accent="emerald"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Tv}
          label="Scheduled"
          value={scheduled.length}
          accent="violet"
          delay={0}
          sublabel="Upcoming sessions"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={pastStats.total}
          accent="blue"
          delay={0.05}
          sublabel="Past sessions"
        />
        <StatCard
          icon={Users}
          label="Attendance rate"
          value={
            pastStats.total
              ? `${Math.round((pastStats.attended / pastStats.total) * 100)}%`
              : '0%'
          }
          accent="emerald"
          delay={0.1}
          sublabel={
            pastStats.total ? `${pastStats.attended} present` : 'No data yet'
          }
        />
        <StatCard
          icon={Clock}
          label="Hours logged"
          value={`${pastStats.totalHours}h`}
          accent="amber"
          delay={0.15}
          sublabel="Total session time"
        />
      </div>

      <div>
        <TabBar
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: 'rooms',
              label: 'Scheduled sessions',
              icon: Tv,
              count: scheduled.length,
            },
            {
              value: 'past',
              label: 'History',
              icon: Clock,
              count: allSessions.length,
            },
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
            logMode={logMode}
            setLogMode={setLogMode}
            setSessions={setSessions}
          />
        ) : (
          <PastSessionsView
            mentorships={mentorships}
            mentorId={mentorId}
            sessions={allSessions}
            setSessions={setSessions}
            studentMap={studentMap}
            bootcamps={bootcamps}
            onStartLog={startLogMode}
          />
        )}
      </div>
    </PageShell>
  );
}

// ─── Scheduled Rooms (Scheduler + List) ───────────────────────────────────────

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

function RecordingUpload({
  sessionId,
  initialUrl,
  onUploaded,
  readOnly = false,
}) {
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
      toast.success('Recording archived to Drive successfully!');
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {recordingUrl ? (
        <a
          href={recordingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-violet-650 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-violet-500/15 transition-all hover:scale-102 hover:bg-violet-600"
        >
          <Film className="h-3.5 w-3.5" />
          View Recording
          <ExternalLink className="h-3 w-3 opacity-70" />
        </a>
      ) : readOnly ? (
        <span className="text-gray-555 text-[10px] italic">
          No recording uploaded
        </span>
      ) : null}
      {!readOnly && (
        <label
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors ${
            uploading
              ? 'cursor-not-allowed border-white/10 bg-white/2 text-gray-500'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              {recordingUrl ? 'Replace video' : 'Upload MP4'}
            </>
          )}
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={uploading}
            onChange={handleFile}
          />
        </label>
      )}
    </div>
  );
}

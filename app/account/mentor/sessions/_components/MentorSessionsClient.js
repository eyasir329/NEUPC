/**
 * @file Mentor sessions client — top-level layout and view switching.
 * Views and helpers live in sibling modules.
 * @module MentorSessionsClient
 */

'use client';

import { PageHeader, PageShell, StatCard, TabBar } from '@/app/account/_components/ui';
import { CheckCircle2, Clock, Tv, Users, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PastSessionsView } from './PastSessionsView';
import { ScheduledRoomsView } from './ScheduledRoomsView';

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


/**
 * @file Sessions tab: session cards with countdowns.
 * @module SessionsTab
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronRight, Clock, HourglassIcon, Loader2, MapPin, Percent, PlayCircle, Search, Trophy, Video, X } from 'lucide-react';
import { getMemberBootcampSessions } from '@/app/_lib/actions/bootcamp-actions';
import { PointsStatsPanel } from './PointsStatsPanel';
import { EmptyState, TaskDescriptionRenderer, cn, fmtDhaka } from './bootcamps-shared';

const TARGET_LABEL = {
  'one-on-one': '1:1',
  'selected-group': 'Group',
  'all-bootcamp': 'Broadcast',
};

function useCountdown(targetDate, enabled) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!enabled || !targetDate) return;
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, done: true });
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        done: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate, enabled]);

  return timeLeft;
}

function CountdownBlock({ timeLeft, compact = false }) {
  if (!timeLeft) return null;
  if (timeLeft.done)
    return (
      <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
        Starting now!
      </span>
    );

  const imminent = timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m < 5;
  const units =
    timeLeft.d > 0
      ? [
          { v: timeLeft.d, l: 'd' },
          { v: timeLeft.h, l: 'h' },
          { v: timeLeft.m, l: 'm' },
        ]
      : [
          { v: timeLeft.h, l: 'h' },
          { v: timeLeft.m, l: 'm' },
          { v: timeLeft.s, l: 's' },
        ];

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ring-1 transition-all',
          imminent
            ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
            : 'bg-violet-500/10 text-violet-300 ring-violet-500/20'
        )}
      >
        <HourglassIcon className="h-3 w-3 shrink-0" />
        {units.map(({ v, l }) => `${String(v).padStart(2, '0')}${l}`).join(' ')}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4.5 backdrop-blur-md',
        imminent
          ? 'border-amber-500/25 bg-amber-500/[0.03] shadow-[0_4px_20px_rgba(245,158,11,0.02)]'
          : 'border-violet-500/20 bg-violet-500/[0.02] shadow-[0_4px_20px_rgba(139,92,246,0.02)]'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 animate-ping rounded-full',
            imminent ? 'bg-amber-400' : 'bg-violet-400'
          )}
        />
        <p
          className={cn(
            'text-[9px] font-bold tracking-wider uppercase',
            imminent ? 'text-amber-400' : 'text-violet-400'
          )}
        >
          {imminent ? '⚡ Imminent cohort start' : '⏳ Scheduled Room Timer'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {units.map(({ v, l }) => (
          <div key={l} className="flex items-center gap-1">
            <div className="rounded-xl border border-white/5 bg-black/30 px-3 py-2.5 shadow-inner">
              <span
                className={cn(
                  'font-mono text-2xl leading-none font-extrabold tracking-tight tabular-nums sm:text-3xl',
                  imminent
                    ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'text-white'
                )}
              >
                {String(v).padStart(2, '0')}
              </span>
            </div>
            <span
              className={cn(
                'pr-1 font-mono text-[10px] font-bold tracking-wider text-gray-500 uppercase',
                imminent ? 'text-amber-500/80' : 'text-violet-400/80'
              )}
            >
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
function SessionCard({ session: s, userId, focusId }) {
  const isFocused = focusId === `session-${s.id}`;
  const cardRef = useRef(null);
  const [open, setOpen] = useState(isFocused);
  const dt = new Date(s.scheduled_at || s.session_date);
  const isUpcoming = s.status === 'scheduled' && dt >= new Date();
  const dateStr = fmtDhaka(s.scheduled_at || s.session_date, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = fmtDhaka(s.scheduled_at || s.session_date, { hour: '2-digit', minute: '2-digit' });
  const mentorName = s.mentor?.full_name || '—';
  const timeLeft = useCountdown(s.scheduled_at || s.session_date, isUpcoming);

  // Find this user's attendance record for completed sessions
  const myAttendance = useMemo(() => {
    if (!userId || !Array.isArray(s.attendance_data)) return null;
    return s.attendance_data.find((a) => a.user_id === userId) || null;
  }, [userId, s.attendance_data]);
  const myPoints = myAttendance?.points ?? null;
  const attended = myAttendance?.attended ?? s.attended;

  // Scroll a deep-linked session into view once it mounts (after async load).
  useEffect(() => {
    if (!isFocused || !cardRef.current) return;
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(t);
  }, [isFocused]);

  const targetBadgeStyle = {
    'one-on-one':
      'text-cyan-405 bg-cyan-500/10 ring-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.05)]',
    'selected-group':
      'text-amber-405 bg-amber-500/10 ring-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]',
    'all-bootcamp':
      'text-violet-405 bg-violet-500/10 ring-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.05)]',
  };

  return (
    <div
      ref={cardRef}
      id={`session-${s.id}`}
      className={cn(
        'relative scroll-mt-24 overflow-hidden rounded-2xl border bg-zinc-900/40 text-left backdrop-blur-xl transition-all duration-300',
        open
          ? 'border-violet-500/30 bg-zinc-900/60 shadow-[0_0_24px_rgba(139,92,246,0.06)]'
          : isUpcoming
            ? 'border-violet-500/20 bg-violet-500/[0.01] hover:border-violet-500/40 hover:shadow-[0_4px_24px_rgba(139,92,246,0.04)]'
            : 'border-white/5 hover:border-white/20 hover:bg-zinc-900/60',
        isFocused && 'ring-2 ring-violet-500/60 ring-offset-2 ring-offset-zinc-950'
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-4 px-5 py-4.5 text-left select-none"
      >
        <div
          className={cn(
            'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
            isUpcoming
              ? 'border-violet-500/20 bg-violet-500/10 text-violet-400'
              : attended === true
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : attended === false
                  ? 'text-rose-455 border-rose-500/20 bg-rose-500/10'
                  : 'border-white/5 bg-white/2 text-gray-500'
          )}
        >
          {isUpcoming && (
            <span className="bg-violet-455 absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-ping rounded-full" />
          )}
          <Video className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-white/95 transition-colors group-hover:text-white">
            {s.topic || 'Mentorship Session'}
          </p>
          <p className="text-gray-450 mt-1 flex flex-wrap items-center gap-1.5 text-[11px] leading-none font-medium">
            {s.bootcampTitle && (
              <span className="font-mono text-[9px] font-extrabold tracking-wide text-violet-400 uppercase">
                {s.bootcampTitle?.split(':')[0]}
              </span>
            )}
            {s.bootcampTitle && (
              <span className="font-mono text-gray-700">·</span>
            )}
            <span className="font-mono font-bold text-gray-400">{dateStr}</span>
            {isUpcoming && <span className="font-mono text-gray-700">·</span>}
            {isUpcoming && (
              <span className="font-mono font-black text-violet-300">
                {timeStr}
              </span>
            )}
            <span className="font-mono text-gray-700">·</span>
            <span className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-gray-300">
              {s.duration ?? '—'} mins
            </span>
            <span className="font-mono text-gray-700">·</span>
            <span className="text-gray-450">
              Hosted by{' '}
              <span className="font-semibold text-white">{mentorName}</span>
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {s.target_type && (
            <span
              className={cn(
                'hidden rounded px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest uppercase ring-1 sm:inline-block',
                targetBadgeStyle[s.target_type] ||
                  'text-gray-450 bg-white/5 ring-white/10'
              )}
            >
              {TARGET_LABEL[s.target_type] ?? s.target_type}
            </span>
          )}
          {isUpcoming ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest text-violet-400 uppercase ring-1 ring-violet-500/20">
                upcoming
              </span>
              {timeLeft && <CountdownBlock timeLeft={timeLeft} compact />}
            </div>
          ) : attended === true ? (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest text-emerald-400 uppercase ring-1 ring-emerald-500/20">
              attended
            </span>
          ) : attended === false ? (
            <span className="text-rose-455 rounded-full bg-rose-500/10 px-2.5 py-0.5 font-mono text-[9px] font-extrabold tracking-widest uppercase ring-1 ring-rose-500/20">
              missed
            </span>
          ) : (
            <span className="text-gray-450 rounded-full bg-gray-500/10 px-2.5 py-0.5 font-mono text-[9px] font-bold font-extrabold tracking-widest uppercase ring-1 ring-gray-500/20">
              done
            </span>
          )}
          <ChevronDown
            className={cn(
              'text-gray-555 h-4 w-4 transition-transform duration-300 group-hover:text-white',
              open
                ? 'rotate-180 text-violet-400 group-hover:text-violet-400'
                : ''
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 border-t border-white/5 bg-white/[0.01] px-6 pt-5 pb-6"
          >
            {/* Countdown timer for upcoming sessions */}
            {isUpcoming && timeLeft && <CountdownBlock timeLeft={timeLeft} />}

            {/* Points obtained for completed sessions */}
            {!isUpcoming && myAttendance && (
              <div className="flex items-center gap-3.5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.01] px-4.5 py-3.5 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 shadow-[0_2px_8px_rgba(245,158,11,0.05)] ring-1 ring-amber-500/20">
                  <Trophy className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[9.5px] font-extrabold tracking-widest text-amber-500/80 uppercase">
                    Attendance Session Points
                  </p>
                  <p className="text-amber-350 mt-1 font-mono text-lg leading-none font-black">
                    {myPoints != null ? myPoints : '—'}
                    <span className="ml-1 text-[11px] font-bold text-amber-500/60">
                      pts earned
                    </span>
                  </p>
                </div>
                <div className="shrink-0 rounded-xl border border-white/5 bg-white/2 px-3 py-1.5 text-right font-mono">
                  <p className="text-gray-550 text-[9px] font-extrabold tracking-widest uppercase">
                    Attendance Status
                  </p>
                  {attended ? (
                    <span className="text-emerald-450 mt-0.5 inline-flex items-center gap-1 text-[12px] font-black">
                      <CheckCircle className="h-3.5 w-3.5" /> Attended
                    </span>
                  ) : (
                    <span className="text-rose-455 mt-0.5 inline-flex items-center gap-1 text-[12px] font-black">
                      <X className="h-3.5 w-3.5" /> Absent
                    </span>
                  )}
                </div>
              </div>
            )}

            {s.description && (
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-extrabold tracking-widest text-violet-400 uppercase">
                  Description
                </p>
                <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4.5 text-[13px] leading-relaxed text-gray-300 shadow-inner">
                  <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-linear-to-b from-violet-500 to-indigo-500 opacity-60" />
                  <TaskDescriptionRenderer content={s.description} />
                </div>
              </div>
            )}

            {s.notes && (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20 text-left shadow-xl">
                <div className="flex items-center gap-1.5 border-b border-white/5 bg-white/2 px-4 py-2.5">
                  <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                  <span className="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
                    Mentor Notes &amp; Guidelines
                  </span>
                </div>
                <div className="p-4.5">
                  <p className="text-gray-350 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                    {s.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              {s.location ? (
                <span
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-5 py-2.5 text-[12px] font-bold text-amber-300 shadow-sm"
                  title={s.location}
                >
                  <MapPin className="h-4 w-4 text-amber-400" />
                  In-person · {s.location}
                </span>
              ) : (
                s.meet_link && (
                  <a
                    href={s.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-5.5 py-2.5 text-[12px] font-bold text-white shadow-md shadow-emerald-600/10 transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-600/25 active:scale-[0.98]"
                  >
                    <Video className="h-4 w-4 transition-transform group-hover:scale-105" />
                    {isUpcoming
                      ? 'Join Live Google Meet Room'
                      : 'Open Google Meet Room'}
                    <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                  </a>
                )
              )}
              {s.recording_url && (
                <a
                  href={s.recording_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-5.5 py-2.5 text-[12px] font-bold text-violet-300 shadow-sm shadow-violet-500/5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-500/10 active:scale-[0.98]"
                >
                  <PlayCircle className="h-4 w-4 text-violet-400 transition-transform group-hover:scale-105" />
                  Watch Saved Session Recording
                  <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SessionsTab({ enrolledBootcamps, user, focusId }) {
  const [allSessions, setAllSessions] = useState(null);
  const [filter, setFilter] = useState('all');
  const [bootcampFilter, setBootcampFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!enrolledBootcamps.length) {
      setAllSessions([]);
      return;
    }
    Promise.all(
      enrolledBootcamps.map(({ bootcamp }) =>
        getMemberBootcampSessions(bootcamp.id)
          .then((sessions) =>
            sessions.map((s) => ({
              ...s,
              bootcampId: bootcamp.id,
              bootcampTitle: bootcamp.title.split(':')[0],
            }))
          )
          .catch(() => [])
      )
    ).then((results) => {
      const merged = results.flat();
      const seen = new Set();
      const deduped = merged.filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
      deduped.sort(
        (a, b) => new Date(b.session_date) - new Date(a.session_date)
      );
      setAllSessions(deduped);
    });
  }, [enrolledBootcamps]);

  const now = new Date();
  const filteredSessionsForStats = useMemo(() => {
    if (!allSessions) return [];
    return bootcampFilter === 'all'
      ? allSessions
      : allSessions.filter((s) => s.bootcampId === bootcampFilter);
  }, [allSessions, bootcampFilter]);

  const upcoming = filteredSessionsForStats.filter(
    (s) =>
      s.status === 'scheduled' &&
      new Date(s.scheduled_at || s.session_date) >= now
  );

  const pastSessions = filteredSessionsForStats.filter(
    (s) =>
      s.status !== 'scheduled' ||
      new Date(s.scheduled_at || s.session_date) < now
  );
  const attendedCount = pastSessions.filter((s) => {
    const myEntry = Array.isArray(s.attendance_data)
      ? s.attendance_data.find((a) => a.user_id === user?.id)
      : null;
    return myEntry ? myEntry.attended : s.attended;
  }).length;
  const pastCount = pastSessions.length;
  const attendanceRate =
    pastCount > 0 ? Math.round((attendedCount / pastCount) * 100) : 100;

  const visible = (allSessions || []).filter((s) => {
    const inFilter =
      filter === 'upcoming'
        ? s.status === 'scheduled' &&
          new Date(s.scheduled_at || s.session_date) >= now
        : filter === 'past'
          ? s.status !== 'scheduled' ||
            new Date(s.scheduled_at || s.session_date) < now
          : true;
    const inBootcamp =
      bootcampFilter === 'all' || s.bootcampId === bootcampFilter;
    const inSearch =
      !search.trim() ||
      s.topic?.toLowerCase().includes(search.toLowerCase()) ||
      s.bootcampTitle?.toLowerCase().includes(search.toLowerCase()) ||
      s.mentor?.full_name?.toLowerCase().includes(search.toLowerCase());
    return inFilter && inBootcamp && inSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-0.5"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-5 md:flex-row md:items-center">
        <div className="text-left">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Mentorship Hub
          </h1>
          <p className="text-gray-450 mt-1 text-[12.5px]">
            Join live broadcasts and review past interactive sessions
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="text-gray-555 pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics, mentors..."
            className="placeholder:text-gray-650 h-10 w-full rounded-xl border border-white/10 bg-zinc-950/40 pr-10 pl-10 font-mono text-[13px] text-white transition-all focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-500 transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {allSessions === null ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <Loader2 className="mb-3 h-7 w-7 animate-spin text-violet-500" />
          <span className="text-sm font-semibold">
            Loading mentorship schedules…
          </span>
        </div>
      ) : allSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-14 text-center">
          <EmptyState
            icon={Video}
            title="No sessions scheduled"
            description="Your mentors have not created any virtual classrooms yet."
          />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              {
                label: 'Total Classrooms',
                value: filteredSessionsForStats.length,
                color: 'text-white',
                icon: Video,
                iconColor:
                  'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]',
                bg: 'bg-zinc-950/25 border-white/5',
                glow: 'hover:shadow-[0_4px_24px_rgba(99,102,241,0.04)] hover:border-indigo-500/25',
              },
              {
                label: 'Upcoming Scheduled',
                value: upcoming.length,
                color: 'text-violet-300',
                icon: Clock,
                iconColor:
                  'text-violet-400 bg-violet-500/10 border-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.1)]',
                bg: 'bg-zinc-950/25 border-white/5',
                glow: 'hover:shadow-[0_4px_24px_rgba(139,92,246,0.04)] hover:border-indigo-500/25',
              },
              {
                label: 'Attended Classrooms',
                value: `${attendedCount}/${pastCount}`,
                color: 'text-emerald-455',
                icon: CheckCircle,
                iconColor:
                  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
                bg: 'bg-zinc-950/25 border-white/5',
                glow: 'hover:shadow-[0_4px_24px_rgba(16,185,129,0.04)] hover:border-emerald-500/25',
              },
              {
                label: 'Attendance Rate',
                value: `${attendanceRate}%`,
                color: 'text-amber-350',
                icon: Percent,
                iconColor:
                  'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
                bg: 'bg-zinc-950/25 border-white/5',
                glow: 'hover:shadow-[0_4px_24px_rgba(245,158,11,0.04)] hover:border-amber-500/25',
              },
            ].map(
              ({ label, value, color, icon: Icon, iconColor, bg, glow }) => (
                <div
                  key={label}
                  className={cn(
                    'relative flex items-center justify-between overflow-hidden rounded-2xl border p-5 shadow-md backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5',
                    bg,
                    glow
                  )}
                >
                  <div className="space-y-1 text-left">
                    <div className="text-gray-555 text-[10px] font-extrabold tracking-widest uppercase">
                      {label}
                    </div>
                    <div
                      className={cn(
                        'font-mono text-2xl leading-none font-black tracking-tight sm:text-3xl',
                        color
                      )}
                    >
                      {value}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-355',
                      iconColor
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              )
            )}
          </div>

          {/* Points analytics */}
          {(() => {
            const byBootcamp = {};
            for (const { bootcamp } of enrolledBootcamps) {
              if (bootcampFilter !== 'all' && bootcamp.id !== bootcampFilter)
                continue;
              byBootcamp[bootcamp.id] = {
                name: bootcamp.title.split(':')[0].trim(),
                earned: 0,
                max: 0,
              };
            }
            for (const s of filteredSessionsForStats) {
              if (!s.bootcampId || !byBootcamp[s.bootcampId]) continue;
              const isPast =
                s.status !== 'scheduled' ||
                new Date(s.scheduled_at || s.session_date) < now;
              if (isPast) {
                byBootcamp[s.bootcampId].max += 100;
              }
              const myEntry = Array.isArray(s.attendance_data)
                ? s.attendance_data.find((a) => a.user_id === user?.id)
                : null;
              if (myEntry?.points)
                byBootcamp[s.bootcampId].earned += myEntry.points;
            }
            const chartData = Object.values(byBootcamp).filter(
              (d) => d.max > 0 || d.earned > 0
            );
            const totalEarned = chartData.reduce((s, d) => s + d.earned, 0);
            const totalMax = chartData.reduce((s, d) => s + d.max, 0);
            return (
              <PointsStatsPanel
                chartData={chartData}
                totalEarned={totalEarned}
                totalMax={totalMax}
                label="Session Points"
              />
            );
          })()}

          {/* Glassy Filter Panel */}
          <div className="space-y-4.5 rounded-2xl border border-white/5 bg-zinc-950/25 p-4.5 backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="text-left">
                <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                  Scheduled Classrooms
                </h3>
                <p className="text-gray-550 mt-0.5 text-[11.5px]">
                  Explore virtual workshops and guest presentations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-555 text-[11px] font-extrabold tracking-widest uppercase">
                  Schedules
                </span>
                <div className="flex w-fit gap-1.5 rounded-xl border border-white/5 bg-white/2 p-1">
                  {[
                    { v: 'all', l: 'All', c: filteredSessionsForStats.length },
                    { v: 'upcoming', l: 'Upcoming', c: upcoming.length },
                    { v: 'past', l: 'Past', c: pastSessions.length },
                  ].map((pill) => (
                    <button
                      key={pill.v}
                      onClick={() => setFilter(pill.v)}
                      className={cn(
                        'relative z-10 flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all duration-300',
                        filter === pill.v
                          ? 'from-violet-650 to-indigo-650 shadow-violet-650/20 bg-linear-to-r text-white shadow-md'
                          : 'border border-transparent bg-transparent text-gray-400 hover:text-white'
                      )}
                    >
                      {pill.l}
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 font-mono text-[9px] font-black',
                          filter === pill.v
                            ? 'bg-white/20 text-white'
                            : 'text-gray-555 bg-white/5'
                        )}
                      >
                        {pill.c}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bootcamp filters */}
            {enrolledBootcamps.length > 1 && (
              <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
                <button
                  onClick={() => setBootcampFilter('all')}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300',
                    bootcampFilter === 'all'
                      ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/5'
                      : 'border-white/10 bg-white/2 text-gray-400 hover:border-white/20 hover:text-white'
                  )}
                >
                  All Bootcamps
                </button>
                {enrolledBootcamps.map(({ bootcamp }) => (
                  <button
                    key={bootcamp.id}
                    onClick={() => setBootcampFilter(bootcamp.id)}
                    className={cn(
                      'max-w-[220px] truncate rounded-full border px-4 py-1.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300',
                      bootcampFilter === bootcamp.id
                        ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/5'
                        : 'border-white/10 bg-white/2 text-gray-400 hover:border-white/20 hover:text-white'
                    )}
                  >
                    {bootcamp.title.split(':')[0].trim()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-14 text-center">
              <EmptyState
                icon={Search}
                title="No classrooms matched"
                description="Try selecting a different timeframe or adjusting filters."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  userId={user?.id}
                  focusId={focusId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────


export { SessionsTab };

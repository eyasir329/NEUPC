/**
 * @file Member bootcamp sessions list.
 * @module MemberSessionsPanel
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, CircleDot, MapPin, Video } from 'lucide-react';
import { getMemberBootcampSessions } from '@/app/_lib/actions/bootcamp-actions';
import { PanelEmpty, PanelLoader, TaskDescriptionRenderer } from './learning-shared';

const TARGET_LABEL = {
  'one-on-one': '1:1',
  'selected-group': 'Group',
  'all-bootcamp': 'Broadcast',
};

function MemberSessionRow({ s, isArchived = false }) {
  const [open, setOpen] = useState(false);
  const mentorName = s.mentor?.full_name || '—';
  const dt = new Date(s.scheduled_at || s.session_date);
  const isUpcoming = s.status === 'scheduled' && dt >= new Date();
  const dateStr = dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border shadow-lg shadow-black/20 backdrop-blur-xl transition-all ${isUpcoming ? 'border-violet-500/30 bg-violet-500/[0.05]' : 'border-white/10 bg-zinc-900/50 hover:border-white/20'}`}
    >
      {isUpcoming && (
        <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-500/10 blur-[60px]" />
      )}
      {/* Row header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative z-10 flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${isUpcoming ? 'bg-violet-500/15 ring-violet-500/30' : 'bg-white/5 ring-white/10'}`}
        >
          <Video
            className={`h-3.5 w-3.5 ${isUpcoming ? 'text-violet-400' : 'text-emerald-400'}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">
            {s.topic || 'Session'}
          </p>
          <p className="text-[11px] text-gray-500">
            {dateStr}
            {isUpcoming ? ` · ${timeStr}` : ''} · {s.duration ?? '—'}min ·{' '}
            {mentorName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {s.target_type && (
            <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-gray-400 ring-1 ring-white/10 sm:inline-block">
              {TARGET_LABEL[s.target_type] ?? s.target_type}
            </span>
          )}
          {isUpcoming ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300 ring-1 ring-violet-500/20">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
              upcoming
            </span>
          ) : s.attended === true ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
              attended
            </span>
          ) : s.attended === false ? (
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 ring-1 ring-rose-500/20">
              missed
            </span>
          ) : (
            <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-semibold text-gray-400 ring-1 ring-gray-500/20">
              done
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="relative z-10 space-y-3 border-t border-white/5 bg-black/20 px-4 pt-3 pb-4">
          {s.description && <TaskDescriptionRenderer content={s.description} />}
          {s.notes && (
            <div className="rounded-lg border border-white/10 bg-white/2 px-3 py-2">
              <p className="mb-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                Mentor notes
              </p>
              <p className="text-[12px] whitespace-pre-wrap text-gray-300">
                {s.notes}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {s.location ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-300"
                title={s.location}
              >
                <MapPin className="h-3 w-3" />
                {s.location}
              </span>
            ) : (
              s.meet_link &&
              (isArchived ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-gray-500 ring-1 ring-white/10">
                  <Video className="h-3.5 w-3.5 text-gray-600" />
                  Session Concluded
                </span>
              ) : (
                <a
                  href={s.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500"
                >
                  <Video className="h-3 w-3" />
                  {isUpcoming ? 'Join Meet' : 'Open Meet'}
                  <ChevronRight className="h-3 w-3 opacity-70" />
                </a>
              ))
            )}
            {s.recording_url && (
              <a
                href={s.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
              >
                <CircleDot className="h-3 w-3" />
                Watch recording
                <ChevronRight className="h-3 w-3 opacity-70" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberSessionsPanel({ bootcampId, isArchived = false }) {
  const [sessions, setSessions] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'past'

  useEffect(() => {
    if (!bootcampId) return;
    getMemberBootcampSessions(bootcampId)
      .then(setSessions)
      .catch(() => setSessions([]));
  }, [bootcampId]);

  if (sessions === null) return <PanelLoader />;
  if (sessions.length === 0)
    return <PanelEmpty message="No sessions scheduled yet." />;

  const now = new Date();
  const upcoming = sessions.filter(
    (s) =>
      s.status === 'scheduled' &&
      new Date(s.scheduled_at || s.session_date) >= now
  );
  const past = sessions.filter(
    (s) =>
      s.status !== 'scheduled' ||
      new Date(s.scheduled_at || s.session_date) < now
  );

  const visible =
    filter === 'upcoming' ? upcoming : filter === 'past' ? past : sessions;

  return (
    <div className="space-y-4">
      {isArchived && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[12.5px] leading-normal font-medium text-amber-300 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            This bootcamp is archived. Join links for scheduled live sessions
            are concluded.
          </span>
        </div>
      )}
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', value: sessions.length, color: 'text-white' },
          {
            label: 'Upcoming',
            value: upcoming.length,
            color: 'text-violet-400',
          },
          {
            label: 'Attended',
            value: sessions.filter((s) => s.attended).length,
            color: 'text-emerald-400',
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-2.5 text-center shadow-lg shadow-black/20 backdrop-blur-xl"
          >
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[
          ['all', 'All'],
          ['upcoming', 'Upcoming'],
          ['past', 'Past'],
        ].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${filter === v ? 'bg-violet-500/15 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/30' : 'bg-white/5 text-gray-400 ring-1 ring-white/10 hover:text-white hover:ring-white/20'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Session list */}
      {visible.length === 0 ? (
        <PanelEmpty message={`No ${filter} sessions.`} />
      ) : (
        <div className="space-y-2">
          {visible.map((s) => (
            <MemberSessionRow key={s.id} s={s} isArchived={isArchived} />
          ))}
        </div>
      )}
    </div>
  );
}


export { MemberSessionsPanel };

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Clock, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { PageShell, PageHeader, EmptyState } from '@/app/account/_components/ui';

const STATUS_TONE = {
  published: { dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'border-emerald-500/20 bg-emerald-500/10', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.6)]', pulse: true },
  draft:     { dot: 'bg-amber-400',   text: 'text-amber-300',   ring: 'border-amber-500/20 bg-amber-500/10',   glow: '', pulse: false },
  archived:  { dot: 'bg-zinc-500',    text: 'text-zinc-400',    ring: 'border-white/10 bg-white/5',            glow: '', pulse: false },
};

function BootcampCard({ bootcamp, index }) {
  const tone = STATUS_TONE[bootcamp.status] ?? STATUS_TONE.archived;
  const hours = bootcamp.total_duration ? Math.round(bootcamp.total_duration / 60) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Link href={`/account/mentor/bootcamps/${bootcamp.id}`} className="block">
        <div className="group relative flex gap-4 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-4 shadow-lg shadow-black/40 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-zinc-900/70">
          <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-500/[0.07] blur-[60px] transition-opacity group-hover:bg-violet-500/12" />

          {bootcamp.thumbnail ? (
            <img
              src={bootcamp.thumbnail}
              alt={bootcamp.title}
              className="relative z-10 h-16 w-24 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="relative z-10 flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
              <GraduationCap className="h-7 w-7 text-violet-400" />
            </div>
          )}

          <div className="relative z-10 min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-violet-200">
                {bootcamp.title}
              </h3>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-violet-300" />
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${tone.ring} ${tone.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot} ${tone.glow} ${tone.pulse ? 'animate-pulse' : ''}`} />
                {bootcamp.status}
              </span>
              {bootcamp.batch_info && (
                <span className="text-[11px] text-zinc-500">{bootcamp.batch_info}</span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-500">
              {bootcamp.total_lessons > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-indigo-400/80" />
                  {bootcamp.total_lessons} lessons
                </span>
              )}
              {hours > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-400/80" />
                  {hours}h
                </span>
              )}
              {bootcamp.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-emerald-400/80" />
                  {new Date(bootcamp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function MentorBootcampsListClient({ bootcamps }) {
  const [activeTab, setActiveTab] = useState('active');

  const activeBootcamps = bootcamps.filter(bc => bc.status === 'published');
  const archivedBootcamps = bootcamps.filter(bc => bc.status !== 'published');

  const visibleBootcamps = activeTab === 'active' ? activeBootcamps : archivedBootcamps;

  return (
    <PageShell>
      <PageHeader
        icon={GraduationCap}
        title="My Bootcamps"
        subtitle={bootcamps.length > 0 ? `${activeBootcamps.length} active, ${archivedBootcamps.length} archived/inactive` : undefined}
        accent="violet"
      />

      {bootcamps.length > 0 && (
        <div className="mb-6 flex gap-2 border-b border-white/5 pb-px">
          <button
            onClick={() => setActiveTab('active')}
            className={`relative pb-3 text-sm font-semibold transition-all px-2 flex items-center ${
              activeTab === 'active' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Active Cohorts
            <span className="ml-1.5 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
              {activeBootcamps.length}
            </span>
            {activeTab === 'active' && (
              <motion.div
                layoutId="list-active-tab-bar"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`relative pb-3 text-sm font-semibold transition-all px-2 flex items-center ${
              activeTab === 'archived' ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Archived & Inactive
            <span className="ml-1.5 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
              {archivedBootcamps.length}
            </span>
            {activeTab === 'archived' && (
              <motion.div
                layoutId="list-active-tab-bar"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </div>
      )}

      {bootcamps.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No bootcamps assigned"
          description="You haven't been assigned to any bootcamps yet. Contact an admin to get assigned."
          accent="violet"
        />
      ) : visibleBootcamps.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={activeTab === 'active' ? "No active bootcamps" : "No archived bootcamps"}
          description={activeTab === 'active' ? "You don't have any active bootcamps right now." : "You don't have any archived or inactive bootcamps."}
          accent="violet"
        />
      ) : (
        <div className="space-y-3">
          {visibleBootcamps.map((bc, i) => (
            <BootcampCard key={bc.id} bootcamp={bc} index={i} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

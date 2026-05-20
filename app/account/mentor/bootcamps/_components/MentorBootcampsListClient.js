'use client';

import Link from 'next/link';
import { GraduationCap, Clock, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Pill, EmptyState } from '@/app/account/mentor/_components/_ui';

const STATUS_TONE = { published: 'emerald', draft: 'amber', archived: 'gray' };

function BootcampCard({ bootcamp }) {
  const tone = STATUS_TONE[bootcamp.status] ?? 'gray';
  const hours = bootcamp.total_duration ? Math.round(bootcamp.total_duration / 60) : null;

  return (
    <Link href={`/account/mentor/bootcamps/${bootcamp.id}`}>
      <GlassCard hover className="flex gap-4 p-4">
        {bootcamp.thumbnail ? (
          <img
            src={bootcamp.thumbnail}
            alt={bootcamp.title}
            className="h-16 w-24 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-16 w-24 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-7 w-7 text-violet-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-white truncate">{bootcamp.title}</h3>
            <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Pill tone={tone}>
              <span className={`h-1.5 w-1.5 rounded-full bg-current mr-1 ${bootcamp.status === 'published' ? 'animate-pulse' : ''}`} />
              {bootcamp.status}
            </Pill>
            {bootcamp.batch_info && (
              <span className="text-[11px] text-gray-500">{bootcamp.batch_info}</span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
            {bootcamp.total_lessons > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {bootcamp.total_lessons} lessons
              </span>
            )}
            {hours > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {hours}h
              </span>
            )}
            {bootcamp.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(bootcamp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export default function MentorBootcampsListClient({ bootcamps }) {
  return (
    <PageShell>
      <PageHeader
        icon={GraduationCap}
        title="My Bootcamps"
        accent="violet"
      />

      {bootcamps.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No bootcamps assigned"
          description="You haven't been assigned to any bootcamps yet. Contact an admin to get assigned."
        />
      ) : (
        <div className="space-y-3">
          {bootcamps.map((bc) => (
            <BootcampCard key={bc.id} bootcamp={bc} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

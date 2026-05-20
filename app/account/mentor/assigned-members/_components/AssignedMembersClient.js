'use client';

import { Users, GraduationCap } from 'lucide-react';
import { PageShell, PageHeader, EmptyState } from '@/app/account/mentor/_components/_ui';
import EnrollmentsTab from '@/app/account/admin/bootcamps/[bootcampId]/_components/EnrollmentsTab';

export default function AssignedMembersClient({ bootcamps }) {
  return (
    <PageShell>
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          icon={Users}
          accent="blue"
          title="Assigned Members"
          subtitle="Members enrolled in your assigned bootcamps"
        />

        {bootcamps.length === 0 ? (
          <div className="rounded-2xl border border-white/8 border-dashed py-20 text-center">
            <EmptyState icon={GraduationCap} title="No bootcamps assigned" accent="violet" />
          </div>
        ) : (
          <div className="space-y-8">
            {bootcamps.map((bootcamp) => (
              <div key={bootcamp.id} className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
                <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4 bg-violet-500/5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20 shrink-0">
                    <GraduationCap className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{bootcamp.title}</h3>
                    {bootcamp.batch_info && (
                      <p className="text-[11px] text-gray-500 mt-0.5">{bootcamp.batch_info}</p>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <EnrollmentsTab bootcampId={bootcamp.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

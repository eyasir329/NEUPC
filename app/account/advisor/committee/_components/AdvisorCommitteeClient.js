/**
 * @file Advisor committee client — view current committee members
 *   grouped by category and the full position catalogue. Uses shared
 *   dark-glass primitives.
 *
 * @module AdvisorCommitteeClient
 */

'use client';

import { useMemo, useState } from 'react';
import { Users, Award, Search, Calendar, Layers } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  TabBar,
  Avatar,
  Pill,
  EmptyState,
  StaggerList,
} from '../../../_components/ui/dashboard';

const TABS = [
  { value: 'current', label: 'Current Committee', icon: Users },
  { value: 'positions', label: 'All Positions', icon: Layers },
];

export default function AdvisorCommitteeClient({
  positions = [],
  currentCommittee = [],
}) {
  const [tab, setTab] = useState('current');
  const [query, setQuery] = useState('');

  const byCategory = useMemo(() => {
    const acc = {};
    currentCommittee.forEach((m) => {
      const cat = m.committee_positions?.category || 'Other';
      (acc[cat] ||= []).push(m);
    });
    return acc;
  }, [currentCommittee]);

  const filteredPositions = useMemo(
    () =>
      positions.filter(
        (p) =>
          !query ||
          p.title?.toLowerCase().includes(query.toLowerCase()) ||
          p.category?.toLowerCase().includes(query.toLowerCase())
      ),
    [positions, query]
  );

  const filteredCommittee = useMemo(() => {
    if (!query) return byCategory;
    const acc = {};
    Object.entries(byCategory).forEach(([cat, members]) => {
      const matches = members.filter(
        (m) =>
          m.users?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
          m.committee_positions?.title
            ?.toLowerCase()
            .includes(query.toLowerCase())
      );
      if (matches.length) acc[cat] = matches;
    });
    return acc;
  }, [byCategory, query]);

  return (
    <PageShell>
      <PageHeader
        icon={Users}
        title="Committee"
        subtitle="Executive structure, positions, and terms"
        accent="indigo"
        meta={
          <>
            <Pill tone="indigo">
              {currentCommittee.length} active member
              {currentCommittee.length === 1 ? '' : 's'}
            </Pill>
            <Pill tone="gray">
              {positions.length} position{positions.length === 1 ? '' : 's'}
            </Pill>
          </>
        }
      />

      <GlassCard padding="p-4">
        <TabBar tabs={TABS} value={tab} onChange={setTab} />
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === 'current'
                ? 'Search by name or role…'
                : 'Search positions by title or category…'
            }
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pr-3 pl-10 text-sm text-white placeholder-gray-500 focus:border-indigo-500/40 focus:outline-none"
          />
        </div>
      </GlassCard>

      {tab === 'current' && (
        <div className="space-y-6">
          {Object.keys(filteredCommittee).length === 0 ? (
            <GlassCard>
              <EmptyState
                icon={Users}
                title="No committee members"
                description="Once positions are assigned, members will appear here grouped by category."
              />
            </GlassCard>
          ) : (
            Object.entries(filteredCommittee).map(([category, members]) => (
              <section key={category} className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                  <Award className="h-4 w-4 text-indigo-400" />
                  {category}
                  <span className="text-xs text-gray-500">
                    · {members.length}
                  </span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <StaggerList>
                    {members.map((m) => (
                      <CommitteeCard key={m.id} member={m} />
                    ))}
                  </StaggerList>
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {tab === 'positions' && (
        <div className="space-y-2">
          {filteredPositions.length === 0 ? (
            <GlassCard>
              <EmptyState
                icon={Layers}
                title="No positions defined"
                description="Define committee positions to see them listed here."
              />
            </GlassCard>
          ) : (
            filteredPositions.map((p) => (
              <PositionRow key={p.id} position={p} />
            ))
          )}
        </div>
      )}
    </PageShell>
  );
}

function CommitteeCard({ member }) {
  return (
    <GlassCard
      padding="p-4"
      className="transition-colors hover:border-indigo-500/30"
    >
      <div className="flex items-center gap-3">
        <Avatar name={member.users?.full_name ?? '?'} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {member.users?.full_name || 'Unknown'}
          </p>
          <p className="truncate text-xs text-indigo-300">
            {member.committee_positions?.title}
          </p>
        </div>
      </div>
      {member.term_start && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>
            {new Date(member.term_start).getFullYear()}
            {member.term_end &&
              ` — ${new Date(member.term_end).getFullYear()}`}
          </span>
        </div>
      )}
    </GlassCard>
  );
}

function PositionRow({ position }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {position.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">{position.category}</p>
      </div>
      <span className="text-[11px] text-gray-500">
        #{position.display_order ?? 0}
      </span>
    </div>
  );
}

'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Users,
  Briefcase,
  UserCheck,
  BookUser,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  createCommitteePositionAction,
  updateCommitteePositionAction,
  deleteCommitteePositionAction,
  createCommitteeMemberAction,
  updateCommitteeMemberAction,
  deleteCommitteeMemberAction,
} from '@/app/_lib/committee-actions';
import PositionsTable from './PositionsTable';
import MembersTable from './MembersTable';
import PositionModal from './PositionModal';
import MemberModal from './MemberModal';
import toast from 'react-hot-toast';
import {
  PageShell,
  PageHeader,
  StatCard,
  TabBar,
  EmptyState,
} from '../../_components/_ui';

export default function CommitteeManagementClient({
  initialMembers,
  initialPositions,
  initialUsers,
}) {
  const [positions, setPositions] = useState(initialPositions ?? []);
  const [members, setMembers] = useState(initialMembers ?? []);
  const [activeTab, setActiveTab] = useState('positions');
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState('All');
  const [positionModal, setPositionModal] = useState(null);
  const [memberModal, setMemberModal] = useState(null);
  const [isPending, startTransition] = useTransition();

  // ── derived stats ─────────────────────────────────────────────────────────
  const live = useMemo(() => {
    const currentMembers = members.filter((m) => m.is_current);
    const executivePositions = positions.filter(
      (p) => p.category === 'executive'
    );
    return {
      totalMembers: members.length,
      currentMembers: currentMembers.length,
      totalPositions: positions.length,
      executiveCount: executivePositions.length,
      totalUsers: initialUsers?.length || 0,
    };
  }, [members, positions, initialUsers]);

  // ── filtered data ─────────────────────────────────────────────────────────
  const filteredPositions = useMemo(() => {
    if (!search) return positions;
    const q = search.toLowerCase();
    return positions.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [positions, search]);

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.users?.full_name?.toLowerCase().includes(q) ||
        m.users?.email?.toLowerCase().includes(q) ||
        m.committee_positions?.title?.toLowerCase().includes(q)
    );
  }, [members, search]);

  const pastMembers = useMemo(() => members.filter((m) => !m.is_current), [members]);

  const pastSessions = useMemo(() => {
    const sessions = pastMembers.map((m) => {
      if (!m.term_start) return 'Unknown';
      const year = new Date(m.term_start).getFullYear();
      return isNaN(year) ? 'Unknown' : `${year}-${String(year + 1).slice(-2)}`;
    });
    return [...new Set(sessions)].sort((a, b) => b.localeCompare(a));
  }, [pastMembers]);

  // ── Position actions ──────────────────────────────────────────────────────
  const handleCreatePosition = (formData) => {
    startTransition(async () => {
      try {
        const result = await createCommitteePositionAction(formData);
        if (result?.position) {
          setPositions((prev) => [...prev, result.position]);
          setPositionModal(null);
          toast.success('Position created successfully');
        } else {
          toast.error('Failed to create position');
        }
      } catch {
        toast.error('Error creating position');
      }
    });
  };

  const handleUpdatePosition = (formData) => {
    startTransition(async () => {
      try {
        const id = formData.get('id');
        const result = await updateCommitteePositionAction(formData);
        if (result?.success) {
          setPositions((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, ...Object.fromEntries(formData) } : p
            )
          );
          setPositionModal(null);
          toast.success('Position updated successfully');
        } else {
          toast.error('Failed to update position');
        }
      } catch {
        toast.error('Error updating position');
      }
    });
  };

  const handleDeletePosition = (id) => {
    if (!confirm('Delete this position? This action cannot be undone.')) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', id);
        const result = await deleteCommitteePositionAction(formData);
        if (result?.success) {
          setPositions((prev) => prev.filter((p) => p.id !== id));
          toast.success('Position deleted successfully');
        } else {
          toast.error('Failed to delete position');
        }
      } catch {
        toast.error('Error deleting position');
      }
    });
  };

  // ── Member actions ────────────────────────────────────────────────────────
  const handleUpdateMember = (formData) => {
    startTransition(async () => {
      try {
        const id = formData.get('id');
        const result = await updateCommitteeMemberAction(formData);
        if (result?.success) {
          setMembers((prev) =>
            prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    position_id: formData.get('position_id'),
                    term_start: formData.get('term_start'),
                    term_end: formData.get('term_end') || null,
                    is_current: formData.get('is_current') === 'true',
                    bio: formData.get('bio') || null,
                    users: {
                      ...m.users,
                      member_profiles: {
                        ...m.users?.member_profiles,
                        academic_session: formData.get('academic_session') || '',
                        department: formData.get('department') || '',
                        github: formData.get('github') || '',
                        linkedin: formData.get('linkedin') || '',
                      },
                    },
                  }
                : m
            )
          );
          setMemberModal(null);
          toast.success('Member updated successfully');
        } else {
          toast.error('Failed to update member');
        }
      } catch {
        toast.error('Error updating member');
      }
    });
  };

  const handleCreateMember = (formData) => {
    startTransition(async () => {
      try {
        const result = await createCommitteeMemberAction(formData);
        if (result?.success) {
          const userObj = initialUsers?.find((u) => u.id === formData.get('user_id'));
          const newMember = {
            id: formData.get('id'),
            user_id: formData.get('user_id'),
            position_id: formData.get('position_id'),
            term_start: formData.get('term_start'),
            term_end: formData.get('term_end') || null,
            is_current: formData.get('is_current') === 'true',
            bio: formData.get('bio') || null,
            users: {
              ...userObj,
              member_profiles: {
                academic_session: formData.get('academic_session') || '',
                department: formData.get('department') || '',
                github: formData.get('github') || '',
                linkedin: formData.get('linkedin') || '',
              },
            },
          };
          setMembers((prev) => [...prev, newMember]);
          setMemberModal(null);
          toast.success('Member assigned successfully');
        } else {
          toast.error('Failed to assign member');
        }
      } catch {
        toast.error('Error assigning member');
      }
    });
  };

  const handleDeleteMember = (id) => {
    if (!confirm('Remove this member? This action cannot be undone.')) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', id);
        const result = await deleteCommitteeMemberAction(formData);
        if (result?.success) {
          setMembers((prev) => prev.filter((m) => m.id !== id));
          toast.success('Member removed successfully');
        } else {
          toast.error('Failed to remove member');
        }
      } catch {
        toast.error('Error removing member');
      }
    });
  };

  // ── current filtered list for active tab ──────────────────────────────────
  const currentItems =
    activeTab === 'positions'
      ? filteredPositions
      : activeTab === 'current-members'
      ? filteredMembers.filter((m) => m.is_current)
      : filteredMembers.filter((m) => {
          if (m.is_current) return false;
          if (selectedSession === 'All') return true;
          const year = m.term_start ? new Date(m.term_start).getFullYear() : NaN;
          const session = isNaN(year) ? 'Unknown' : `${year}-${String(year + 1).slice(-2)}`;
          return session === selectedSession;
        });

  const totalItems =
    activeTab === 'positions'
      ? positions.length
      : activeTab === 'current-members'
      ? members.filter((m) => m.is_current).length
      : members.filter((m) => {
          if (m.is_current) return false;
          if (selectedSession === 'All') return true;
          const year = m.term_start ? new Date(m.term_start).getFullYear() : NaN;
          const session = isNaN(year) ? 'Unknown' : `${year}-${String(year + 1).slice(-2)}`;
          return session === selectedSession;
        }).length;

  const tabs = [
    { value: 'positions', label: 'Positions', icon: Briefcase, count: positions.length },
    {
      value: 'current-members',
      label: 'Current Committee (2025-26)',
      icon: UserCheck,
      count: members.filter((m) => m.is_current).length,
    },
    {
      value: 'past-members',
      label: 'Past Committees',
      icon: Users,
      count: members.filter((m) => !m.is_current).length,
    },
  ];

  return (
    <>
      <PageShell>
        {/* Header */}
        <PageHeader
          icon={ShieldCheck}
          title="Committee Management"
          subtitle={`${live.totalMembers} total members · ${live.currentMembers} active terms · ${live.totalPositions} positions`}
          accent="indigo"
          actions={
            <div className="flex items-center gap-2">
              <Link
                href="/account/admin"
                className="rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/8 hover:text-white"
              >
                Dashboard
              </Link>
              <button
                onClick={() =>
                  activeTab === 'positions'
                    ? setPositionModal({ type: 'create', isOpen: true })
                    : setMemberModal({ type: 'create', isOpen: true })
                }
                className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] active:scale-95"
              >
                <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                {activeTab === 'positions' ? 'Add Position' : 'Assign Member'}
              </button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Users}
            label="Total Members"
            value={live.totalMembers}
            accent="indigo"
            delay={0}
          />
          <StatCard
            icon={UserCheck}
            label="Currently Active"
            value={live.currentMembers}
            sublabel={
              live.totalMembers - live.currentMembers > 0
                ? `${live.totalMembers - live.currentMembers} past terms`
                : 'All members active'
            }
            accent="emerald"
            delay={0.05}
          />
          <StatCard
            icon={Briefcase}
            label="Total Positions"
            value={live.totalPositions}
            sublabel={
              live.executiveCount > 0
                ? `${live.executiveCount} executive roles`
                : 'No executive roles'
            }
            accent="violet"
            delay={0.1}
          />
          <StatCard
            icon={BookUser}
            label="User Directory"
            value={live.totalUsers}
            accent="cyan"
            delay={0.15}
          />
        </div>

        {/* Tabs */}
        <TabBar tabs={tabs} value={activeTab} onChange={(v) => { setActiveTab(v); setSearch(''); setSelectedSession('All'); }} />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'positions'
                  ? 'Search positions by title or category…'
                  : 'Search members by name, email, or position…'
              }
              className="w-full bg-white/3 border border-white/8 rounded-xl py-2.5 pl-10 pr-9 text-sm text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-gray-600 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Session filter for past members */}
          {activeTab === 'past-members' && pastSessions.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Session:</span>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="bg-white/3 border border-white/8 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                style={{ colorScheme: 'dark' }}
              >
                <option value="All">All Sessions</option>
                {pastSessions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Results summary */}
        {(search || (activeTab === 'past-members' && selectedSession !== 'All')) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              Showing <span className="text-white font-medium">{currentItems.length}</span> of{' '}
              <span className="text-white font-medium">{totalItems}</span> {activeTab === 'positions' ? 'positions' : 'members'}
              {activeTab === 'past-members' && selectedSession !== 'All' && (
                <>
                  {' '}in session <span className="text-white font-medium">{selectedSession}</span>
                </>
              )}
            </span>
            <button
              onClick={() => {
                setSearch('');
                setSelectedSession('All');
              }}
              className="ml-2 flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          </div>
        )}

        {/* Content tables */}
        {activeTab === 'positions' ? (
          currentItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/8 bg-white/2 py-4">
              <EmptyState
                icon={Briefcase}
                title={search ? 'No positions found' : 'No positions yet'}
                description={
                  search
                    ? 'Try adjusting your search query.'
                    : 'Create your first committee position to get started.'
                }
                accent="indigo"
                action={
                  search ? (
                    <button
                      onClick={() => setSearch('')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium underline underline-offset-2"
                    >
                      Clear search
                    </button>
                  ) : (
                    <button
                      onClick={() => setPositionModal({ type: 'create', isOpen: true })}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Position
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <PositionsTable
              positions={currentItems}
              onEdit={(position) =>
                setPositionModal({ type: 'edit', position, isOpen: true })
              }
              onDelete={handleDeletePosition}
            />
          )
        ) : activeTab === 'current-members' ? (
          currentItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/8 bg-white/2 py-4">
              <EmptyState
                icon={Users}
                title={search ? 'No active members found' : 'No active members assigned'}
                description={
                  search
                    ? 'Try adjusting your search query.'
                    : 'Assign a user to an active term position.'
                }
                accent="indigo"
                action={
                  search ? (
                    <button
                      onClick={() => setSearch('')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium underline underline-offset-2"
                    >
                      Clear search
                    </button>
                  ) : (
                    <button
                      onClick={() => setMemberModal({ type: 'create', isOpen: true })}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> Assign Member
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <MembersTable
              members={currentItems}
              positions={positions}
              onEdit={(member) =>
                setMemberModal({ type: 'edit', member, isOpen: true })
              }
              onDelete={handleDeleteMember}
            />
          )
        ) : (
          currentItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/8 bg-white/2 py-4">
              <EmptyState
                icon={Users}
                title={search || selectedSession !== 'All' ? 'No past members found' : 'No past members assigned'}
                description={
                  search || selectedSession !== 'All'
                    ? 'Try adjusting your search filters.'
                    : 'Assign a user to a past term position.'
                }
                accent="indigo"
                action={
                  search || selectedSession !== 'All' ? (
                    <button
                      onClick={() => {
                        setSearch('');
                        setSelectedSession('All');
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium underline underline-offset-2"
                    >
                      Clear filters
                    </button>
                  ) : (
                    <button
                      onClick={() => setMemberModal({ type: 'create', isOpen: true })}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> Assign Member
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <MembersTable
              members={currentItems}
              positions={positions}
              onEdit={(member) =>
                setMemberModal({ type: 'edit', member, isOpen: true })
              }
              onDelete={handleDeleteMember}
            />
          )
        )}

        {/* Footer legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-white/8 bg-white/2 px-5 py-3 text-xs text-gray-500">
          <span className="text-gray-400 font-semibold">{"// Role Categories"}</span>
          {[
            { dot: 'bg-purple-400 border-purple-500/20', label: 'Executive – Leadership & operations' },
            { dot: 'bg-cyan-400 border-cyan-500/20', label: 'Mentor – Training & guidance' },
            { dot: 'bg-amber-400 border-amber-500/20', label: 'Advisor – Strategic club support' },
          ].map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      </PageShell>

      {/* Modals */}
      {positionModal?.isOpen && (
        <PositionModal
          type={positionModal.type}
          position={positionModal.position}
          onClose={() => setPositionModal(null)}
          onCreate={handleCreatePosition}
          onUpdate={handleUpdatePosition}
          isLoading={isPending}
        />
      )}

      {memberModal?.isOpen && (
        <MemberModal
          type={memberModal.type}
          member={memberModal.member}
          positions={positions}
          users={initialUsers}
          onClose={() => setMemberModal(null)}
          onCreate={handleCreateMember}
          onUpdate={handleUpdateMember}
          isLoading={isPending}
          defaultIsCurrent={activeTab === 'current-members'}
        />
      )}
    </>
  );
}

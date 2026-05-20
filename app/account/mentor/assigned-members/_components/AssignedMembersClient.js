'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Calendar, BookOpen, ChevronRight,
  CheckCircle2, PauseCircle, X, GraduationCap,
} from 'lucide-react';
import { PageShell, PageHeader, EmptyState, Avatar } from '@/app/account/mentor/_components/_ui';
import { updateMentorshipStatusAction } from '@/app/_lib/mentor-actions';
import EnrollmentsTab from '@/app/account/admin/bootcamps/[bootcampId]/_components/EnrollmentsTab';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  active:    { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
  paused:    { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   icon: PauseCircle  },
  completed: { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400',    icon: CheckCircle2 },
};

// ─── Mentee card ──────────────────────────────────────────────────────────────
function MenteeCard({ mentorship, onManage }) {
  const mentee = mentorship.users;
  const profile = mentee?.member_profiles;
  const name = mentee?.full_name ?? 'Unknown';
  const cfg = STATUS_CFG[mentorship.status] ?? STATUS_CFG.active;
  const Icon = cfg.icon;

  const since = mentorship.created_at
    ? new Date(mentorship.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm transition-all hover:border-white/14 hover:bg-white/6 hover:shadow-lg"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="md" />
          <div>
            <h3 className="text-sm font-bold text-white">{name}</h3>
            {profile?.academic_session && (
              <p className="text-xs text-gray-400 mt-0.5">{profile.academic_session}</p>
            )}
          </div>
        </div>
        <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          <Icon className="h-3 w-3" />
          {mentorship.status}
        </span>
      </div>

      <div className="mb-5 flex-1 space-y-2.5">
        {mentorship.focus && (
          <div className="flex items-start gap-2.5">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
            <p className="text-xs text-gray-400 leading-snug">
              <span className="font-semibold text-gray-300 mr-1">Focus:</span>
              {mentorship.focus}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
          <p className="text-xs text-gray-400">Since {since}</p>
        </div>
        {profile?.student_id && (
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 shrink-0 text-gray-500" />
            <p className="text-xs text-gray-400">ID: {profile.student_id}</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onManage(mentorship)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/4 py-2 text-sm font-semibold text-gray-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400 group-hover:border-white/12"
      >
        Manage
        <ChevronRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── Manage modal ─────────────────────────────────────────────────────────────
function ManageModal({ mentorship, onClose }) {
  const mentee = mentorship?.users;
  const name = mentee?.full_name ?? 'Unknown';
  const profile = mentee?.member_profiles;

  const [status, setStatus] = useState(mentorship?.status ?? 'active');
  const [notes, setNotes] = useState(mentorship?.notes ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setPending(true);
    setError('');
    const fd = new FormData();
    fd.set('mentorshipId', mentorship.id);
    fd.set('status', status);
    fd.set('notes', notes);
    const result = await updateMentorshipStatusAction(fd);
    setPending(false);
    if (result?.error) { setError(result.error); return; }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#1a1f2e] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <h2 className="text-base font-bold text-white">Update Mentorship</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/8 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex items-start gap-4 rounded-xl border border-white/8 bg-white/4 p-4">
            <Avatar name={name} size="md" />
            <div>
              <h3 className="font-bold text-white">{name}</h3>
              <p className="mt-0.5 text-xs text-gray-400">
                {profile?.student_id && `ID: ${profile.student_id}`}
                {profile?.student_id && profile?.academic_session && ' • '}
                {profile?.academic_session}
              </p>
              {mentorship.focus && (
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                  <span className="font-semibold text-gray-200 mr-1">Focus:</span>
                  {mentorship.focus}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-200">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
                <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-200">Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add progress notes or feedback..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/8 bg-white/2 px-6 py-4">
          <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-400 transition-colors hover:bg-white/8 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={pending}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, title, subtitle, accent = 'blue' }) {
  const colors = {
    blue:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  };
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colors[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main page client ─────────────────────────────────────────────────────────
export default function AssignedMembersClient({ mentorships, bootcamps }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const stats = useMemo(() => ({
    total:     mentorships.length,
    active:    mentorships.filter(m => m.status === 'active').length,
    completed: mentorships.filter(m => m.status === 'completed').length,
    paused:    mentorships.filter(m => m.status === 'paused').length,
  }), [mentorships]);

  const filtered = useMemo(() => mentorships.filter(m => {
    const name = m.users?.full_name?.toLowerCase() ?? '';
    const session = m.users?.member_profiles?.academic_session?.toLowerCase() ?? '';
    const matchSearch = !search || name.includes(search.toLowerCase()) || session.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  }), [mentorships, search, statusFilter]);

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto space-y-12">

        {/* ── Section 1: Mentorships ── */}
        <section>
          <PageHeader
            icon={Users}
            accent="blue"
            title="Assigned Members"
            subtitle="Manage and track your mentees"
          />

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total',     value: stats.total },
              { label: 'Active',    value: stats.active },
              { label: 'Completed', value: stats.completed },
              { label: 'Paused',    value: stats.paused },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col justify-end rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm min-h-22.5"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{s.label}</span>
                <span className="text-2xl font-bold text-white">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or session…"
                className="w-full rounded-xl border border-white/10 bg-white/4 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all backdrop-blur-sm"
              />
            </div>
            <div className="relative sm:w-44 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-white/4 py-3 pl-4 pr-10 text-sm font-medium text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all backdrop-blur-sm cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-gray-400" />
            </div>
          </div>

          {filtered.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <AnimatePresence>
                {filtered.map((m) => (
                  <MenteeCard key={m.id} mentorship={m} onManage={setSelected} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-white/8 border-dashed py-20 text-center">
              <EmptyState icon={Users} title="No mentees found" accent="blue" />
              {(search || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setStatusFilter('all'); }}
                  className="mt-4 rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Section 2: Bootcamp Enrollments ── */}
        <section>
          <SectionHeading
            icon={GraduationCap}
            accent="violet"
            title="Bootcamp Enrollments"
            subtitle="Manage enrollments for your assigned bootcamps"
          />

          {bootcamps.length === 0 ? (
            <div className="rounded-2xl border border-white/8 border-dashed py-20 text-center">
              <EmptyState icon={GraduationCap} title="No bootcamps assigned" accent="violet" />
            </div>
          ) : (
            <div className="space-y-8">
              {bootcamps.map((bootcamp) => (
                <div key={bootcamp.id} className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
                  {/* Bootcamp header */}
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
                  {/* Enrollments table */}
                  <div className="p-4">
                    <EnrollmentsTab bootcampId={bootcamp.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Manage mentorship modal */}
      <AnimatePresence>
        {selected && (
          <ManageModal mentorship={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </PageShell>
  );
}

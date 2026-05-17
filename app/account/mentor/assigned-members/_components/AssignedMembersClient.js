'use client';

import { useState } from 'react';
import { Users, Search, BookOpen, Calendar, ChevronRight, X } from 'lucide-react';
import { updateMentorshipStatusAction } from '@/app/_lib/mentor-actions';
import { useScrollLock } from '@/app/_lib/hooks';
import {
  PageShell, PageHeader, GlassCard, StatCard, Avatar, Pill, ActionButton, EmptyState,
} from '@/app/account/mentor/_components/_ui';

const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);
const MOCK_MENTOR_ID = 'mock-mentor-id';

const MOCK_MENTORSHIPS = [
  {
    id: 'mp1', status: 'active', start_date: daysAgo(120), focus_area: 'Frontend Development — React, TypeScript, CSS Architecture',
    notes: 'Strong grasp of React fundamentals. Needs more work on state management patterns.',
    'users!mentorships_mentee_id_fkey': { full_name: 'Aisha Rahman', email: 'aisha@example.com', member_profiles: { academic_session: '2021-22', student_id: '2021331001', department: 'CSE', semester: '7th' } },
  },
  {
    id: 'mp2', status: 'active', start_date: daysAgo(90), focus_area: 'Backend Development — Node.js, PostgreSQL, REST APIs',
    notes: 'Struggles with async concepts. Has improved significantly after debugging session on May 12.',
    'users!mentorships_mentee_id_fkey': { full_name: 'Rahul Sharma', email: 'rahul@example.com', member_profiles: { academic_session: '2022-23', student_id: '2022331042', department: 'CSE', semester: '5th' } },
  },
  {
    id: 'mp3', status: 'active', start_date: daysAgo(60), focus_area: 'Competitive Programming — DSA, Graph Algorithms, DP',
    notes: 'Excellent problem-solver. Rated 1720 on Codeforces. Ready for advanced topics.',
    'users!mentorships_mentee_id_fkey': { full_name: 'Sara Ahmed', email: 'sara@example.com', member_profiles: { academic_session: '2022-23', student_id: '2022331018', department: 'CSE', semester: '5th' } },
  },
  {
    id: 'mp4', status: 'active', start_date: daysAgo(45), focus_area: 'Full Stack — MERN, Docker, CI/CD',
    notes: 'Progressing steadily. Completed Docker module independently.',
    'users!mentorships_mentee_id_fkey': { full_name: 'John Doe', email: 'john@example.com', member_profiles: { academic_session: '2023-24', student_id: '2023331077', department: 'CSE', semester: '3rd' } },
  },
  {
    id: 'mp5', status: 'paused', start_date: daysAgo(150), focus_area: 'Machine Learning — Python, scikit-learn, PyTorch',
    notes: 'Paused due to exam season. Will resume in June.',
    'users!mentorships_mentee_id_fkey': { full_name: 'Priya Nair', email: 'priya@example.com', member_profiles: { academic_session: '2021-22', student_id: '2021331055', department: 'CSE', semester: '7th' } },
  },
  {
    id: 'mp6', status: 'completed', start_date: daysAgo(300), focus_area: 'Android Development — Kotlin, Jetpack Compose',
    notes: 'Successfully completed 6-month program. Got internship at a local startup.',
    'users!mentorships_mentee_id_fkey': { full_name: 'Kamal Hossain', email: 'kamal@example.com', member_profiles: { academic_session: '2020-21', student_id: '2020331009', department: 'CSE', semester: '8th' } },
  },
];

const STATUS_TONE = {
  active: 'emerald',
  completed: 'blue',
  paused: 'amber',
  cancelled: 'rose',
};

export default function AssignedMembersClient({ mentorships: rawMentorships = [], mentorId }) {
  const mentorships = rawMentorships.length === 0 ? MOCK_MENTORSHIPS : rawMentorships;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMentorship, setSelectedMentorship] = useState(null);
  useScrollLock(!!selectedMentorship);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  const filtered = mentorships.filter((m) => {
    const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
    const name = mentee?.full_name?.toLowerCase() || '';
    const sessionValue = mentee?.member_profiles?.academic_session?.toLowerCase() || '';
    const matchSearch = !search || name.includes(search.toLowerCase()) || sessionValue.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: mentorships.length,
    active: mentorships.filter((m) => m.status === 'active').length,
    completed: mentorships.filter((m) => m.status === 'completed').length,
    paused: mentorships.filter((m) => m.status === 'paused').length,
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    const formData = new FormData(e.target);
    formData.set('mentorshipId', selectedMentorship.id);
    const result = await updateMentorshipStatusAction(formData);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else {
      setMessage({ type: 'success', text: result.success });
      setSelectedMentorship(null);
    }
    setIsUpdating(false);
  };

  return (
    <PageShell>
      <PageHeader
        icon={Users}
        title="Assigned Members"
        subtitle="Manage and track your mentees"
        accent="blue"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: 'Total', value: stats.total, accent: 'blue' },
          { label: 'Active', value: stats.active, accent: 'emerald' },
          { label: 'Completed', value: stats.completed, accent: 'violet' },
          { label: 'Paused', value: stats.paused, accent: 'amber' },
        ].map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} delay={i * 0.06} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or session…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <GlassCard padding="py-16">
          <EmptyState
            icon={Users}
            title="No mentees found"
            description={mentorships.length === 0 ? 'No members have been assigned to you yet.' : 'Try adjusting your filters.'}
            accent="blue"
          />
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
            const profile = mentee?.member_profiles;
            return (
              <GlassCard key={m.id} hover padding="p-5" className="flex flex-col">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={mentee?.full_name || '?'} size="md" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{mentee?.full_name || 'Unknown'}</h3>
                      {profile?.academic_session && (
                        <p className="text-xs text-gray-400">Session {profile.academic_session}</p>
                      )}
                    </div>
                  </div>
                  <Pill tone={STATUS_TONE[m.status] ?? 'gray'}>{m.status}</Pill>
                </div>

                <div className="space-y-2 text-sm flex-1">
                  {m.focus_area && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{m.focus_area}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Since {new Date(m.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMentorship(m)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                >
                  Manage <ChevronRight className="h-4 w-4" />
                </button>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedMentorship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Update Mentorship</h2>
              <button
                onClick={() => { setSelectedMentorship(null); setMessage(null); }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {message && (
              <div className={`mb-4 rounded-xl p-3 text-sm ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {message.text}
              </div>
            )}

            {(() => {
              const mentee = selectedMentorship['users!mentorships_mentee_id_fkey'] || selectedMentorship.users;
              const profile = mentee?.member_profiles;
              return (
                <div className="mb-5 rounded-xl border border-white/6 bg-white/2 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={mentee?.full_name || '?'} size="md" />
                    <div>
                      <p className="font-medium text-white">{mentee?.full_name}</p>
                      {profile?.student_id && (
                        <p className="text-xs text-gray-400">ID: {profile.student_id} | Session {profile.academic_session}</p>
                      )}
                    </div>
                  </div>
                  {selectedMentorship.focus_area && (
                    <p className="mt-3 text-sm text-gray-400">
                      <span className="text-gray-500">Focus: </span>{selectedMentorship.focus_area}
                    </p>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Status</label>
                <select
                  name="status"
                  defaultValue={selectedMentorship.status}
                  className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Notes</label>
                <textarea
                  name="notes"
                  defaultValue={selectedMentorship.notes || ''}
                  rows={3}
                  placeholder="Internal notes about this mentorship…"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setSelectedMentorship(null); setMessage(null); }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

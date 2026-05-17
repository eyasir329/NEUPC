'use client';

import { useState } from 'react';
import { Video, Plus, Search, X, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  createMentorshipSessionAction,
  updateSessionNotesAction,
  deleteSessionAction,
} from '@/app/_lib/mentor-actions';
import { useScrollLock } from '@/app/_lib/hooks';
import {
  PageShell, PageHeader, GlassCard, StatCard, Avatar, Pill, ActionButton, EmptyState,
} from '@/app/account/mentor/_components/_ui';

const daysAgo = (d) => new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);

const MOCK_MENTORSHIPS = [
  {
    id: 'ms1', status: 'active',
    'users!mentorships_mentee_id_fkey': { full_name: 'Aisha Rahman' },
    mentorship_sessions: [
      { id: 's1', topic: 'React Hooks & useEffect cleanup', session_date: daysAgo(1),  duration: 60, attended: true,  notes: 'Covered closure issues in async effects. Assigned cleanup pattern exercise.' },
      { id: 's2', topic: 'Intro to TypeScript generics',   session_date: daysAgo(8),  duration: 45, attended: true,  notes: 'Walked through generic constraints. She grasped it quickly.' },
      { id: 's3', topic: 'Component architecture review',  session_date: daysAgo(15), duration: 60, attended: false, notes: 'Mentee was unwell. Rescheduled for next week.' },
    ],
  },
  {
    id: 'ms2', status: 'active',
    'users!mentorships_mentee_id_fkey': { full_name: 'Rahul Sharma' },
    mentorship_sessions: [
      { id: 's4', topic: 'Express middleware order debugging', session_date: daysAgo(2),  duration: 90, attended: true,  notes: 'Traced a nasty CORS bug together. He now understands middleware stack order.' },
      { id: 's5', topic: 'Database indexing strategies',      session_date: daysAgo(10), duration: 60, attended: true,  notes: 'Covered B-tree vs hash indexes. Gave reading on query plans.' },
    ],
  },
  {
    id: 'ms3', status: 'active',
    'users!mentorships_mentee_id_fkey': { full_name: 'Sara Ahmed' },
    mentorship_sessions: [
      { id: 's6', topic: 'Career guidance — internship prep', session_date: daysAgo(3),  duration: 60, attended: true,  notes: 'Reviewed resume and cover letter. Discussed FAANG interview strategy.' },
      { id: 's7', topic: 'LIS problem — DP optimisation',    session_date: daysAgo(9),  duration: 75, attended: true,  notes: 'O(n log n) patience sorting approach. She implemented it live — excellent.' },
      { id: 's8', topic: 'System design: URL shortener',     session_date: daysAgo(17), duration: 90, attended: true,  notes: 'Covered hashing, redirection, analytics. She designed the schema independently.' },
    ],
  },
  {
    id: 'ms4', status: 'active',
    'users!mentorships_mentee_id_fkey': { full_name: 'John Doe' },
    mentorship_sessions: [
      { id: 's9',  topic: 'Docker & containerisation basics', session_date: daysAgo(5),  duration: 60, attended: true,  notes: 'Set up a multi-container app with docker-compose. He will practise on his own project.' },
      { id: 's10', topic: 'Git workflow & branching strategy', session_date: daysAgo(21), duration: 45, attended: true,  notes: 'Covered GitFlow and trunk-based development. Assigned a PR review exercise.' },
    ],
  },
];

function SessionModal({ mentorships, onClose, mentorId }) {
  const [loading, setLoading] = useState(false);
  useScrollLock();
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.target);
    fd.set('created_by', mentorId);
    const result = await createMentorshipSessionAction(fd);
    if (result.error) { setError(result.error); setLoading(false); }
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Log Session</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Mentee *</label>
            <select name="mentorship_id" required className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none">
              <option value="">Select mentee…</option>
              {mentorships.filter((m) => m.status === 'active').map((m) => {
                const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
                return <option key={m.id} value={m.id}>{mentee?.full_name || 'Unknown'}</option>;
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Date *</label>
              <input type="date" name="session_date" required defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Duration (min)</label>
              <input type="number" name="duration" min="15" step="15" defaultValue="60" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Topic *</label>
            <input name="topic" required placeholder="Session topic" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Notes</label>
            <textarea name="notes" rows={3} placeholder="Session notes…" className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="attended" id="attended" defaultChecked className="rounded border-white/20 bg-white/5" />
            <label htmlFor="attended" className="text-sm text-gray-300">Mentee attended</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Logging…' : 'Log Session'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MentorSessionsClient({ mentorships: rawMentorships = [], mentorId }) {
  const mentorships = rawMentorships.length === 0 ? MOCK_MENTORSHIPS : rawMentorships;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editNotes, setEditNotes] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState(null);

  const allSessions = mentorships.flatMap((m) => {
    const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
    return (m.mentorship_sessions || []).map((s) => ({
      ...s,
      menteeName: mentee?.full_name || 'Unknown',
      mentorship_id: m.id,
    }));
  });

  const filtered = allSessions.filter(
    (s) => !search || s.topic?.toLowerCase().includes(search.toLowerCase()) || s.menteeName?.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => new Date(b.session_date) - new Date(a.session_date));

  const now = new Date();
  const stats = {
    total: allSessions.length,
    attended: allSessions.filter((s) => s.attended).length,
    thisMonth: allSessions.filter((s) => {
      const d = new Date(s.session_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    totalHours: Math.round((allSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60) * 10) / 10,
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    const fd = new FormData();
    fd.set('sessionId', editNotes.sessionId);
    fd.set('notes', editNotes.notes);
    const result = await updateSessionNotesAction(fd);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else setEditNotes(null);
    setSavingNotes(false);
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Delete this session record?')) return;
    setDeleting(sessionId);
    const fd = new FormData();
    fd.set('sessionId', sessionId);
    const result = await deleteSessionAction(fd);
    if (result.error) setMessage({ type: 'error', text: result.error });
    setDeleting(null);
  };

  return (
    <PageShell>
      <PageHeader
        icon={Video}
        title="Sessions"
        subtitle="Track and log mentorship sessions"
        accent="emerald"
        actions={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Log Session
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: 'Total Sessions', value: stats.total, accent: 'blue' },
          { label: 'Attended', value: stats.attended, accent: 'emerald' },
          { label: 'This Month', value: stats.thisMonth, accent: 'violet' },
          { label: 'Hours Logged', value: stats.totalHours, accent: 'amber' },
        ].map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} delay={i * 0.06} />
        ))}
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by topic or mentee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none"
        />
      </div>

      {message && (
        <div className={`rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {message.text}
        </div>
      )}

      {sorted.length === 0 ? (
        <GlassCard padding="py-16">
          <EmptyState icon={Video} title="No sessions logged yet" description="Start by logging your first mentorship session." accent="emerald" />
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {sorted.map((s) => (
            <GlassCard key={s.id} padding="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">{s.topic}</h3>
                    <Pill tone={s.attended ? 'emerald' : 'rose'} icon={s.attended ? CheckCircle : XCircle}>
                      {s.attended ? 'Attended' : 'Missed'}
                    </Pill>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Avatar name={s.menteeName} size="sm" />
                      {s.menteeName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(s.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {s.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {s.duration} min
                      </span>
                    )}
                  </div>
                  {s.notes && editNotes?.sessionId !== s.id && (
                    <p className="mt-2 text-sm text-gray-500">{s.notes}</p>
                  )}
                  {editNotes?.sessionId === s.id && (
                    <div className="mt-3">
                      <textarea
                        rows={3}
                        value={editNotes.notes}
                        onChange={(e) => setEditNotes({ ...editNotes, notes: e.target.value })}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <div className="mt-2 flex gap-2">
                        <ActionButton tone="ghost" onClick={() => setEditNotes(null)}>Cancel</ActionButton>
                        <ActionButton tone="primary" onClick={handleSaveNotes}>{savingNotes ? 'Saving…' : 'Save'}</ActionButton>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <ActionButton tone="ghost" onClick={() => setEditNotes({ sessionId: s.id, notes: s.notes || '' })}>Notes</ActionButton>
                  <ActionButton tone="danger" onClick={() => handleDelete(s.id)} disabled={deleting === s.id}>Delete</ActionButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showModal && <SessionModal mentorships={mentorships} onClose={() => setShowModal(false)} mentorId={mentorId} />}
    </PageShell>
  );
}

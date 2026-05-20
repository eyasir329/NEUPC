'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  Loader2,
  Users,
  LayoutList,
  Star,
  GraduationCap,
  ClipboardList,
  Video,
  Award,
  HelpCircle,
  Plus,
  X,
  Clock,
  Link as LinkIcon,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';
import CurriculumBuilder from '@/app/account/admin/bootcamps/_components/CurriculumBuilder';
import EnrollmentsTab from '@/app/account/admin/bootcamps/[bootcampId]/_components/EnrollmentsTab';
import { getStatusConfig } from '@/app/account/admin/bootcamps/_components/bootcampConfig';
import { PageShell, PageHeader, TabBar, Pill, GlassCard, StatCard, Avatar, EmptyState } from '@/app/account/mentor/_components/_ui';
import {
  createBootcampTaskAction,
  updateBootcampTaskAction,
  deleteBootcampTaskAction,
  createBootcampSessionAction,
  updateBootcampSessionAction,
  saveBootcampMentorshipNotesAction,
  replyAndResolveHelpTicketAction,
} from '@/app/_lib/bootcamp-actions';
import toast from 'react-hot-toast';

const TABS = [
  { value: 'curriculum', label: 'Curriculum', icon: LayoutList },
  { value: 'enrollments', label: 'Enrollments', icon: Users },
  { value: 'tasks', label: 'Tasks', icon: ClipboardList },
  { value: 'sessions', label: 'Sessions', icon: Video },
  { value: 'recommendations', label: 'Recommendations', icon: Award },
  { value: 'helpdesk', label: 'Help Desk', icon: HelpCircle },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFF_TONE = { easy: 'emerald', medium: 'amber', hard: 'rose' };
const TICKET_TONE = { open: 'amber', resolved: 'emerald', closed: 'gray' };

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ bootcampId, initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [expanded, setExpanded] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [links, setLinks] = useState(['']);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditTask(null); setLinks(['']); setShowModal(true); };
  const openEdit = (t) => { setEditTask(t); setLinks(t.problem_links?.length ? [...t.problem_links] : ['']); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.target);
    fd.set('bootcamp_id', bootcampId);
    fd.set('problem_links', JSON.stringify(links.filter(Boolean)));
    if (editTask) {
      fd.set('id', editTask.id);
      const result = await updateBootcampTaskAction(fd);
      if (result.error) { toast.error(result.error); setSaving(false); return; }
      setTasks((prev) => prev.map((t) => t.id === editTask.id
        ? { ...t, title: fd.get('title'), difficulty: fd.get('difficulty'), description: fd.get('description'), deadline: fd.get('deadline'), problem_links: links.filter(Boolean) }
        : t));
      toast.success('Task updated');
    } else {
      const result = await createBootcampTaskAction(fd);
      if (result.error) { toast.error(result.error); setSaving(false); return; }
      if (result.data) setTasks((prev) => [result.data, ...prev]);
      toast.success('Task created');
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    const fd = new FormData();
    fd.set('id', id);
    fd.set('bootcamp_id', bootcampId);
    const result = await deleteBootcampTaskAction(fd);
    if (result.error) { toast.error(result.error); return; }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success('Task deleted');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-3 flex-1">
          {[{ label: 'Total', value: tasks.length, accent: 'blue' }, { label: 'Easy', value: tasks.filter(t => t.difficulty === 'easy').length, accent: 'emerald' }, { label: 'Hard', value: tasks.filter(t => t.difficulty === 'hard').length, accent: 'rose' }].map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
          ))}
        </div>
        <button onClick={openCreate} className="ml-4 flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <GlassCard padding="py-16"><EmptyState icon={ClipboardList} title="No tasks yet" description="Create tasks for enrolled members." accent="violet" /></GlassCard>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <GlassCard key={task.id} padding="p-0" className="overflow-hidden">
              <div className="flex cursor-pointer items-center justify-between p-4" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
                <div className="flex min-w-0 items-center gap-3">
                  <Pill tone={DIFF_TONE[task.difficulty] ?? 'gray'}>{task.difficulty}</Pill>
                  <span className="truncate text-sm font-medium text-white">{task.title}</span>
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-2">
                  {task.deadline && <span className="hidden items-center gap-1 text-xs text-gray-500 sm:flex"><Clock className="h-3 w-3" />{new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  <button onClick={(e) => { e.stopPropagation(); openEdit(task); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-blue-400"><ClipboardList className="h-4 w-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400"><X className="h-4 w-4" /></button>
                  {expanded === task.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </div>
              {expanded === task.id && (
                <div className="border-t border-white/6 p-4 pt-3">
                  {task.description && <p className="mb-3 text-sm text-gray-400">{task.description}</p>}
                  {task.problem_links?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {task.problem_links.map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 hover:bg-blue-500/20">
                          <LinkIcon className="h-3 w-3" />Problem {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{editTask ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Title *</label>
                <input name="title" required defaultValue={editTask?.title} placeholder="Task title" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Description</label>
                <textarea name="description" rows={3} defaultValue={editTask?.description} className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Difficulty</label>
                  <select name="difficulty" defaultValue={editTask?.difficulty || 'medium'} className="w-full rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Deadline</label>
                  <input type="date" name="deadline" defaultValue={editTask?.deadline?.slice(0, 10)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Problem Links</label>
                <div className="space-y-2">
                  {links.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="url" value={link} onChange={(e) => { const n = [...links]; n[i] = e.target.value; setLinks(n); }} placeholder="https://codeforces.com/…" className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none" />
                      <button type="button" onClick={() => setLinks(links.filter((_, j) => j !== i))} className="rounded-lg p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setLinks([...links, ''])} className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300"><Plus className="h-3.5 w-3.5" /> Add link</button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">{saving ? 'Saving…' : editTask ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sessions Tab ─────────────────────────────────────────────────────────────

function MentorSessionRow({ session, markingId, onMarkAttended }) {
  const isFuture = new Date(session.session_date) >= new Date();
  const menteeName = session.mentee?.full_name || session.mentee || '—';
  return (
    <GlassCard padding="p-4" className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
        <Video className="h-5 w-5 text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white">{session.topic}</span>
          {isFuture
            ? <Pill tone="blue">Upcoming</Pill>
            : session.attended === true
              ? <Pill tone="emerald"><CheckCircle className="h-3 w-3 mr-1" />Attended</Pill>
              : session.attended === false
                ? <Pill tone="rose"><XCircle className="h-3 w-3 mr-1" />Missed</Pill>
                : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{session.duration}min</span>
          <span className="flex items-center gap-1"><Avatar name={menteeName} size="xs" />{menteeName}</span>
        </div>
        {session.notes && <p className="mt-2 text-xs text-gray-400">{session.notes}</p>}
        {!isFuture && session.attended == null && (
          <div className="mt-3 flex gap-2">
            <button onClick={() => onMarkAttended(session, true)} disabled={markingId === session.id} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50">
              <CheckCircle className="h-3 w-3" /> Attended
            </button>
            <button onClick={() => onMarkAttended(session, false)} disabled={markingId === session.id} className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-50">
              <XCircle className="h-3 w-3" /> Missed
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function SessionsTab({ bootcampId, initialSessions, members }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const upcoming = sessions.filter((s) => new Date(s.session_date) >= new Date());
  const past = sessions.filter((s) => new Date(s.session_date) < new Date());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.target);
    fd.set('bootcamp_id', bootcampId);
    const result = await createBootcampSessionAction(fd);
    if (result.error) { toast.error(result.error); setSaving(false); return; }
    const memberUserId = fd.get('member_user_id');
    const selectedMember = members.find((m) => m.user_id === memberUserId);
    const menteeName = selectedMember?.users?.full_name || '';
    const optimisticId = result.data?.id || `s${Date.now()}`;
    setSessions((prev) => [{
      id: optimisticId,
      topic: fd.get('topic'),
      mentee: { full_name: menteeName },
      session_date: fd.get('session_date'),
      duration: parseInt(fd.get('duration') || '60'),
      attended: null,
      notes: fd.get('notes') || '',
    }, ...prev]);
    setSaving(false);
    setShowModal(false);
    toast.success('Session scheduled');
  };

  const handleMarkAttended = async (session, attended) => {
    setMarkingId(session.id);
    const fd = new FormData();
    fd.set('bootcamp_id', bootcampId);
    fd.set('session_id', session.id);
    fd.set('attended', String(attended));
    fd.set('notes', session.notes || '');
    const result = await updateBootcampSessionAction(fd);
    if (result.error) toast.error(result.error);
    else setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, attended } : s));
    setMarkingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-3 flex-1">
          {[{ label: 'Total', value: sessions.length, accent: 'blue' }, { label: 'Upcoming', value: upcoming.length, accent: 'violet' }, { label: 'Completed', value: past.filter(s => s.attended).length, accent: 'emerald' }].map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="ml-4 flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">
          <Plus className="h-4 w-4" /> Schedule
        </button>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Upcoming ({upcoming.length})</h3>
          <div className="space-y-3">{upcoming.map((s) => <MentorSessionRow key={s.id} session={s} markingId={markingId} onMarkAttended={handleMarkAttended} />)}</div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">Past ({past.length})</h3>
          <div className="space-y-3">{past.map((s) => <MentorSessionRow key={s.id} session={s} markingId={markingId} onMarkAttended={handleMarkAttended} />)}</div>
        </div>
      )}
      {sessions.length === 0 && (
        <GlassCard padding="py-16"><EmptyState icon={Video} title="No sessions yet" description="Schedule sessions with enrolled members." accent="violet" /></GlassCard>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Schedule Session</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Topic *</label>
                <input name="topic" required placeholder="Session topic" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Member *</label>
                <select name="member_user_id" required className="w-full rounded-xl border border-white/10 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:outline-none">
                  <option value="">Select member…</option>
                  {members.map((m) => {
                    const u = m.users;
                    return <option key={m.user_id} value={m.user_id}>{u?.full_name || m.user_id}</option>;
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Date *</label>
                  <input type="date" name="session_date" required className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Duration (min)</label>
                  <input type="number" name="duration" defaultValue="60" min="15" step="15" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Notes</label>
                <textarea name="notes" rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">{saving ? 'Saving…' : 'Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recommendations Tab ──────────────────────────────────────────────────────

function RecommendationsTab({ bootcampId, mentorships }) {
  const [items, setItems] = useState(mentorships);
  const [expanded, setExpanded] = useState(null);
  const [localNotes, setLocalNotes] = useState({});
  const [saving, setSaving] = useState(null);

  const handleSaveNotes = async (mentorship) => {
    setSaving(mentorship.id);
    const fd = new FormData();
    fd.set('bootcamp_id', bootcampId);
    // Pass mentee_user_id so the action can upsert a mentorship if needed
    fd.set('mentee_user_id', mentorship.mentee_id);
    fd.set('notes', localNotes[mentorship.id] ?? mentorship.notes ?? '');
    const result = await saveBootcampMentorshipNotesAction(fd);
    if (result.error) toast.error(result.error);
    else {
      setItems((prev) => prev.map((m) => m.id === mentorship.id ? { ...m, notes: localNotes[mentorship.id] ?? m.notes } : m));
      toast.success('Notes saved');
    }
    setSaving(null);
  };

  const totalProblems = items.reduce((a, m) => a + (m.member_progress?.[0]?.problems_solved || 0), 0);
  const totalContests = items.reduce((a, m) => a + (m.member_progress?.[0]?.contests_participated || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'Members', value: items.length, accent: 'blue' }, { label: 'Problems', value: totalProblems, accent: 'emerald' }, { label: 'Contests', value: totalContests, accent: 'violet' }].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
        ))}
      </div>

      {items.length === 0 ? (
        <GlassCard padding="py-16"><EmptyState icon={Award} title="No enrolled members" description="Enrolled members will appear here once they join the bootcamp." accent="violet" /></GlassCard>
      ) : (
        <div className="space-y-3">
          {items.map((m) => {
            const user = m['users!mentorships_mentee_id_fkey'] || m.users;
            const profile = user?.member_profiles;
            const skills = Array.isArray(profile?.skills) ? profile.skills : [];
            const latest = m.member_progress?.[0];
            return (
              <GlassCard key={m.id} padding="p-0" className="overflow-hidden">
                <div className="flex cursor-pointer items-center gap-4 p-4" onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                  <Avatar name={user?.full_name || '?'} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">
                      {profile?.academic_session && `Session ${profile.academic_session} · `}
                      {latest ? `${latest.problems_solved} problems · ${latest.contests_participated} contests` : 'No progress data'}
                    </p>
                  </div>
                  {skills.slice(0, 2).map((s) => (
                    <span key={s} className="hidden sm:inline rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 ring-1 ring-violet-500/20">{s}</span>
                  ))}
                  {expanded === m.id ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                </div>
                {expanded === m.id && (
                  <div className="border-t border-white/6 p-4 pt-3 space-y-3">
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s) => <span key={s} className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 ring-1 ring-violet-500/20">{s}</span>)}
                      </div>
                    )}
                    {m.member_progress?.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {m.member_progress.slice(0, 3).map((p) => (
                          <div key={p.period} className="rounded-lg border border-white/6 bg-white/2 p-2 text-center">
                            <p className="text-[10px] text-gray-500">{p.period}</p>
                            <p className="mt-0.5 text-sm font-semibold text-white">{p.problems_solved}</p>
                            <p className="text-[10px] text-gray-600">problems</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-400">Mentor Notes & Recommendation</label>
                      <textarea
                        rows={3}
                        defaultValue={m.notes || ''}
                        onChange={(e) => setLocalNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => handleSaveNotes(m)} disabled={saving === m.id} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                        {saving === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                        Save Notes
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Help Desk Tab ────────────────────────────────────────────────────────────

function HelpDeskTab({ bootcampId, initialTickets }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [expanded, setExpanded] = useState(null);
  const [reply, setReply] = useState({});
  const [sending, setSending] = useState(null);

  const handleReplyAndResolve = async (ticketId, status = 'resolved') => {
    if (!reply[ticketId]?.trim() && status === 'resolved') return;
    setSending(ticketId);
    const fd = new FormData();
    fd.set('bootcamp_id', bootcampId);
    fd.set('ticket_id', ticketId);
    fd.set('reply', reply[ticketId] || '');
    fd.set('status', status);
    const result = await replyAndResolveHelpTicketAction(fd);
    if (result.error) { toast.error(result.error); setSending(null); return; }
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status, reply: reply[ticketId] || t.reply } : t));
    setReply((prev) => ({ ...prev, [ticketId]: '' }));
    setSending(null);
    toast.success(status === 'resolved' ? 'Ticket resolved' : 'Reply sent');
  };

  const open = tickets.filter((t) => t.status === 'open');
  const resolved = tickets.filter((t) => t.status !== 'open');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'Total', value: tickets.length, accent: 'blue' }, { label: 'Open', value: open.length, accent: 'amber' }, { label: 'Resolved', value: resolved.length, accent: 'emerald' }].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
        ))}
      </div>

      {[{ title: 'Open', items: open }, { title: 'Resolved', items: resolved }].map(({ title, items }) => (
        items.length > 0 && (
          <div key={title}>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">{title} ({items.length})</h3>
            <div className="space-y-2">
              {items.map((ticket) => {
                const fromName = ticket.users?.full_name || ticket.from || 'Member';
                const createdDate = ticket.created_at
                  ? new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '';
                return (
                  <GlassCard key={ticket.id} padding="p-0" className="overflow-hidden">
                    <div className="flex cursor-pointer items-center gap-3 p-4" onClick={() => setExpanded(expanded === ticket.id ? null : ticket.id)}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                        <MessageSquare className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{ticket.subject}</span>
                          <Pill tone={TICKET_TONE[ticket.status] ?? 'gray'}>{ticket.status}</Pill>
                        </div>
                        <p className="text-xs text-gray-500">{fromName}{createdDate && ` · ${createdDate}`}</p>
                      </div>
                      {expanded === ticket.id ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                    </div>
                    {expanded === ticket.id && (
                      <div className="border-t border-white/6 p-4 pt-3 space-y-4">
                        <p className="text-sm text-gray-300">{ticket.body}</p>
                        {ticket.reply && (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                            <p className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase mb-1">Mentor Reply</p>
                            <p className="text-sm text-gray-300">{ticket.reply}</p>
                          </div>
                        )}
                        {ticket.status === 'open' && (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              placeholder="Type a reply…"
                              value={reply[ticket.id] || ''}
                              onChange={(e) => setReply((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500/50 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleReplyAndResolve(ticket.id, 'open')} disabled={sending === ticket.id || !reply[ticket.id]?.trim()} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                                {sending === ticket.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Reply
                              </button>
                              <button onClick={() => handleReplyAndResolve(ticket.id, 'resolved')} disabled={sending === ticket.id} className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50">
                                <CheckCircle className="h-4 w-4" /> Resolve
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )
      ))}

      {tickets.length === 0 && (
        <GlassCard padding="py-16"><EmptyState icon={HelpCircle} title="No tickets" description="Member help requests will appear here." accent="violet" /></GlassCard>
      )}
    </div>
  );
}

const STATUS_TONE = { published: 'emerald', draft: 'amber', archived: 'gray' };

export default function MentorBootcampDetailClient({
  bootcamp,
  members = [],
  totalLessons = 0,
  sessions = [],
  mentorships = [],
  tasks = [],
  helpTickets = [],
}) {
  const [activeTab, setActiveTab] = useState('curriculum');
  const [saving, setSaving] = useState(false);
  const [bootcampData, setBootcampData] = useState(bootcamp);
  const lessonSaveRef = useRef(null);

  const handleSave = async () => {
    if (activeTab !== 'curriculum' || !lessonSaveRef.current) return;
    setSaving(true);
    try {
      await lessonSaveRef.current();
      toast.success('Changes saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCoursesChange = useCallback((courses) => {
    setBootcampData((prev) => ({ ...prev, courses }));
  }, []);

  const sc = getStatusConfig(bootcamp.status);
  const tone = STATUS_TONE[bootcamp.status] ?? 'gray';

  return (
    <PageShell>
      <PageHeader
        icon={GraduationCap}
        title={bootcampData.title || 'Untitled Track'}
        accent="violet"
        meta={
          <>
            <Pill tone={tone}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${bootcamp.status === 'published' ? 'animate-pulse' : ''} mr-1`} />
              {sc.label}
            </Pill>
            {bootcampData.is_featured && (
              <Pill tone="amber" icon={Star}>Featured</Pill>
            )}
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/account/mentor/bootcamps"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium"
            >
              <ChevronLeft className="h-3 w-3" />
              My Bootcamps
            </Link>
            {activeTab === 'curriculum' && lessonSaveRef && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </div>
        }
      />

      <TabBar tabs={TABS} value={activeTab} onChange={setActiveTab} />

      {activeTab === 'curriculum' && (
        <CurriculumBuilder
          bootcampId={bootcamp.id}
          initialCourses={bootcampData.courses || []}
          onCoursesChange={handleCoursesChange}
          lessonSaveRef={lessonSaveRef}
        />
      )}

      {activeTab === 'enrollments' && (
        <EnrollmentsTab bootcampId={bootcamp.id} />
      )}

      {activeTab === 'tasks' && (
        <TasksTab bootcampId={bootcamp.id} initialTasks={tasks} />
      )}
      {activeTab === 'sessions' && (
        <SessionsTab bootcampId={bootcamp.id} initialSessions={sessions} members={members} />
      )}
      {activeTab === 'recommendations' && (
        <RecommendationsTab bootcampId={bootcamp.id} mentorships={mentorships} />
      )}
      {activeTab === 'helpdesk' && (
        <HelpDeskTab bootcampId={bootcamp.id} initialTickets={helpTickets} />
      )}
    </PageShell>
  );
}

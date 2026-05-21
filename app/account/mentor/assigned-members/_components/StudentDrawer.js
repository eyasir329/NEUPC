'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Award, MessageSquare, CheckCircle2, Circle,
  TrendingUp, Star, BookOpen, Plus, Loader2,
} from 'lucide-react';
import { getMemberProgressAction, saveMentorNotesAction } from '@/app/_lib/mentor-actions';

const TABS = [
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'recommendation', label: 'Recommendation', icon: Star },
];

function currentMonthPeriod() {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

function monthRange(period) {
  try {
    const d = new Date(period + ' 1');
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { start, end };
  } catch {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
    };
  }
}

// ─── Progress log form ───────────────────────────────────────────────────────

function ProgressLogForm({ menteeId, onDone }) {
  const [period, setPeriod] = useState(currentMonthPeriod());
  const [problems, setProblems] = useState('');
  const [contests, setContests] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!period.trim()) { setError('Period is required'); return; }
    setSaving(true);
    setError(null);
    const { start, end } = monthRange(period);
    const fd = new FormData();
    fd.set('menteeId', menteeId);
    fd.set('period', period.trim());
    fd.set('start_date', start);
    fd.set('end_date', end);
    fd.set('problems_solved', problems || '0');
    fd.set('contests_participated', contests || '0');
    fd.set('mentor_notes', notes.trim());
    const result = await saveMentorNotesAction(fd);
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/6 bg-white/2 p-4">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">New Progress Entry</p>
      <div>
        <label className="mb-1 block text-xs text-gray-500">Period (e.g. May 2026)</label>
        <input
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/40"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Problems Solved</label>
          <input
            type="number" min="0"
            value={problems}
            onChange={(e) => setProblems(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Contests</label>
          <input
            type="number" min="0"
            value={contests}
            onChange={(e) => setContests(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/40"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did the mentee accomplish this month?"
          className="w-full resize-none rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/40"
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => onDone?.()} className="flex-1 rounded-lg border border-white/8 bg-white/2 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 rounded-lg bg-violet-500/15 border border-violet-500/30 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/25 transition-colors">
          {saving ? 'Saving…' : 'Save Entry'}
        </button>
      </div>
    </form>
  );
}

// ─── Recommendation form ─────────────────────────────────────────────────────

function RecommendationForm({ menteeId, currentNote, onDone }) {
  const [note, setNote] = useState(currentNote || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set('menteeId', menteeId);
    fd.set('period', 'Recommendation');
    fd.set('start_date', new Date().getFullYear() + '-01-01');
    fd.set('end_date', new Date().getFullYear() + '-12-31');
    fd.set('problems_solved', '0');
    fd.set('contests_participated', '0');
    fd.set('mentor_notes', note.trim());
    const result = await saveMentorNotesAction(fd);
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    onDone?.(note.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        rows={6}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write a recommendation covering this mentee's strengths, areas of improvement, and readiness for opportunities…"
        className="w-full resize-none rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500/40"
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => onDone?.()} className="flex-1 rounded-lg border border-white/8 bg-white/2 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 rounded-lg bg-amber-500/15 border border-amber-500/30 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 transition-colors">
          {saving ? 'Saving…' : 'Save Recommendation'}
        </button>
      </div>
    </form>
  );
}

// ─── Main drawer ─────────────────────────────────────────────────────────────

export function StudentDrawer({ student, onClose, lessonProgressMap }) {
  const [tab, setTab] = useState('syllabus');
  const [progress, setProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showRecForm, setShowRecForm] = useState(false);
  const [recNote, setRecNote] = useState(null);

  const menteeId = student?.user_id;

  useEffect(() => {
    if (!menteeId) return;
    setProgressLoading(true);
    getMemberProgressAction(menteeId).then(({ progress: p }) => {
      const entries = p || [];
      setProgress(entries.filter((e) => e.period !== 'Recommendation'));
      const rec = entries.find((e) => e.period === 'Recommendation');
      setRecNote(rec?.mentor_notes || null);
      setProgressLoading(false);
    });
  }, [menteeId]);

  if (!student) return null;

  const user = student.users;
  const name = user?.full_name || 'Candidate';
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const lessons = lessonProgressMap?.[student.user_id]?.curriculum?.courses?.flatMap((c) =>
    c.modules?.flatMap((m) => m.lessons || []) || []
  ) || [];
  const completedCount = lessons.filter((l) => l.progress?.is_completed).length;
  const pct = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100)
    : (student.finalPercent || 0);

  const totalProblems = progress.reduce((s, p) => s + (p.problems_solved || 0), 0);
  const totalContests = progress.reduce((s, p) => s + (p.contests_participated || 0), 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-[#0d1117] border-l border-white/6 shadow-2xl flex flex-col z-10 text-gray-300"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={name} className="w-9 h-9 rounded-lg object-cover border border-white/10" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center font-bold text-violet-400 text-sm">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white">{name}</p>
                <p className="text-xs text-gray-500 truncate max-w-55">{user?.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 divide-x divide-white/6 border-b border-white/6 shrink-0">
            {[
              { label: 'Progress', value: `${pct}%`, color: 'text-violet-400' },
              { label: 'Logs', value: progress.length, color: 'text-blue-400' },
              { label: 'Problems', value: totalProblems, color: 'text-emerald-400' },
              { label: 'Contests', value: totalContests, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="py-3 text-center">
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-white/6 shrink-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-b-2 border-violet-400 text-violet-300'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  {t.id === 'recommendation' && recNote && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-16">

            {/* Syllabus tab */}
            {tab === 'syllabus' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white/3 border border-white/6 p-2.5">
                    <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">Status</span>
                    <span className="text-white font-semibold capitalize">{student.status}</span>
                  </div>
                  <div className="rounded-lg bg-white/3 border border-white/6 p-2.5">
                    <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">Enrolled</span>
                    <span className="text-white font-semibold">{new Date(student.enrolled_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-1.5 px-0.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Lesson progress</span>
                    <span className="text-white font-semibold">{completedCount}/{lessons.length} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {lessons.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Syllabus Log</p>
                    {lessons.map((l) => {
                      const done = l.progress?.is_completed;
                      return (
                        <div key={l.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/6 bg-white/2 text-xs">
                          {done
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            : <Circle className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
                          <span className={done ? 'line-through text-gray-500' : 'text-gray-300'}>{l.title}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic text-center py-6">No lesson data</p>
                )}
              </div>
            )}

            {/* Progress tab */}
            {tab === 'progress' && (
              <div className="space-y-3">
                {progressLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                  </div>
                ) : (
                  <>
                    {!showProgressForm && (
                      <button
                        onClick={() => setShowProgressForm(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/2 py-2.5 text-xs font-semibold text-gray-400 hover:text-violet-300 hover:border-violet-500/30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Log Progress Entry
                      </button>
                    )}
                    {showProgressForm && (
                      <ProgressLogForm
                        menteeId={menteeId}
                        onDone={() => {
                          setShowProgressForm(false);
                          // Re-fetch progress after save
                          getMemberProgressAction(menteeId).then(({ progress: p }) => {
                            setProgress((p || []).filter((e) => e.period !== 'Recommendation'));
                          });
                        }}
                      />
                    )}
                    {progress.length === 0 && !showProgressForm && (
                      <p className="text-xs text-gray-500 italic text-center py-6">No progress logged yet.</p>
                    )}
                    {progress.map((p) => (
                      <div key={p.id} className="rounded-xl border border-white/6 bg-white/2 p-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-semibold text-white">{p.period}</p>
                          <div className="flex gap-3 text-xs">
                            <span className="text-blue-400">{p.problems_solved ?? 0} prob</span>
                            <span className="text-emerald-400">{p.contests_participated ?? 0} cont</span>
                          </div>
                        </div>
                        {p.mentor_notes && <p className="text-xs text-gray-400 leading-relaxed">{p.mentor_notes}</p>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Recommendation tab */}
            {tab === 'recommendation' && (
              <div className="space-y-3">
                {!showRecForm ? (
                  <>
                    {recNote ? (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {recNote}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic text-center py-6">No recommendation written yet.</p>
                    )}
                    <button
                      onClick={() => setShowRecForm(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {recNote ? 'Edit Recommendation' : 'Write Recommendation'}
                    </button>
                  </>
                ) : (
                  <RecommendationForm
                    menteeId={menteeId}
                    currentNote={recNote}
                    onDone={(saved) => {
                      setShowRecForm(false);
                      if (typeof saved === 'string') setRecNote(saved || null);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/6 bg-[#0d1117] px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] text-gray-600 font-mono">ID: {user?.id?.slice(0, 12)}…</span>
            <button onClick={onClose} className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/[0.08] border border-white/6 text-xs font-semibold text-gray-300 hover:text-white transition-colors">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

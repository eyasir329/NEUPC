'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, MessageSquare, CheckCircle2, Circle, Clock } from 'lucide-react';

export function StudentDrawer({ student, onClose, lessonProgressMap }) {
  if (!student) return null;

  const user = student.users;
  const name = user?.full_name || 'Candidate';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const lessons = lessonProgressMap?.[student.user_id]?.curriculum?.courses?.flatMap(c =>
    c.modules?.flatMap(m => m.lessons || []) || []
  ) || [];
  const completedCount = lessons.filter(l => l.progress?.is_completed).length;
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : (student.finalPercent || 0);

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
          className="relative w-full max-w-md bg-[#0d1117] border-l border-white/[0.06] shadow-2xl flex flex-col z-10 text-gray-300"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-400" />
                Mentorship Timeline
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Syllabus & milestone tracker</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-20">
            {/* Profile */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center gap-3">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center font-bold text-violet-400 text-sm">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                  <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">Status</span>
                  <span className="text-white font-semibold capitalize">{student.status}</span>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
                  <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">Enrolled</span>
                  <span className="text-white font-semibold">{new Date(student.enrolled_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span className="text-white font-semibold">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>

            {/* Lessons */}
            {lessons.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Syllabus Log</p>
                <div className="space-y-1.5">
                  {lessons.map(l => {
                    const done = l.progress?.is_completed;
                    return (
                      <div key={l.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs">
                        {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
                        <span className={done ? 'line-through text-gray-500' : 'text-gray-300'}>{l.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {student.finalNotes && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Mentor Notes
                </p>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {student.finalNotes}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] bg-[#0d1117] p-4 flex items-center justify-between">
            <span className="text-[10px] text-gray-600 font-mono">ID: {student.users?.id?.slice(0, 12)}…</span>
            <button onClick={onClose} className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-semibold text-gray-300 hover:text-white transition-colors">
              Close Panel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * @file Notes tab component
 * @module NotesTab
 */

'use client';
import {
  Check,
  Users,
  User,
  Sparkles,
  MessageSquarePlus,
  Lock,
  Globe,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const TABS = [
  { id: 'Personal', icon: User, label: 'My Notes' },
  { id: 'Club', icon: Users, label: 'Club Notes' },
];

export default function NotesTab({ note = '', onSaveNote, saving = false }) {
  const [viewMode, setViewMode] = useState('Personal');
  const [noteText, setNoteText] = useState(note);
  const [saveTimer, setSaveTimer] = useState(null);

  // Sync if parent note changes (e.g., different problem opened)
  useEffect(() => {
    setNoteText(note);
  }, [note]);

  const handleChange = (e) => {
    const val = e.target.value;
    setNoteText(val);
    if (onSaveNote) {
      clearTimeout(saveTimer);
      setSaveTimer(setTimeout(() => onSaveNote(val), 1500));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-white/[0.07] pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`relative mr-5 flex items-center gap-2 px-1 pb-3.5 text-xs font-medium tracking-wide transition-colors ${
                active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${active ? 'text-violet-400' : ''}`}
              />
              {tab.label}
              {active && (
                <motion.div
                  layoutId="notesTabIndicator"
                  className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-linear-to-r from-violet-500 to-purple-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Personal notes ──────────────────────────────────────────── */}
        {viewMode === 'Personal' && (
          <motion.div
            key="personal"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-zinc-900/60">
                  <Lock className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Personal Workspace
                  </h3>
                  <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    Private · Saved to DB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
                  {saving ? 'Saving...' : 'Auto-saved'}
                </span>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={noteText}
                onChange={handleChange}
                className="h-72 w-full resize-none rounded-xl border border-white/[0.07] bg-zinc-900/50 p-5 font-mono text-xs leading-relaxed text-zinc-300 shadow-inner transition-colors outline-none placeholder:text-zinc-600 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
                placeholder="Write your notes, approach ideas, or observations here..."
              />
              {noteText.length > 0 && (
                <div className="absolute right-3 bottom-3 font-mono text-[10px] text-zinc-600">
                  {noteText.length} chars
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div>
                <h4 className="mb-0.5 text-[10px] font-bold tracking-widest text-zinc-300 uppercase">
                  Privacy
                </h4>
                <p className="text-xs leading-relaxed text-zinc-500">
                  Personal notes are saved to the database (auto-saved after 1.5s of inactivity). Only visible to you.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Club notes ──────────────────────────────────────────────── */}
        {viewMode === 'Club' && (
          <motion.div
            key="club"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-zinc-900/60">
                  <Globe className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Club Collective
                  </h3>
                  <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    Shared with members
                  </p>
                </div>
              </div>
              <button
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/[0.07] bg-white/4 px-3.5 py-2 text-xs font-semibold text-zinc-500 opacity-50"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Contribute
              </button>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/[0.07] bg-zinc-900/40 py-16 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-zinc-800/60">
                <Users className="h-4 w-4 text-zinc-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-400">No club notes yet.</p>
                <p className="text-xs text-zinc-600">
                  Club discussion notes for specific problems are coming soon.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

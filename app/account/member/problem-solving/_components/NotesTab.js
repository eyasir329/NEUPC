/**
 * @file Notes tab component
 * @module NotesTab
 */

'use client';
import {
  Check,
  Users,
  User,
  Clock,
  Sparkles,
  MessageSquarePlus,
  Lock,
  Globe,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const CLUB_NOTES = [
  {
    id: 1,
    author: 'sarah_coder',
    role: 'Elite',
    content:
      "Remember that for Two Sum, the hash map approach only works if we don't need to worry about duplicate elements used twice. The problem guarantees exactly one solution, which simplifies things.",
    timestamp: '1 hour ago',
  },
  {
    id: 2,
    author: 'alex_dev',
    role: 'Member',
    content:
      'Using unordered_map in C++ is faster than map because it uses a hash table instead of a balanced tree. Important for competitive programming!',
    timestamp: '3 hours ago',
  },
  {
    id: 3,
    author: 'coder_pro',
    role: 'Member',
    content:
      "Always check for empty input array edge cases, even if the constraints say it won't happen. Good defensive practice.",
    timestamp: '1 day ago',
  },
];

const TABS = [
  { id: 'Personal', icon: User, label: 'My Notes' },
  { id: 'Club', icon: Users, label: 'Club Notes' },
];

export default function NotesTab() {
  const [viewMode, setViewMode] = useState('Personal');
  const [noteText, setNoteText] = useState('');

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

      {/* Tab content */}
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
            {/* Header */}
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
                    Private · Encrypted
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
                  Auto-saved
                </span>
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="h-72 w-full resize-none rounded-xl border border-white/[0.07] bg-zinc-900/50 p-5 font-mono text-xs leading-relaxed text-zinc-300 shadow-inner transition-colors outline-none placeholder:text-zinc-600 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
                placeholder="Write your notes, approach ideas, or observations here..."
              />
              {noteText.length > 0 && (
                <div className="absolute right-3 bottom-3 font-mono text-[10px] text-zinc-600">
                  {noteText.length} chars
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <button className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300 transition-all hover:border-violet-400/50 hover:bg-violet-500/20 hover:text-violet-200">
                <Check className="h-3.5 w-3.5" />
                Save Note
              </button>
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div>
                <h4 className="mb-0.5 text-[10px] font-bold tracking-widest text-zinc-300 uppercase">
                  Privacy
                </h4>
                <p className="text-xs leading-relaxed text-zinc-500">
                  Personal notes are private and never visible to other club
                  members. Only notes you post to the Club tab are shared.
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
            {/* Header */}
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
                    {CLUB_NOTES.length} contributions
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/4 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/7 hover:text-white">
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Contribute
              </button>
            </div>

            {/* Notes list */}
            <div className="space-y-3">
              {CLUB_NOTES.map((note, idx) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.18 }}
                  className="overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900/50 p-5"
                >
                  {/* Author row */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] bg-zinc-800">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white">
                          {note.author}
                        </span>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                            {note.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-zinc-900/60 px-2.5 py-1 font-mono text-[10px] text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {note.timestamp}
                    </div>
                  </div>

                  {/* Content */}
                  <blockquote className="border-l-2 border-violet-500/30 pl-4 text-sm leading-relaxed text-zinc-300">
                    {note.content}
                  </blockquote>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

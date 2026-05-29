/**
 * @file Advisory notes — strategic-guidance notepad for the advisor.
 *   Inline list of saved notes (mocked) plus a compact composer.
 *
 * @module AdvisorAdvisoryNotes
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Pin, Send, Plus } from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  ActionButton,
  Pill,
} from '@/app/account/_components/ui/dashboard';

const SEED_NOTES = [
  {
    id: 'n1',
    text: 'Encourage Executive to coordinate sponsor outreach two weeks before each major contest.',
    pinned: true,
    at: '2 days ago',
    tag: 'Strategy',
  },
  {
    id: 'n2',
    text: 'Revisit membership growth pacing — semester target on track but retention is the watch metric.',
    pinned: false,
    at: '1 week ago',
    tag: 'Membership',
  },
];

const TAG_TONE = {
  Strategy: 'violet',
  Membership: 'blue',
  Budget: 'emerald',
  Policy: 'rose',
};

export default function AdvisoryNotes() {
  const [notes, setNotes] = useState(SEED_NOTES);
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setNotes((prev) => [
      {
        id: `n${Date.now()}`,
        text: trimmed,
        pinned: false,
        at: 'just now',
        tag: 'Strategy',
      },
      ...prev,
    ]);
    setDraft('');
    setComposing(false);
  };

  return (
    <GlassCard>
      <SectionHeader
        icon={MessageSquare}
        title="Advisory Notes"
        subtitle="Guidance for the executive committee"
        accent="indigo"
        action={
          !composing && (
            <ActionButton
              tone="primary"
              icon={Plus}
              onClick={() => setComposing(true)}
            >
              New note
            </ActionButton>
          )
        }
      />

      <AnimatePresence initial={false}>
        {composing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/[0.05] p-3">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Strategic recommendation, semester planning note, or guidance…"
                rows={3}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500/50 focus:outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <ActionButton
                  tone="ghost"
                  onClick={() => {
                    setComposing(false);
                    setDraft('');
                  }}
                >
                  Cancel
                </ActionButton>
                <ActionButton tone="primary" icon={Send} onClick={handleSave}>
                  Save note
                </ActionButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {notes.length === 0 ? (
        <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center text-sm text-gray-500">
          No notes yet. Click <em>New note</em> to capture strategic guidance.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
            >
              {note.pinned && (
                <Pin className="absolute top-2.5 right-2.5 h-3 w-3 text-amber-400" />
              )}
              <p className="pr-6 text-sm text-gray-200">{note.text}</p>
              <div className="mt-2 flex items-center gap-2">
                <Pill tone={TAG_TONE[note.tag] ?? 'gray'}>{note.tag}</Pill>
                <span className="text-[11px] text-gray-500">{note.at}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

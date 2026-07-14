/**
 * @file Advisory notes — strategic-guidance notepad for the advisor.
 *   Notes are persisted to the advisor_notes table via server actions.
 *
 * @module AdvisorAdvisoryNotes
 */

'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Pin, PinOff, Send, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  GlassCard,
  SectionHeader,
  ActionButton,
  Pill,
} from '@/app/account/_components/ui';
import {
  createAdvisorNoteAction,
  toggleAdvisorNotePinAction,
  deleteAdvisorNoteAction,
} from '@/app/_lib/actions/advisor-actions';

const TAGS = ['Strategy', 'Membership', 'Budget', 'Policy'];

const TAG_TONE = {
  Strategy: 'violet',
  Membership: 'blue',
  Budget: 'emerald',
  Policy: 'rose',
};

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(s) || s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const days = Math.floor(s / 86400);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function sortNotes(list) {
  return [...list].sort(
    (a, b) =>
      (b.pinned === true) - (a.pinned === true) ||
      new Date(b.created_at) - new Date(a.created_at)
  );
}

export default function AdvisoryNotes({ initialNotes = [] }) {
  const [notes, setNotes] = useState(() => sortNotes(initialNotes));
  const [draft, setDraft] = useState('');
  const [tag, setTag] = useState('Strategy');
  const [composing, setComposing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set('text', trimmed);
    fd.set('tag', tag);
    startTransition(async () => {
      const res = await createAdvisorNoteAction(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setNotes((prev) => sortNotes([res.note, ...prev]));
      setDraft('');
      setComposing(false);
      toast.success('Note saved.');
    });
  };

  const handleTogglePin = (note) => {
    const fd = new FormData();
    fd.set('noteId', note.id);
    fd.set('pinned', String(!note.pinned));
    startTransition(async () => {
      const res = await toggleAdvisorNotePinAction(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setNotes((prev) =>
        sortNotes(
          prev.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
        )
      );
    });
  };

  const handleDelete = (note) => {
    const fd = new FormData();
    fd.set('noteId', note.id);
    startTransition(async () => {
      const res = await deleteAdvisorNoteAction(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      toast.success('Note deleted.');
    });
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
                maxLength={2000}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500/50 focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        tag === t
                          ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-200'
                          : 'border-white/10 bg-white/3 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    tone="ghost"
                    onClick={() => {
                      setComposing(false);
                      setDraft('');
                    }}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    tone="primary"
                    icon={Send}
                    onClick={handleSave}
                    disabled={isPending || !draft.trim()}
                  >
                    {isPending ? 'Saving…' : 'Save note'}
                  </ActionButton>
                </div>
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
              <p className="pr-6 text-sm wrap-break-word text-gray-200">
                {note.text}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Pill tone={TAG_TONE[note.tag] ?? 'gray'}>{note.tag}</Pill>
                <span className="text-[11px] text-gray-500">
                  {timeAgo(note.created_at)}
                </span>
                <span className="ml-auto flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(note)}
                    disabled={isPending}
                    title={note.pinned ? 'Unpin note' : 'Pin note'}
                    className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-amber-500/10 hover:text-amber-400"
                  >
                    {note.pinned ? (
                      <PinOff className="h-3.5 w-3.5" />
                    ) : (
                      <Pin className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    disabled={isPending}
                    title="Delete note"
                    className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

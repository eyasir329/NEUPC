/**
 * @file Per-lesson notes editor panel.
 * @module NotesPanel
 */

'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { CheckCircle2, Eye, Loader2, Maximize2, Minimize2, Pencil, StickyNote } from 'lucide-react';
import { saveLessonNotes } from '@/app/_lib/actions/bootcamp-actions';
import { MarkdownDesc } from './learning-shared';

function NotesPanel({ lessonId, initialNotes, onSave, isArchived = false }) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);
  const lastSavedRef = useRef(initialNotes || '');
  const prevLessonRef = useRef(lessonId);
  const notesRef = useRef(notes);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // On lesson change: flush unsaved diff for previous lesson, then load new
  useEffect(() => {
    const prevLessonId = prevLessonRef.current;
    if (!isArchived && prevLessonId && prevLessonId !== lessonId) {
      const pending = notesRef.current;
      if (pending !== lastSavedRef.current && onSave) {
        onSave(prevLessonId, pending).catch(() => {});
      }
    }
    prevLessonRef.current = lessonId;
    setNotes(initialNotes || '');
    lastSavedRef.current = initialNotes || '';
    setIsEditing(false);
    setIsExpanded(false);
  }, [lessonId, initialNotes, onSave, isArchived]);

  const handleSave = useCallback(() => {
    if (isArchived) return;
    startSaving(async () => {
      try {
        if (onSave) await onSave(lessonId, notes);
        else await saveLessonNotes(lessonId, notes);
        lastSavedRef.current = notes;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {}
    });
  }, [lessonId, notes, onSave, isArchived]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/2 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5 text-yellow-400" />
          <h3 className="text-[13px] font-semibold text-white">My Notes</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-gray-300 transition-all hover:bg-white/10"
            title={isExpanded ? 'Collapse Notes' : 'Expand Notes'}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-orange-400" />
                Collapse
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                Expand
              </>
            )}
          </button>

          {!isArchived &&
            (isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-gray-300 transition-all hover:bg-white/10"
                title="Preview Notes"
              >
                <Eye className="h-3.5 w-3.5 text-blue-400" />
                Preview
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-gray-300 transition-all hover:bg-white/10"
                title="Edit Notes"
              >
                <Pencil className="h-3.5 w-3.5 text-yellow-400" />
                Edit
              </button>
            ))}

          {!isArchived && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#8083ff]/10 px-3 py-1.5 text-[11px] font-medium text-[#c0c1ff] transition-all hover:bg-[#8083ff]/20 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : saved ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Saved
                </>
              ) : (
                'Save'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Body Content Mode */}
      {!isEditing ? (
        <div
          className={`spa-scroll px-4 py-3 text-sm text-gray-300 transition-all duration-300 ${
            isExpanded
              ? 'h-auto min-h-[400px] overflow-y-visible'
              : 'max-h-[300px] min-h-[116px] overflow-y-auto'
          }`}
        >
          {notes ? (
            <MarkdownDesc
              text={notes}
              className="[&_p]:text-[13px] [&_p]:leading-relaxed [&_p]:text-gray-300"
            />
          ) : (
            <p className="text-[13px] text-gray-500 italic">
              No notes taken yet. Click the edit icon to write notes in Markdown
              format...
            </p>
          )}
        </div>
      ) : (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Take notes while watching (supports Markdown)…"
          className={`spa-scroll w-full resize-none border-t border-white/5 bg-transparent px-4 py-3 text-sm text-white placeholder-gray-600 transition-all duration-300 focus:outline-none ${
            isExpanded ? 'h-auto min-h-[650px]' : 'min-h-[116px]'
          }`}
          rows={isExpanded ? 25 : 4}
          autoFocus
        />
      )}
    </div>
  );
}

// ─── Table of Contents ────────────────────────────────────────────────────────


export { NotesPanel };

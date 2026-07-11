/**
 * @file Lesson fullscreen editor modal component
 * @module LessonFullscreenEditorModal
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Play,
  Save,
  Loader2,
  BookOpen,
  ChevronRight,
  AlertCircle,
  Star,
  ExternalLink,
  Video,
  Code,
  Copy,
  CheckSquare,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import LessonContentRenderer from '@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer';
import VideoPlayer from '@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/VideoPlayer';
import MultiBlockEditor from './MultiBlockEditor';
import { generatePracticeProblemsAction } from '@/app/_lib/actions/bootcamp-actions';
import MarkdownPreview from '@/app/_components/markdown/MarkdownPreview';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LessonFullscreenEditorModal({
  lessonId,
  form,
  contentRef,
  set,
  handleChange,
  handleContentChange,
  errors,
  durationMins,
  handleSave,
  saving,
  onClose,
  syllabusUI,
  lessonSerial,
}) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow || 'auto';
      };
    }
  }, []);

  // Local preview state so the right-pane preview updates as the user edits.
  const [previewContent, setPreviewContent] = useState(contentRef.current);

  const [openAiProblemsImport, setOpenAiProblemsImport] = useState(false);
  const [aiProblemsInput, setAiProblemsInput] = useState('');
  const [generatingProblems, setGeneratingProblems] = useState(false);

  const contentHasPractice = useMemo(() => {
    if (!previewContent) return false;
    try {
      const parsed =
        typeof previewContent === 'string'
          ? JSON.parse(previewContent)
          : previewContent;
      return Array.isArray(parsed) && parsed.some((b) => b.type === 'practice');
    } catch {
      return false;
    }
  }, [previewContent]);

  const handleContentChangeWithPreview = useCallback(
    (val) => {
      handleContentChange(val);
      setPreviewContent(val);
    },
    [handleContentChange]
  );

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex flex-col overflow-hidden bg-[#080b11]">
      {/* Header */}
      <div className="z-50 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0d1117] px-4 py-3 shadow-md sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleClose}
            className="group flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white sm:h-10 sm:w-10"
          >
            <X className="h-4 w-4 transition-transform group-hover:scale-110 sm:h-5 sm:w-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-blue-500/20 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
                Fullscreen Mode
              </span>
              <span className="hidden text-sm font-semibold text-white sm:inline">
                {form.title || 'Untitled Lesson'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-white/10 px-5 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5"
          >
            Exit Fullscreen
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Main split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Leftmost Side: Syllabus */}
        <div className="custom-scrollbar flex w-80 shrink-0 flex-col gap-4 overflow-x-hidden overflow-y-auto border-r border-white/10 bg-[#010f1f] p-4 lg:w-96 lg:p-6 xl:w-md 2xl:w-lg">
          {syllabusUI}
        </div>

        {/* Middle Side: Editor */}
        <div className="custom-scrollbar min-w-0 flex-3 overflow-x-hidden overflow-y-auto border-r border-white/10 bg-[#0a0d14] p-6 lg:p-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-20">
            {/* Header card */}
            <div className="flex flex-col gap-4 rounded-xl border border-[#464554] bg-[#010f1f] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-[#908fa0] uppercase">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className={`w-full border-0 border-b-2 bg-transparent px-0 py-1 text-2xl font-bold text-[#d4e4fa] transition-colors outline-none focus:ring-0 ${
                      errors.title
                        ? 'border-red-500'
                        : 'border-[#464554] focus:border-[#c0c1ff]'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="h-3 w-3" /> {errors.title}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3 pt-6">
                  <span className="text-sm font-medium text-[#908fa0]">
                    Status:
                  </span>
                  <div className="relative">
                    <select
                      value={form.is_published ? 'Published' : 'Draft'}
                      onChange={(e) =>
                        set('is_published', e.target.value === 'Published')
                      }
                      className="cursor-pointer appearance-none rounded-lg border border-[#464554] bg-[#0d1c2d] py-2 pr-9 pl-4 text-sm font-semibold text-[#d4e4fa] outline-none focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]"
                    >
                      <option>Published</option>
                      <option>Draft</option>
                    </select>
                    <ChevronRight className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 rotate-90 text-[#908fa0]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-[#908fa0] uppercase">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={durationMins}
                    onChange={(e) =>
                      set('duration', (parseInt(e.target.value) || 0) * 60)
                    }
                    min="0"
                    className="w-24 rounded-lg border border-[#464554] bg-[#051424] px-3 py-2 text-sm text-[#d4e4fa] outline-none focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-[#908fa0] uppercase">
                    Weight
                  </label>
                  <input
                    type="number"
                    value={form.weight ?? 1}
                    onChange={(e) =>
                      set('weight', Math.max(0, parseInt(e.target.value) || 0))
                    }
                    min="0"
                    title="Progress weight. Higher values count more toward the member's overall progress percentage."
                    className="w-20 rounded-lg border border-[#464554] bg-[#051424] px-3 py-2 text-sm text-[#d4e4fa] outline-none focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-[#908fa0] uppercase">
                    Points
                  </label>
                  <input
                    type="number"
                    value={form.points ?? 10}
                    onChange={(e) =>
                      set('points', Math.max(0, parseInt(e.target.value) || 0))
                    }
                    min="0"
                    title="Points / Max Score for this lesson on the leaderboard standings."
                    className="w-20 rounded-lg border border-[#464554] bg-[#051424] px-3 py-2 text-sm text-[#d4e4fa] outline-none focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]"
                  />
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      checked={form.is_free_preview}
                      onChange={(e) => set('is_free_preview', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="relative h-5 w-9 rounded-full bg-[#273647] transition-colors peer-checked:bg-[#8083ff]/40 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-[#908fa0] after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-[#c0c1ff]" />
                    <span className="text-sm text-[#908fa0]">Free Preview</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Notes / content block */}
            <div className="group relative rounded-xl border border-[#464554] bg-[#010f1f]">
              <div className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[#122131] p-2 text-[#d4e4fa]">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <h4 className="text-base font-semibold text-[#d4e4fa]">
                    {form.type === 'practice'
                      ? 'Practice Notes'
                      : form.type === 'exam'
                        ? 'Exam Guidelines / Prompt'
                        : 'Lesson Notes'}
                  </h4>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold tracking-wider text-[#908fa0] uppercase">
                    {form.type === 'practice'
                      ? 'Practice Content Blocks'
                      : form.type === 'exam'
                        ? 'Exam Content Blocks'
                        : 'Lesson Content Blocks'}
                  </label>
                  <div className="overflow-hidden rounded-lg">
                    <MultiBlockEditor
                      value={contentRef.current}
                      onChange={handleContentChangeWithPreview}
                      lessonSerial={lessonSerial}
                      lessonTitle={form.title}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Practice Problems builder */}
            {form.type === 'practice' && (
              <div className="flex flex-col gap-6 rounded-xl border border-[#464554] bg-[#010f1f] p-6">
                <div className="flex items-center justify-between border-b border-[#464554] pb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-violet-400" />
                    <h4 className="text-base font-semibold text-[#d4e4fa]">
                      Practice Problems ({form.practice_problems?.length || 0})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenAiProblemsImport(true)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Import with AI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newProblems = [
                          ...(form.practice_problems || []),
                          {
                            id:
                              typeof crypto !== 'undefined' && crypto.randomUUID
                                ? crypto.randomUUID()
                                : Math.random().toString(36).substring(2),
                            name: '',
                            source: '',
                            url: '',
                            video_url: '',
                            editorial: '',
                            solution_code: '',
                          },
                        ];
                        set('practice_problems', newProblems);
                      }}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Problem
                    </button>
                  </div>
                </div>

                {(!form.practice_problems ||
                  form.practice_problems.length === 0) && (
                  <div className="py-6 text-center text-sm text-[#908fa0] italic">
                    No practice problems added yet. Click &quot;Add
                    Problem&quot; to start building your practice list.
                  </div>
                )}

                <div className="space-y-6">
                  {(form.practice_problems || []).map((p, pIdx) => (
                    <div
                      key={p.id || pIdx}
                      className="group relative flex flex-col gap-4 rounded-lg border border-[#464554] bg-[#051424] p-5 text-left"
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        {/* Reorder Buttons */}
                        <button
                          type="button"
                          disabled={pIdx === 0}
                          onClick={() => {
                            const newProblems = [...form.practice_problems];
                            const temp = newProblems[pIdx];
                            newProblems[pIdx] = newProblems[pIdx - 1];
                            newProblems[pIdx - 1] = temp;
                            set('practice_problems', newProblems);
                          }}
                          className="cursor-pointer p-1 text-gray-500 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={pIdx === form.practice_problems.length - 1}
                          onClick={() => {
                            const newProblems = [...form.practice_problems];
                            const temp = newProblems[pIdx];
                            newProblems[pIdx] = newProblems[pIdx + 1];
                            newProblems[pIdx + 1] = temp;
                            set('practice_problems', newProblems);
                          }}
                          className="cursor-pointer p-1 text-gray-500 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newProblems = form.practice_problems.filter(
                              (_, idx) => idx !== pIdx
                            );
                            set('practice_problems', newProblems);
                          }}
                          className="ml-2 cursor-pointer p-1 text-gray-500 transition-colors hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                          {pIdx + 1}
                        </span>
                        <span className="text-xs font-semibold tracking-wider text-[#908fa0] uppercase">
                          Problem {pIdx + 1}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold tracking-wider text-[#908fa0] uppercase">
                          Problem Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={p.name || ''}
                          onChange={(e) => {
                            const newProblems = [...form.practice_problems];
                            newProblems[pIdx] = {
                              ...newProblems[pIdx],
                              name: e.target.value,
                            };
                            set('practice_problems', newProblems);
                          }}
                          placeholder="e.g. Watermelon, Two Sum, etc."
                          className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-2 text-sm text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                        />
                      </div>

                      {/* Row: Source Platform, Problem Link, Video Solution Link */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Source Platform */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold tracking-wider text-[#908fa0] uppercase">
                            Platform
                          </label>
                          <input
                            type="text"
                            value={p.source || ''}
                            onChange={(e) => {
                              const newProblems = [...form.practice_problems];
                              newProblems[pIdx] = {
                                ...newProblems[pIdx],
                                source: e.target.value,
                              };
                              set('practice_problems', newProblems);
                            }}
                            placeholder="e.g. Codeforces, LeetCode"
                            className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-2 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                          />
                        </div>

                        {/* Problem Link */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold tracking-wider text-[#908fa0] uppercase">
                            Problem URL / Link
                          </label>
                          <input
                            type="url"
                            value={p.url || ''}
                            onChange={(e) => {
                              const newProblems = [...form.practice_problems];
                              newProblems[pIdx] = {
                                ...newProblems[pIdx],
                                url: e.target.value,
                              };
                              set('practice_problems', newProblems);
                            }}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-2 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                          />
                        </div>

                        {/* Video Solution Link */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold tracking-wider text-[#908fa0] uppercase">
                            Video Solution URL
                          </label>
                          <input
                            type="url"
                            value={p.video_url || ''}
                            onChange={(e) => {
                              const newProblems = [...form.practice_problems];
                              newProblems[pIdx] = {
                                ...newProblems[pIdx],
                                video_url: e.target.value,
                              };
                              set('practice_problems', newProblems);
                            }}
                            placeholder="https://youtube.com/..."
                            className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-2 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                          />
                        </div>
                      </div>

                      {/* Editorial */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold tracking-wider text-[#908fa0] uppercase">
                          Editorial / Explanation
                        </label>
                        <textarea
                          value={p.editorial || ''}
                          onChange={(e) => {
                            const newProblems = [...form.practice_problems];
                            newProblems[pIdx] = {
                              ...newProblems[pIdx],
                              editorial: e.target.value,
                            };
                            set('practice_problems', newProblems);
                          }}
                          rows={4}
                          placeholder="Explain the logic, math, constraints, or step-by-step solution... (Markdown & math formulas supported)"
                          className="w-full resize-y rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-2 font-sans text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                        />
                        {p.editorial && (
                          <div className="mt-2 rounded-lg border border-violet-500/10 bg-[#05111d] p-3">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-extrabold tracking-widest text-violet-400 uppercase">
                              <Sparkles className="h-3 w-3" /> Live Markdown &
                              Formula Preview
                            </div>
                            <MarkdownPreview text={p.editorial} />
                          </div>
                        )}
                      </div>

                      {/* Solution Code */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold tracking-wider text-[#908fa0] uppercase">
                          Solution Code
                        </label>
                        <textarea
                          value={p.solution_code || ''}
                          onChange={(e) => {
                            const newProblems = [...form.practice_problems];
                            newProblems[pIdx] = {
                              ...newProblems[pIdx],
                              solution_code: e.target.value,
                            };
                            set('practice_problems', newProblems);
                          }}
                          rows={6}
                          placeholder="// Write your clean, commented C++, Python, or Java solution code here..."
                          className="w-full resize-y rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-2 font-mono text-xs text-emerald-300 outline-none focus:border-[#c0c1ff]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rightmost Side: Preview */}
        <div className="custom-scrollbar min-w-0 flex-2 overflow-x-hidden overflow-y-auto bg-[#080b11] p-6 lg:p-8">
          <div className="mx-auto max-w-3xl pb-20">
            {/* Title */}
            <h1 className="mb-4 text-2xl leading-tight font-extrabold tracking-tight text-white lg:text-3xl">
              {form.title || 'Lesson Title'}
            </h1>
            {form.duration > 0 && (
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
                <Clock className="h-4 w-4 text-violet-400" />
                {formatDuration(form.duration)}
              </div>
            )}

            {/* Legacy Global Video Player (if any) */}
            {form.video_source && form.video_source !== 'none' && (
              <div className="mb-4">
                <VideoPlayer lesson={form} />
              </div>
            )}

            {/* Content Blocks — no wrapping styles */}
            {previewContent ? (
              <LessonContentRenderer
                content={previewContent}
                lessonId={lessonId}
                practiceProblemsComponent={(problems) => (
                  <PracticeProblemsPreviewCockpit problems={problems} />
                )}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/2 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Play className="h-8 w-8 text-gray-500" />
                </div>
                <p className="font-medium text-gray-400">
                  No content added yet.
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Add text, HTML, markdown, or video blocks in the editor.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {openAiProblemsImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#464554] bg-[#051424] shadow-2xl duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#464554] bg-[#010f1f] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    AI Practice Problems Generator
                  </h3>
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    Paste raw text, URLs, sheet descriptions, or YouTube links
                    to automatically format practice problems.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenAiProblemsImport(false)}
                className="cursor-pointer text-gray-400 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6 text-left">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Raw Practice Problems Data Input
                </label>
                <p className="text-[10px] leading-normal text-gray-500">
                  Our model will parse problem name, platform source, direct
                  workspace link, YouTube video solution, step-by-step markdown
                  editorials, and code templates automatically. Example input:
                </p>
                <div className="rounded-lg border border-white/5 bg-black/35 p-2.5 font-mono text-[9px] whitespace-pre text-[#908fa0]">
                  {`1. Two Sum (https://leetcode.com/problems/two-sum)
Video Solution: https://youtube.com/watch?v=WY
Editorial: Use a hashmap to store seen values for O(n) lookup.
Code:
class Solution {
    public int[] twoSum(int[] nums, int target) { ... }
}`}
                </div>
              </div>

              <textarea
                value={aiProblemsInput}
                onChange={(e) => setAiProblemsInput(e.target.value)}
                placeholder="Paste your unstructured practice problems text, list, or description here..."
                rows={10}
                className="min-h-[160px] w-full resize-y rounded-xl border border-[#464554] bg-[#0d1c2d] px-3 py-2.5 text-xs text-white placeholder-gray-600 transition-all outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-[#464554] bg-[#010f1f] px-6 py-4">
              <button
                type="button"
                onClick={() => setOpenAiProblemsImport(false)}
                className="rounded-xl border border-[#464554] px-4 py-2 text-xs font-semibold text-[#d4e4fa] transition-all hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={generatingProblems || !aiProblemsInput.trim()}
                onClick={async () => {
                  setGeneratingProblems(true);
                  try {
                    const res =
                      await generatePracticeProblemsAction(aiProblemsInput);
                    if (res.error) {
                      toast.error(res.error);
                      return;
                    }
                    if (res.success && Array.isArray(res.problems)) {
                      const mergedProblems = [
                        ...(form.practice_problems || []),
                        ...res.problems,
                      ];
                      set('practice_problems', mergedProblems);
                      setOpenAiProblemsImport(false);
                      toast.success(
                        `Successfully parsed and added ${res.problems.length} practice problems!`
                      );
                    }
                  } catch (err) {
                    toast.error(
                      'AI problem generation failed. Try checking your format.'
                    );
                  } finally {
                    setGeneratingProblems(false);
                  }
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/10 transition-all hover:from-violet-500 hover:to-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingProblems ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    AI is Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate & Format Problems
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PracticeProblemsPreviewCockpit({ problems }) {
  const [selectedProblem, setSelectedProblem] = useState(null); // { problem, pIdx }
  const [modalTab, setModalTab] = useState('editorial'); // 'editorial' | 'solution'
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [bookmarkedProblems, setBookmarkedProblems] = useState([]);

  if (!problems || problems.length === 0) {
    return (
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-dashed border-teal-500/20 bg-teal-500/[0.01] p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/5">
          <BookOpen className="h-6 w-6 text-teal-400" />
        </div>
        <h4 className="text-sm font-bold text-white">
          Practice Problems Cockpit
        </h4>
        <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
          No practice problems configured yet. Use the practice problem builder
          on the left to add your first contest or problem sheet!
        </p>
      </div>
    );
  }

  const getPlatformName = (sourceStr) => {
    if (!sourceStr) return '—';
    if (sourceStr.startsWith('http')) {
      try {
        const url = new URL(sourceStr);
        const host = url.hostname.replace('www.', '');
        return host.split('.')[0].toUpperCase();
      } catch {
        return 'LINK';
      }
    }
    const parts = sourceStr.split(/\s*-\s*/);
    return parts[0] || '—';
  };

  const handleCopyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="mt-8 flex flex-col gap-5 text-left">
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/10 bg-linear-to-br from-teal-500/[0.03] to-transparent p-5">
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-teal-400 uppercase">
              Practice Cockpit Preview
            </span>
            <h4 className="mt-1.5 text-sm font-bold text-white">
              Practice Problems Table
            </h4>
          </div>
          <span className="shrink-0 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-300">
            {problems.length} Problems
          </span>
        </div>

        <div className="custom-scrollbar overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/20">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <th className="w-12 p-3 text-center">Solved</th>
                <th className="w-12 p-3 text-center">Star</th>
                <th className="min-w-[150px] p-3">Problem Name</th>
                <th className="w-12 p-3 text-center">Link</th>
                <th className="w-12 p-3 text-center">Editorial</th>
                <th className="w-12 p-3 text-center">Video</th>
                <th className="w-12 p-3 text-center">Code</th>
                <th className="w-20 p-3 text-center">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {problems.map((p, pIdx) => {
                const isBookmarked = bookmarkedProblems.includes(pIdx);
                const workspaceUrl = p.url
                  ? p.url
                  : p.source?.startsWith('http')
                    ? p.source
                    : `https://vjudge.net/problem/${encodeURIComponent(p.source || p.name)}`;

                const videoUrl = p.video_url
                  ? p.video_url
                  : `https://www.youtube.com/results?search_query=${encodeURIComponent(p.name + ' ' + (p.source || '') + ' solution')}`;

                return (
                  <tr
                    key={p.id || pIdx}
                    className="transition-colors hover:bg-white/[0.01]"
                  >
                    {/* Solved Checkbox */}
                    <td className="p-3 text-center">
                      <div className="mx-auto flex h-4 w-4 items-center justify-center rounded border border-[#464554] bg-transparent text-gray-500" />
                    </td>

                    {/* Bookmark Star */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setBookmarkedProblems((prev) =>
                            isBookmarked
                              ? prev.filter((idx) => idx !== pIdx)
                              : [...prev, pIdx]
                          );
                        }}
                        className="group mx-auto flex h-6 w-6 cursor-pointer items-center justify-center transition-transform hover:scale-110 active:scale-90"
                      >
                        <Star
                          className={`h-4 w-4 transition-colors ${
                            isBookmarked
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.4)] filter'
                              : 'text-zinc-600 group-hover:text-zinc-400'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Problem Name */}
                    <td className="p-3">
                      <a
                        href={workspaceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-white transition-colors hover:text-teal-400 hover:underline"
                      >
                        {p.name || `Problem ${pIdx + 1}`}
                      </a>
                    </td>

                    {/* Workspace Solve Link */}
                    <td className="p-3 text-center">
                      <a
                        href={workspaceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-auto flex h-6 w-6 items-center justify-center rounded border border-teal-500/10 bg-teal-500/10 p-1.5 text-teal-300 transition-all hover:bg-teal-500/20"
                        title="Open Solve Workspace"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>

                    {/* Editorial Toggle */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        disabled={!p.editorial}
                        onClick={() => {
                          setSelectedProblem({ problem: p, pIdx });
                          setModalTab('editorial');
                        }}
                        className={`mx-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded border p-1.5 transition-all ${
                          !p.editorial
                            ? 'cursor-not-allowed border-white/5 bg-zinc-800/20 text-gray-600 opacity-20'
                            : 'border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white'
                        }`}
                        title={p.editorial ? 'View Editorial' : 'No Editorial'}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                      </button>
                    </td>

                    {/* Video Link */}
                    <td className="p-3 text-center">
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-auto flex h-6 w-6 items-center justify-center rounded border border-red-500/10 bg-red-500/10 p-1.5 text-red-300 transition-all hover:bg-red-500/20"
                        title={
                          p.video_url
                            ? 'Watch Video Solution'
                            : 'Search Video Solution on YouTube'
                        }
                      >
                        <Video className="h-3.5 w-3.5" />
                      </a>
                    </td>

                    {/* Code Toggle */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        disabled={!p.solution_code}
                        onClick={() => {
                          setSelectedProblem({ problem: p, pIdx });
                          setModalTab('solution');
                        }}
                        className={`mx-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded border p-1.5 transition-all ${
                          !p.solution_code
                            ? 'cursor-not-allowed border-white/5 bg-zinc-800/20 text-gray-600 opacity-20'
                            : 'border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white'
                        }`}
                        title={
                          p.solution_code ? 'View Solution Code' : 'No Code'
                        }
                      >
                        <Code className="h-3.5 w-3.5" />
                      </button>
                    </td>

                    {/* Source Name Platform */}
                    <td className="p-3 text-center">
                      <div
                        className="inline-block max-w-[80px] truncate rounded border border-teal-500/10 bg-[#16222f] px-2 py-0.5 text-center text-[9px] font-extrabold tracking-widest text-teal-300 uppercase"
                        title={p.source}
                      >
                        {getPlatformName(p.source)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Practice Problem Solution Preview Modal */}
      {selectedProblem &&
        (() => {
          const p = selectedProblem.problem;
          const pIdx = selectedProblem.pIdx;

          return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
              <div className="animate-in fade-in zoom-in-95 flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-teal-500/25 bg-[#05111d] shadow-2xl duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-[#010f1f] px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="truncate rounded border border-teal-500/10 bg-[#16222f] px-2.5 py-1 text-[10px] font-extrabold tracking-widest text-teal-300 uppercase">
                      {getPlatformName(p.source)}
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {p.name || `Problem ${pIdx + 1}`}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProblem(null)}
                    className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-1 text-gray-400 transition-colors hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Tab Selector Bar */}
                <div className="flex items-center gap-2 border-b border-white/5 bg-[#020b15] px-5 py-1">
                  {p.editorial && (
                    <button
                      type="button"
                      onClick={() => setModalTab('editorial')}
                      className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
                        modalTab === 'editorial'
                          ? 'border-teal-400 bg-teal-500/5 text-teal-300'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                      Editorial / Explanation
                    </button>
                  )}
                  {p.solution_code && (
                    <button
                      type="button"
                      onClick={() => setModalTab('solution')}
                      className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-all ${
                        modalTab === 'solution'
                          ? 'border-teal-400 bg-teal-500/5 text-teal-300'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <Code className="h-4 w-4" />
                      Solution Code
                    </button>
                  )}
                </div>

                {/* Modal Content Body */}
                <div className="flex-1 overflow-y-auto bg-zinc-950/20 p-5 text-left">
                  {modalTab === 'editorial' && p.editorial && (
                    <div className="rounded-xl border border-white/5 bg-zinc-950/30 p-4 leading-relaxed">
                      <MarkdownPreview
                        text={p.editorial}
                        className="prose prose-invert max-w-none text-xs text-gray-300"
                      />
                    </div>
                  )}

                  {modalTab === 'solution' && p.solution_code && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold tracking-widest text-teal-400 uppercase">
                          Clean Code Solution
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(p.solution_code, pIdx)}
                          className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-gray-300 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
                        >
                          {copiedIdx === pIdx ? (
                            <>
                              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy Code
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="custom-scrollbar overflow-x-auto rounded-xl border border-white/5 bg-zinc-950 p-4 font-mono text-xs text-emerald-300">
                        <code>{p.solution_code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// MarkdownPreview is now imported from @/app/_components/markdown/MarkdownPreview
// (canonical implementation shared with CurriculumBuilder). The .md-preview
// CSS class has been migrated to global.css under the .admin-preview scope.

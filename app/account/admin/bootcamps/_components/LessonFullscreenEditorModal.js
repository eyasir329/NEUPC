'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Clock, Play, Save, Loader2, BookOpen, ChevronRight, AlertCircle, Star, ExternalLink, Video, Code, Copy, CheckSquare, ChevronUp, ChevronDown, Trash2, Plus, Sparkles } from 'lucide-react';
import LessonContentRenderer from '@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer';
import VideoPlayer from '@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/VideoPlayer';
import MultiBlockEditor from './MultiBlockEditor';
import { marked } from 'marked';
import { generatePracticeProblemsAction } from '@/app/_lib/bootcamp-actions';

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

  const contentHasPractice = useMemo(() => {
    if (!previewContent) return false;
    try {
      const parsed = typeof previewContent === 'string' ? JSON.parse(previewContent) : previewContent;
      return Array.isArray(parsed) && parsed.some(b => b.type === 'practice');
    } catch { return false; }
  }, [previewContent]);



  const handleContentChangeWithPreview = useCallback((val) => {
    handleContentChange(val);
    setPreviewContent(val);
  }, [handleContentChange]);

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-[#080b11] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#0d1117] px-4 py-3 sm:px-6 sm:py-4 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleClose}
            className="group flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                Fullscreen Mode
              </span>
              <span className="text-sm font-semibold text-white hidden sm:inline">
                {form.title || 'Untitled Lesson'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-xl border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/5 transition-colors"
          >
            Exit Fullscreen
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-500/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Main split view */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Leftmost Side: Syllabus */}
        <div className="w-80 lg:w-96 xl:w-md 2xl:w-lg shrink-0 overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#010f1f] p-4 lg:p-6 flex flex-col gap-4 custom-scrollbar">
          {syllabusUI}
        </div>

        {/* Middle Side: Editor */}
        <div className="flex-3 min-w-0 overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#0a0d14] p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-20">
            {/* Header card */}
            <div className="bg-[#010f1f] rounded-xl border border-[#464554] p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-semibold text-[#908fa0] tracking-wider uppercase block mb-1">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className={`w-full text-2xl font-bold text-[#d4e4fa] bg-transparent border-0 border-b-2 focus:ring-0 px-0 py-1 outline-none transition-colors ${
                      errors.title ? 'border-red-500' : 'border-[#464554] focus:border-[#c0c1ff]'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 pt-6 shrink-0">
                  <span className="text-sm text-[#908fa0] font-medium">Status:</span>
                  <div className="relative">
                    <select
                      value={form.is_published ? 'Published' : 'Draft'}
                      onChange={(e) => set('is_published', e.target.value === 'Published')}
                      className="appearance-none bg-[#0d1c2d] border border-[#464554] text-[#d4e4fa] text-sm font-semibold rounded-lg pl-4 pr-9 py-2 focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] outline-none cursor-pointer"
                    >
                      <option>Published</option>
                      <option>Draft</option>
                    </select>
                    <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#908fa0] pointer-events-none h-4 w-4 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <label className="text-xs font-semibold text-[#908fa0] tracking-wider uppercase block mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={durationMins}
                    onChange={(e) => set('duration', (parseInt(e.target.value) || 0) * 60)}
                    min="0"
                    className="w-24 bg-[#051424] border border-[#464554] rounded-lg px-3 py-2 text-sm text-[#d4e4fa] focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#908fa0] tracking-wider uppercase block mb-1">
                    Weight
                  </label>
                  <input
                    type="number"
                    value={form.weight ?? 1}
                    onChange={(e) => set('weight', Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    title="Progress weight. Higher values count more toward the member's overall progress percentage."
                    className="w-20 bg-[#051424] border border-[#464554] rounded-lg px-3 py-2 text-sm text-[#d4e4fa] focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_free_preview}
                      onChange={(e) => set('is_free_preview', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 rounded-full bg-[#273647] peer-checked:bg-[#8083ff]/40 transition-colors after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-[#908fa0] after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-[#c0c1ff]" />
                    <span className="text-sm text-[#908fa0]">Free Preview</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Notes / content block */}
            <div className="bg-[#010f1f] rounded-xl border border-[#464554] relative group">
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="bg-[#122131] text-[#d4e4fa] p-2 rounded-lg">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <h4 className="text-base font-semibold text-[#d4e4fa]">
                    {form.type === 'practice' ? 'Practice Notes' : form.type === 'exam' ? 'Exam Guidelines / Prompt' : 'Lesson Notes'}
                  </h4>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#908fa0] tracking-wider uppercase block mb-1">
                    {form.type === 'practice' ? 'Practice Content Blocks' : form.type === 'exam' ? 'Exam Content Blocks' : 'Lesson Content Blocks'}
                  </label>
                  <div className="rounded-lg overflow-hidden">
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
            {false && (
              <div className="bg-[#010f1f] rounded-xl border border-[#464554] p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-[#464554] pb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-violet-400" />
                    <h4 className="text-base font-semibold text-[#d4e4fa]">Practice Problems ({form.practice_problems?.length || 0})</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenAiProblemsImport(true)}
                      className="px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                            name: '',
                            source: '',
                            url: '',
                            video_url: '',
                            editorial: '',
                            solution_code: '',
                          }
                        ];
                        set('practice_problems', newProblems);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Problem
                    </button>
                  </div>
                </div>

                {(!form.practice_problems || form.practice_problems.length === 0) && (
                  <div className="text-center py-6 text-sm text-[#908fa0] italic">
                    No practice problems added yet. Click &quot;Add Problem&quot; to start building your practice list.
                  </div>
                )}

                <div className="space-y-6">
                  {(form.practice_problems || []).map((p, pIdx) => (
                    <div key={p.id || pIdx} className="bg-[#051424] rounded-lg border border-[#464554] p-5 flex flex-col gap-4 relative group text-left">
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
                          className="text-gray-500 hover:text-white p-1 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors cursor-pointer"
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
                          className="text-gray-500 hover:text-white p-1 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors cursor-pointer"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newProblems = form.practice_problems.filter((_, idx) => idx !== pIdx);
                            set('practice_problems', newProblems);
                          }}
                          className="text-gray-500 hover:text-red-400 p-1 transition-colors ml-2 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-400 border border-violet-500/20">
                          {pIdx + 1}
                        </span>
                        <span className="text-xs font-semibold text-[#908fa0] uppercase tracking-wider">Problem {pIdx + 1}</span>
                      </div>

                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider block">Problem Name *</label>
                        <input
                          type="text"
                          required
                          value={p.name || ''}
                          onChange={(e) => {
                            const newProblems = [...form.practice_problems];
                            newProblems[pIdx] = { ...newProblems[pIdx], name: e.target.value };
                            set('practice_problems', newProblems);
                          }}
                          placeholder="e.g. Watermelon, Two Sum, etc."
                          className="w-full bg-[#0d1c2d] border border-[#464554] rounded-lg px-3 py-2 text-sm text-[#d4e4fa] focus:border-[#c0c1ff] outline-none"
                        />
                      </div>

                      {/* Row: Source Platform, Problem Link, Video Solution Link */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Source Platform */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider block">Platform</label>
                          <input
                            type="text"
                            value={p.source || ''}
                            onChange={(e) => {
                              const newProblems = [...form.practice_problems];
                              newProblems[pIdx] = { ...newProblems[pIdx], source: e.target.value };
                              set('practice_problems', newProblems);
                            }}
                            placeholder="e.g. Codeforces, LeetCode"
                            className="w-full bg-[#0d1c2d] border border-[#464554] rounded-lg px-3 py-2 text-xs text-[#d4e4fa] focus:border-[#c0c1ff] outline-none"
                          />
                        </div>

                        {/* Problem Link */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider block">Problem URL / Link</label>
                          <input
                            type="url"
                            value={p.url || ''}
                            onChange={(e) => {
                              const newProblems = [...form.practice_problems];
                              newProblems[pIdx] = { ...newProblems[pIdx], url: e.target.value };
                              set('practice_problems', newProblems);
                            }}
                            placeholder="https://..."
                            className="w-full bg-[#0d1c2d] border border-[#464554] rounded-lg px-3 py-2 text-xs text-[#d4e4fa] focus:border-[#c0c1ff] outline-none"
                          />
                        </div>

                        {/* Video Solution Link */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider block">Video Solution URL</label>
                          <input
                            type="url"
                            value={p.video_url || ''}
                            onChange={(e) => {
                              const newProblems = [...form.practice_problems];
                              newProblems[pIdx] = { ...newProblems[pIdx], video_url: e.target.value };
                              set('practice_problems', newProblems);
                            }}
                            placeholder="https://youtube.com/..."
                            className="w-full bg-[#0d1c2d] border border-[#464554] rounded-lg px-3 py-2 text-xs text-[#d4e4fa] focus:border-[#c0c1ff] outline-none"
                          />
                        </div>
                      </div>

                      {/* Editorial */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider block">Editorial / Explanation</label>
                        <textarea
                          value={p.editorial || ''}
                          onChange={(e) => {
                            const newProblems = [...form.practice_problems];
                            newProblems[pIdx] = { ...newProblems[pIdx], editorial: e.target.value };
                            set('practice_problems', newProblems);
                          }}
                          rows={4}
                          placeholder="Explain the logic, math, constraints, or step-by-step solution... (Markdown & math formulas supported)"
                          className="w-full bg-[#0d1c2d] border border-[#464554] rounded-lg px-3 py-2 text-xs text-[#d4e4fa] font-sans focus:border-[#c0c1ff] outline-none resize-y"
                        />
                        {p.editorial && (
                          <div className="mt-2 bg-[#05111d] border border-violet-500/10 rounded-lg p-3">
                            <div className="text-[9px] font-extrabold text-violet-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3" /> Live Markdown & Formula Preview
                            </div>
                            <MarkdownPreview text={p.editorial} />
                          </div>
                        )}
                      </div>

                      {/* Solution Code */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider block">Solution Code</label>
                        <textarea
                          value={p.solution_code || ''}
                          onChange={(e) => {
                            const newProblems = [...form.practice_problems];
                            newProblems[pIdx] = { ...newProblems[pIdx], solution_code: e.target.value };
                            set('practice_problems', newProblems);
                          }}
                          rows={6}
                          placeholder="// Write your clean, commented C++, Python, or Java solution code here..."
                          className="w-full bg-[#0d1c2d] border border-[#464554] rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono focus:border-[#c0c1ff] outline-none resize-y"
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
        <div className="flex-2 min-w-0 overflow-y-auto overflow-x-hidden bg-[#080b11] p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto pb-20">
            {/* Title */}
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white lg:text-3xl mb-4">
              {form.title || 'Lesson Title'}
            </h1>
            {form.duration > 0 && (
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
                <Clock className="h-4 w-4 text-violet-400" />
                {formatDuration(form.duration)}
              </div>
            )}

            {/* Legacy Global Video Player (if any) */}
            {(form.video_source && form.video_source !== 'none') && (
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
              <div className="flex flex-col items-center justify-center py-16 text-center border border-white/10 border-dashed rounded-3xl bg-white/2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                  <Play className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium">No content added yet.</p>
                <p className="text-xs text-gray-600 mt-1">Add text, HTML, markdown, or video blocks in the editor.</p>
              </div>
            )}
          </div>
        </div>

      </div>



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
      <div className="mt-8 relative overflow-hidden rounded-2xl border border-dashed border-teal-500/20 bg-teal-500/[0.01] p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/5 mx-auto mb-3">
          <BookOpen className="h-6 w-6 text-teal-400" />
        </div>
        <h4 className="text-sm font-bold text-white">Practice Problems Cockpit</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          No practice problems configured yet. Use the practice problem builder on the left to add your first contest or problem sheet!
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
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/10 bg-gradient-to-br from-teal-500/[0.03] to-transparent p-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-extrabold text-teal-400 tracking-wider uppercase bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
              Practice Cockpit Preview
            </span>
            <h4 className="text-sm font-bold text-white mt-1.5">
              Practice Problems Table
            </h4>
          </div>
          <span className="text-xs font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-full shrink-0">
            {problems.length} Problems
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/20 custom-scrollbar">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-3 text-center w-12">Solved</th>
                <th className="p-3 text-center w-12">Star</th>
                <th className="p-3 min-w-[150px]">Problem Name</th>
                <th className="p-3 text-center w-12">Link</th>
                <th className="p-3 text-center w-12">Editorial</th>
                <th className="p-3 text-center w-12">Video</th>
                <th className="p-3 text-center w-12">Code</th>
                <th className="p-3 text-center w-20">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {problems.map((p, pIdx) => {
                const isBookmarked = bookmarkedProblems.includes(pIdx);
                const workspaceUrl = p.url 
                  ? p.url 
                  : (p.source?.startsWith('http') 
                    ? p.source 
                    : `https://vjudge.net/problem/${encodeURIComponent(p.source || p.name)}`);

                const videoUrl = p.video_url 
                  ? p.video_url 
                  : `https://www.youtube.com/results?search_query=${encodeURIComponent(p.name + ' ' + (p.source || '') + ' solution')}`;

                return (
                  <tr key={p.id || pIdx} className="hover:bg-white/[0.01] transition-colors">
                    {/* Solved Checkbox */}
                    <td className="p-3 text-center">
                      <div className="flex mx-auto h-4 w-4 items-center justify-center rounded border border-[#464554] bg-transparent text-gray-500" />
                    </td>

                    {/* Bookmark Star */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setBookmarkedProblems(prev =>
                            isBookmarked ? prev.filter(idx => idx !== pIdx) : [...prev, pIdx]
                          );
                        }}
                        className="group flex items-center justify-center transition-transform hover:scale-110 active:scale-90 cursor-pointer w-6 h-6 mx-auto"
                      >
                        <Star 
                          className={`h-4 w-4 transition-colors ${
                            isBookmarked 
                              ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_2px_rgba(251,191,36,0.4)]' 
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
                        className="text-xs font-semibold text-white hover:text-teal-400 hover:underline transition-colors"
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
                        className="flex items-center justify-center p-1.5 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/10 transition-all w-6 h-6 mx-auto"
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
                        className={`flex items-center justify-center p-1.5 rounded border transition-all w-6 h-6 mx-auto cursor-pointer ${
                          !p.editorial 
                            ? 'opacity-20 cursor-not-allowed bg-zinc-800/20 border-white/5 text-gray-600' 
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-gray-300 hover:text-white'
                        }`}
                        title={p.editorial ? "View Editorial" : "No Editorial"}
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
                        className="flex items-center justify-center p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/10 transition-all w-6 h-6 mx-auto"
                        title={p.video_url ? "Watch Video Solution" : "Search Video Solution on YouTube"}
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
                        className={`flex items-center justify-center p-1.5 rounded border transition-all w-6 h-6 mx-auto cursor-pointer ${
                          !p.solution_code 
                            ? 'opacity-20 cursor-not-allowed bg-zinc-800/20 border-white/5 text-gray-600' 
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-gray-300 hover:text-white'
                        }`}
                        title={p.solution_code ? "View Solution Code" : "No Code"}
                      >
                        <Code className="h-3.5 w-3.5" />
                      </button>
                    </td>

                    {/* Source Name Platform */}
                    <td className="p-3 text-center">
                      <div className="text-center text-[9px] font-extrabold text-teal-300 bg-[#16222f] border border-teal-500/10 px-2 py-0.5 rounded truncate uppercase tracking-widest inline-block max-w-[80px]" title={p.source}>
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
      {selectedProblem && (() => {
        const p = selectedProblem.problem;
        const pIdx = selectedProblem.pIdx;
        
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-[#05111d] border border-teal-500/25 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#010f1f]">
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-extrabold text-teal-300 bg-[#16222f] border border-teal-500/10 px-2.5 py-1 rounded truncate uppercase tracking-widest">
                    {getPlatformName(p.source)}
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {p.name || `Problem ${pIdx + 1}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProblem(null)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer bg-white/5 p-1 rounded-lg border border-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tab Selector Bar */}
              <div className="flex items-center border-b border-white/5 bg-[#020b15] px-5 py-1 gap-2">
                {p.editorial && (
                  <button
                    type="button"
                    onClick={() => setModalTab('editorial')}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      modalTab === 'editorial'
                        ? 'border-teal-400 text-teal-300 bg-teal-500/5'
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
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      modalTab === 'solution'
                        ? 'border-teal-400 text-teal-300 bg-teal-500/5'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <Code className="h-4 w-4" />
                    Solution Code
                  </button>
                )}
              </div>

              {/* Modal Content Body */}
              <div className="p-5 overflow-y-auto flex-1 text-left bg-zinc-950/20">
                {modalTab === 'editorial' && p.editorial && (
                  <div className="bg-zinc-950/30 rounded-xl p-4 border border-white/5 leading-relaxed">
                    <div 
                      className="md-desc prose prose-invert max-w-none text-xs text-gray-300"
                      dangerouslySetInnerHTML={{ __html: (() => {
                        try {
                          return marked.parse(p.editorial, { gfm: true, breaks: true });
                        } catch {
                          return `<p>${p.editorial}</p>`;
                        }
                      })() }}
                    />
                  </div>
                )}

                {modalTab === 'solution' && p.solution_code && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest">
                        Clean Code Solution
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(p.solution_code, pIdx)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-semibold"
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
                    <pre className="overflow-x-auto text-xs font-mono text-emerald-300 bg-zinc-950 rounded-xl p-4 border border-white/5 custom-scrollbar">
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

const MD_PREVIEW_STYLES = `
.md-preview{display:grid;grid-template-columns:1fr;gap:.5rem;line-height:1.6;color:#908fa0;font-size:.75rem;}
.md-preview h1, .md-preview h2, .md-preview h3, .md-preview h4{font-weight:700;color:#d4e4fa;margin-top:.5rem;margin-bottom:-.25rem;}
.md-preview p{line-height:1.65;word-break:break-word;}
.md-preview strong{color:#d4e4fa;font-weight:600;}
.md-preview em{font-style:italic;}
.md-preview a{color:#8083ff;text-decoration:none;}.md-preview a:hover{text-decoration:underline;}
.md-preview ul,.md-preview ol{padding-left:1.25rem;display:flex;flex-direction:column;gap:.15rem;}
.md-preview ul li{list-style-type:disc;}.md-preview ol li{list-style-type:decimal;}
.md-preview li{padding-left:.2rem;}
.md-preview code{background:rgba(128,131,255,.1);color:#8083ff;padding:.1em .35em;border-radius:.3rem;font-size:.8em;font-family:monospace;}
.md-preview blockquote{border-left:3px solid rgba(255,255,255,.12);padding:.4rem .75rem;background:rgba(255,255,255,.02);border-radius:0 .4rem .4rem 0;}
`;

function MarkdownPreview({ text, className = '' }) {
  if (!text) return null;
  let html = '';
  try {
    html = marked.parse(text, { gfm: true, breaks: true });
  } catch {
    html = `<p>${text}</p>`;
  }
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MD_PREVIEW_STYLES }} />
      <div className={`md-preview ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}


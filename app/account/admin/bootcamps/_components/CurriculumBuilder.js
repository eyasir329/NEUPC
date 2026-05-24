'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import {
  Plus,
  Loader2,
  GripVertical,
  ChevronRight,
  MoreVertical,
  Play,
  BookOpen,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  HardDrive,
  Youtube,
  Upload,
  FileText,
  Check,
  X,
  Eye,
  EyeOff,
  Maximize2,
  Lock,
  Unlock,
  CheckSquare,
  HelpCircle,
  PlusCircle,
  Sparkles,
  Star,
  Clock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  validateDriveVideo,
  toggleCourseLock,
  toggleModuleLock,
  toggleLessonLock,
  generateExamQuestionsAction,
  generatePracticeProblemsAction,
} from '@/app/_lib/bootcamp-actions';
import {
  VIDEO_SOURCES,
  getVideoSourceConfig,
  validateLesson as validateLessonData,
  formatDurationSeconds,
} from './bootcampConfig';
import toast from 'react-hot-toast';
import RichTextEditor from '@/app/_components/ui/RichTextEditor';
import MultiBlockEditor from './MultiBlockEditor';
import LessonFullscreenEditorModal from './LessonFullscreenEditorModal';
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

// ─── Inline rename input ───────────────────────────────────────────────────────

function InlineRename({ value, onSave, onCancel }) {
  const [text, setText] = useState(value);
  const ref = useRef(null);

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else onCancel();
  };

  return (
    <input
      ref={ref}
      autoFocus
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') onCancel();
      }}
      className="flex-1 min-w-0 rounded border border-[#c0c1ff]/40 bg-[#0d1c2d] px-2 py-0.5 text-sm text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
    />
  );
}

// ─── Video source icons ────────────────────────────────────────────────────────

const VIDEO_ICONS = {
  none: FileText,
  drive: HardDrive,
  youtube: Youtube,
  upload: Upload,
};

// ─── Lesson editor (right panel) ───────────────────────────────────────────────

function LessonEditor({ lesson, lessonSerial, onSaved, onClose, syllabusUI, isFullscreen, setIsFullscreen, lessonSaveRef }) {
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [driveValidation, setDriveValidation] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [openAiImport, setOpenAiImport] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const [openAiProblemsImport, setOpenAiProblemsImport] = useState(false);
  const [aiProblemsInput, setAiProblemsInput] = useState('');
  const [generatingProblems, setGeneratingProblems] = useState(false);



  const [form, setForm] = useState(() => {
    let content = lesson.content || '';
    
    // Migration: if the lesson has a legacy global video but no video blocks in content
    if (lesson.video_source && lesson.video_source !== 'none' && lesson.video_id) {
      try {
        let blocks = content ? JSON.parse(content) : [];
        if (Array.isArray(blocks)) {
          const hasVideoBlock = blocks.some(b => b.type === 'video');
          if (!hasVideoBlock) {
            blocks.unshift({
              id: crypto.randomUUID(),
              type: 'video',
              data: {
                videos: [{
                  id: crypto.randomUUID(),
                  video_source: lesson.video_source,
                  video_id: lesson.video_id,
                  duration: lesson.duration || 0
                }]
              }
            });
            content = JSON.stringify(blocks);
          }
        }
      } catch (e) {
        // Not JSON, or other error. Maybe legacy HTML content?
        const legacyVideoBlock = {
          id: crypto.randomUUID(),
          type: 'video',
          data: {
            videos: [{
              id: crypto.randomUUID(),
              video_source: lesson.video_source,
              video_id: lesson.video_id,
              duration: lesson.duration || 0
            }]
          }
        };
        const richTextBlock = {
          id: crypto.randomUUID(),
          type: 'richText',
          content: content
        };
        content = JSON.stringify([legacyVideoBlock, richTextBlock]);
      }
    }

    return {
      title: lesson.title || '',
      description: lesson.description || '',
      content: content,
      video_source: lesson.video_source || 'none',
      video_id: lesson.video_id || '',
      video_url: lesson.video_url || '',
      duration: lesson.duration || 0,
      type: lesson.type || 'lesson',
      exam_type: lesson.exam_type || 'mcq',
      exam_questions: lesson.exam_questions || [],
      practice_problems: lesson.practice_problems || [],
      random_question_count: lesson.random_question_count || 0,
      is_free_preview: lesson.is_free_preview || false,
      is_published: lesson.is_published !== false,
      weight: lesson.weight !== undefined ? lesson.weight : 1,
    };
  });

  // Content is managed separately via a ref so MultiBlockEditor edits don't
  // cause parent re-renders (which would reset the editor state on every keystroke).
  const contentRef = useRef(form.content);

  const set = useCallback((name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => (p[name] ? { ...p, [name]: null } : p));
  }, []);

  const handleContentChange = useCallback((val) => {
    contentRef.current = val;
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
    if (name === 'video_id') setDriveValidation(null);
  };

  const handleValidateDrive = async () => {
    if (!form.video_id) return;
    setValidating(true);
    setDriveValidation(null);
    try {
      const result = await validateDriveVideo(form.video_id);
      setDriveValidation(result);
      if (result.valid) {
        setForm((p) => ({
          ...p,
          video_id: result.fileId || p.video_id,
          duration: !p.duration && result.duration ? result.duration : p.duration,
        }));
      }
    } catch (err) {
      setDriveValidation({ valid: false, error: err.message });
    } finally {
      setValidating(false);
    }
  };

  // Core save — throws on error, no toasts. Used both by the button and externally via lessonSaveRef.
  const saveLesson = useCallback(async () => {
    const payload = { ...form, content: contentRef.current };
    const validation = validateLessonData(payload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      throw new Error('Validation failed');
    }
    setSaving(true);
    try {
      const updated = await updateLesson(lesson.id, payload);
      onSaved(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  }, [form, lesson.id, onSaved]);

  // Register with parent so the top-level "Save Changes" button can trigger it
  useEffect(() => {
    if (lessonSaveRef) lessonSaveRef.current = saveLesson;
    return () => { if (lessonSaveRef) lessonSaveRef.current = null; };
  }, [lessonSaveRef, saveLesson]);

  const handleSave = async () => {
    try {
      await saveLesson();
      toast.success('Lesson saved');
    } catch (err) {
      if (err.message !== 'Validation failed') {
        toast.error(err.message || 'Failed to save');
      }
    }
  };

  const durationMins = form.duration ? Math.round(form.duration / 60) : '';

  return (
    <div className="xl:col-span-8 min-w-0 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#d4e4fa]">
          {form.type === 'practice' ? 'Edit Practice' : form.type === 'exam' ? 'Edit Exam' : 'Edit Lesson'}
        </h3>
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="px-4 py-2 rounded-full bg-[#122131]/50 border border-[#464554] text-[#c0c1ff] text-sm font-semibold hover:bg-[#122131] hover:text-[#e1e0ff] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Maximize2 className="h-4 w-4" />
          Fullscreen Editor
        </button>
      </div>

      {/* Header card */}
      <div className="bg-[#010f1f] rounded-xl border border-[#464554] p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-[#908fa0] tracking-wider uppercase block mb-1">
              {form.type === 'practice' ? 'Practice Title' : form.type === 'exam' ? 'Exam Title' : 'Lesson Title'}
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

        <div className="flex flex-wrap items-center gap-6">
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
              value={form.weight}
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

        {form.type === 'exam' && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-t border-[#464554]/30 pt-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#908fa0] font-semibold tracking-wider uppercase">Exam Format:</span>
              <div className="relative">
                <select
                  value={form.exam_type}
                  onChange={(e) => set('exam_type', e.target.value)}
                  className="appearance-none bg-[#0d1c2d] border border-[#464554] text-[#d4e4fa] text-xs font-semibold rounded-lg pl-4 pr-9 py-2 focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] outline-none cursor-pointer"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="cq">Subjective / Written (CQ)</option>
                  <option value="hybrid">Hybrid / Nested (MCQ & CQ)</option>
                </select>
                <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#908fa0] pointer-events-none h-4 w-4 rotate-90" />
              </div>
            </div>

            {(form.exam_type === 'mcq' || form.exam_type === 'hybrid') && (
              <div className="flex items-center gap-2 bg-[#0a1827] border border-[#464554]/40 px-3 py-1.5 rounded-xl">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Random Questions Per Attempt:
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (All)"
                  value={form.random_question_count || ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) || 0 : 0;
                    set('random_question_count', val);
                  }}
                  className="w-16 bg-[#0d1c2d] border border-[#464554] text-[#d4e4fa] text-center text-xs font-bold rounded-lg py-1 focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] outline-none"
                />
                <span className="text-[10px] text-gray-500 italic">
                  (0 = show all questions)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MCQ questions builder */}
      {form.type === 'exam' && (form.exam_type === 'mcq' || form.exam_type === 'hybrid') && (
        <div className="bg-[#010f1f] rounded-xl border border-[#464554] p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[#464554] pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-violet-400" />
              <h4 className="text-base font-semibold text-[#d4e4fa]">MCQ Questions ({form.exam_questions?.length || 0})</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAiInput('');
                  setOpenAiImport(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                AI MCQ Generator
              </button>
              <button
                type="button"
                onClick={() => {
                  const newQuestions = [
                    ...(form.exam_questions || []),
                    {
                      id: crypto.randomUUID(),
                      question: '',
                      options: ['', '', '', ''],
                      correct_option: 0,
                      points: 5,
                    }
                  ];
                  set('exam_questions', newQuestions);
                }}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Question
              </button>
            </div>
          </div>

          {(!form.exam_questions || form.exam_questions.length === 0) && (
            <div className="text-center py-6 text-sm text-[#908fa0] italic">
              No questions added yet. Click "Add Question" to start building your MCQ exam.
            </div>
          )}

          <div className="space-y-6">
            {(form.exam_questions || []).map((q, qIdx) => (
              <div key={q.id || qIdx} className="bg-[#051424] rounded-lg border border-[#464554] p-4 flex flex-col gap-4 relative group">
                <button
                  type="button"
                  onClick={() => {
                    const newQuestions = form.exam_questions.filter((_, idx) => idx !== qIdx);
                    set('exam_questions', newQuestions);
                  }}
                  className="absolute top-4 right-4 text-gray-500 hover:text-red-400 p-1 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-400 border border-violet-500/20">
                    {qIdx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#908fa0] uppercase tracking-wider">Question {qIdx + 1}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider block">Question Text</label>
                  <textarea
                    value={q.question || ''}
                    onChange={(e) => {
                      const newQuestions = [...form.exam_questions];
                      newQuestions[qIdx] = { ...newQuestions[qIdx], question: e.target.value };
                      set('exam_questions', newQuestions);
                    }}
                    rows={6}
                    placeholder="Enter the question prompt... (Markdown supported, code blocks and scenarios)"
                    className="w-full bg-[#0d1c2d] border border-[#464554] rounded-lg px-3 py-2 text-sm text-[#d4e4fa] focus:border-[#c0c1ff] outline-none resize-y min-h-[120px]"
                  />
                  {q.question && (
                    <div className="mt-2 bg-[#05111d] border border-violet-500/10 rounded-lg p-3">
                      <div className="text-[9px] font-extrabold text-violet-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" /> Live Markdown Preview
                      </div>
                      <MarkdownPreview text={q.question} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((optLabel, optIdx) => (
                    <div key={optIdx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider">Option {optLabel}</label>
                        <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer select-none">
                          <input
                            type="radio"
                            name={`correct-${q.id || qIdx}`}
                            checked={q.correct_option === optIdx}
                            onChange={() => {
                              const newQuestions = [...form.exam_questions];
                              newQuestions[qIdx] = { ...newQuestions[qIdx], correct_option: optIdx };
                              set('exam_questions', newQuestions);
                            }}
                            className="text-violet-600 focus:ring-violet-500 bg-zinc-900 border-zinc-700"
                          />
                          Correct
                        </label>
                      </div>
                      <input
                        type="text"
                        value={q.options?.[optIdx] || ''}
                        onChange={(e) => {
                          const newQuestions = [...form.exam_questions];
                          const newOptions = [...(newQuestions[qIdx].options || ['', '', '', ''])];
                          newOptions[optIdx] = e.target.value;
                          newQuestions[qIdx] = { ...newQuestions[qIdx], options: newOptions };
                          set('exam_questions', newQuestions);
                        }}
                        placeholder={`Option ${optLabel}...`}
                        className="w-full bg-[#0d1c2d] border border-[#464554] rounded-lg px-3 py-2 text-xs text-[#d4e4fa] focus:border-[#c0c1ff] outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="w-32">
                  <label className="text-[11px] font-semibold text-[#908fa0] uppercase tracking-wider block mb-1">Points</label>
                  <input
                    type="number"
                    min="0"
                    value={q.points ?? 5}
                    onChange={(e) => {
                      const newQuestions = [...form.exam_questions];
                      newQuestions[qIdx] = { ...newQuestions[qIdx], points: parseInt(e.target.value) || 0 };
                      set('exam_questions', newQuestions);
                    }}
                    className="w-full bg-[#0d1c2d] border border-[#464554] rounded-lg px-3 py-2 text-xs text-[#d4e4fa] focus:border-[#c0c1ff] outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Problems builder */}
      {form.type === 'practice' && (
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
                      id: crypto.randomUUID(),
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
              No practice problems added yet. Click "Add Problem" to start building your practice list.
            </div>
          )}

          <div className="space-y-6">
            {(form.practice_problems || []).map((p, pIdx) => (
              <div key={p.id || pIdx} className="bg-[#051424] rounded-lg border border-[#464554] p-5 flex flex-col gap-4 relative group">
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

      {/* Notes / content block */}
      <div className="bg-[#010f1f] rounded-xl border border-[#464554] relative group">
        <div className="absolute left-2 top-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
          <GripVertical className="h-5 w-5 text-[#908fa0]" />
        </div>
        <div className="p-6 pl-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-[#122131] text-[#d4e4fa] p-2 rounded-lg">
              <BookOpen className="h-5 w-5" />
            </span>
            <h4 className="text-base font-semibold text-[#d4e4fa]">
              {form.type === 'practice' ? 'Practice Guidelines' : form.type === 'exam' ? 'Exam Guidelines / Prompt' : 'Lesson Notes'}
            </h4>
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-semibold text-[#908fa0] tracking-wider uppercase block mb-1">
              {form.type === 'practice' ? 'Practice Content Blocks' : form.type === 'exam' ? 'Exam Content Blocks' : 'Lesson Content Blocks'}
            </label>
            <div className="rounded-lg overflow-hidden">
              <MultiBlockEditor
                value={form.content}
                onChange={handleContentChange}
                lessonSerial={lessonSerial}
                lessonTitle={form.title}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="px-6 py-2 rounded-full border border-[#464554] text-[#908fa0] text-sm font-semibold hover:bg-[#0d1c2d] hover:text-[#d4e4fa] transition-colors flex items-center gap-2"
        >
          <Maximize2 className="h-4 w-4" />
          Fullscreen Editor
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 rounded-full border border-[#464554] text-[#d4e4fa] text-sm font-semibold hover:bg-[#0d1c2d] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-full bg-[#8083ff] text-white text-sm font-semibold hover:bg-[#c0c1ff] hover:text-[#1000a9] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {isFullscreen && (
        <LessonFullscreenEditorModal
          lessonId={lesson.id}
          form={form}
          contentRef={contentRef}
          set={set}
          handleChange={handleChange}
          handleContentChange={handleContentChange}
          errors={errors}
          durationMins={durationMins}
          handleSave={handleSave}
          saving={saving}
          onClose={() => setIsFullscreen(false)}
          syllabusUI={syllabusUI}
          lessonSerial={lessonSerial}
        />
      )}

      {openAiImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#051424] border border-[#464554] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#464554] bg-[#010f1f]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">AI MCQ Generator & Parser</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Paste raw text, markdown, or quiz questions to structure them with AI.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenAiImport(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Raw Exam Data Input</label>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Our model will parse questions, options (A, B, C, D), correct answers, and points automatically. You can write:
                </p>
                <div className="bg-black/35 rounded-lg p-2.5 border border-white/5 font-mono text-[9px] text-[#908fa0] whitespace-pre">
                  {`1. What is React?
A) A styling framework
B) A JavaScript library
C) A database
D) A web browser
Correct: B
Points: 5`}
                </div>
              </div>

              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Paste your raw unstructured exam questions here..."
                rows={10}
                className="w-full bg-[#0d1c2d] border border-[#464554] rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-y min-h-[160px]"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#464554] bg-[#010f1f] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenAiImport(false)}
                className="px-4 py-2 rounded-xl border border-[#464554] text-xs font-semibold text-[#d4e4fa] hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={generatingQuestions || !aiInput.trim()}
                onClick={async () => {
                  setGeneratingQuestions(true);
                  try {
                    const res = await generateExamQuestionsAction(aiInput);
                    if (res.error) {
                      toast.error(res.error);
                      return;
                    }
                    if (res.success && Array.isArray(res.questions)) {
                      const mergedQuestions = [
                        ...(form.exam_questions || []),
                        ...res.questions
                      ];
                      set('exam_questions', mergedQuestions);
                      setOpenAiImport(false);
                      toast.success(`Successfully parsed and added ${res.questions.length} questions!`);
                    }
                  } catch (err) {
                    toast.error('AI question generation failed. Try checking your format.');
                  } finally {
                    setGeneratingQuestions(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-xs font-bold text-white shadow-lg shadow-emerald-500/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
              >
                {generatingQuestions ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    AI is Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate & Format Questions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {openAiProblemsImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#051424] border border-[#464554] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#464554] bg-[#010f1f]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">AI Practice Problems Generator</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Paste raw text, URLs, sheet descriptions, or YouTube links to automatically format practice problems.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenAiProblemsImport(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Raw Practice Problems Data Input</label>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Our model will parse problem name, platform source, direct workspace link, YouTube video solution, step-by-step markdown editorials, and code templates automatically. Example input:
                </p>
                <div className="bg-black/35 rounded-lg p-2.5 border border-white/5 font-mono text-[9px] text-[#908fa0] whitespace-pre">
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
                className="w-full bg-[#0d1c2d] border border-[#464554] rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all resize-y min-h-[160px]"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#464554] bg-[#010f1f] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenAiProblemsImport(false)}
                className="px-4 py-2 rounded-xl border border-[#464554] text-xs font-semibold text-[#d4e4fa] hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={generatingProblems || !aiProblemsInput.trim()}
                onClick={async () => {
                  setGeneratingProblems(true);
                  try {
                    const res = await generatePracticeProblemsAction(aiProblemsInput);
                    if (res.error) {
                      toast.error(res.error);
                      return;
                    }
                    if (res.success && Array.isArray(res.problems)) {
                      const mergedProblems = [
                        ...(form.practice_problems || []),
                        ...res.problems
                      ];
                      set('practice_problems', mergedProblems);
                      setOpenAiProblemsImport(false);
                      toast.success(`Successfully parsed and added ${res.problems.length} practice problems!`);
                    }
                  } catch (err) {
                    toast.error('AI problem generation failed. Try checking your format.');
                  } finally {
                    setGeneratingProblems(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-xs font-bold text-white shadow-lg shadow-violet-500/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
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

// ─── Module row in syllabus ────────────────────────────────────────────────────

function ModuleRow({
  module,
  moduleIdx,
  courseIdx,
  activeLessonId,
  onSelectLesson,
  onAddLesson,
  onDeleteModule,
  onRenameModule,
  onToggleModuleLock,
  onDeleteLesson,
  onRenameLesson,
  onToggleLessonLock,
  onDragStart,
  onDrop,
  draggedItem,
  courseId,
  courseLocked,
}) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const effectiveModuleLocked = courseLocked || module.is_locked;

  const lessons = (module.lessons || []).sort((a, b) => a.order_index - b.order_index);
  const isDragged = draggedItem?.id === module.id && draggedItem?.type === 'module';

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart('module', module.id, courseId); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => { e.stopPropagation(); onDrop('module', module.id, courseId); }}
      className={`border border-[#464554] rounded-lg bg-[#051424] ${isDragged ? 'opacity-50' : ''}`}
    >
      {/* Module header */}
      <div className={`px-3 py-3 flex items-center gap-2 hover:bg-[#0d1c2d] transition-colors group/mod relative ${expanded ? 'rounded-t-lg' : 'rounded-lg'}`}>
        <GripVertical className="h-4 w-4 text-[#464554] cursor-grab shrink-0" />
        <button onClick={() => setExpanded((v) => !v)} className="text-[#908fa0] shrink-0">
          <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {renaming ? (
          <InlineRename
            value={module.title}
            onSave={(title) => { onRenameModule(module.id, title); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <h3
            className="text-sm font-semibold text-[#d4e4fa] flex-1 min-w-0 truncate cursor-pointer hover:text-[#c0c1ff]"
            onDoubleClick={() => setRenaming(true)}
            title="Double-click to rename"
          >
            {courseIdx + 1}.{moduleIdx + 1} {module.title}
          </h3>
        )}

        {effectiveModuleLocked && (
          <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 rounded font-semibold flex items-center gap-0.5">
            <Lock className="h-2.5 w-2.5" /> {courseLocked && !module.is_locked ? 'CRS' : 'LOCKED'}
          </span>
        )}

        {!expanded && lessons.length > 0 && (
          <span className="bg-[#273647] text-[#908fa0] text-[10px] font-semibold px-1.5 rounded shrink-0">
            {lessons.length}
          </span>
        )}

        {/* Lock toggle — only when course is not locked */}
        {!courseLocked && (
          <button
            onClick={async () => {
              setTogglingLock(true);
              await onToggleModuleLock(module.id, !module.is_locked);
              setTogglingLock(false);
            }}
            disabled={togglingLock}
            title={module.is_locked ? 'Unlock module' : 'Lock module'}
            className={`opacity-0 group-hover/mod:opacity-100 transition-all p-0.5 rounded disabled:opacity-50 shrink-0 ${module.is_locked ? 'text-amber-400 hover:text-amber-300 opacity-100' : 'text-[#908fa0] hover:text-amber-400'}`}
          >
            {togglingLock ? <Loader2 className="h-4 w-4 animate-spin" /> : module.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
        )}

        {/* Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="opacity-0 group-hover/mod:opacity-100 text-[#908fa0] hover:text-[#d4e4fa] transition-all p-0.5 rounded"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-20 bg-[#122131] border border-[#464554] rounded-lg shadow-xl overflow-hidden w-36">
                <button
                  onClick={() => { setRenaming(true); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#d4e4fa] hover:bg-[#1c2b3c] transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => { onDeleteModule(module.id); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Delete Module
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="flex flex-col bg-[#010f1f] border-t border-[#464554] rounded-b-lg">
          {lessons.map((lesson, lIdx) => {
            const isActive = lesson.id === activeLessonId;
            return (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                label={`${courseIdx + 1}.${moduleIdx + 1}.${lIdx + 1}`}
                isActive={isActive}
                onSelect={() => onSelectLesson(lesson)}
                onDelete={() => onDeleteLesson(lesson.id, module.id)}
                onRename={(title) => onRenameLesson(lesson.id, title)}
                onToggleLock={(isLocked) => onToggleLessonLock(lesson.id, isLocked)}
                onDragStart={onDragStart}
                onDrop={onDrop}
                draggedItem={draggedItem}
                moduleId={module.id}
                moduleLocked={effectiveModuleLocked}
              />
            );
          })}

          {/* Add actions */}
          <div className="px-3 py-2 pl-10 flex flex-wrap items-center gap-3">
            <button
              onClick={async () => {
                setAddingLesson(true);
                await onAddLesson(module.id, 'lesson');
                setAddingLesson(false);
              }}
              disabled={addingLesson}
              className="text-xs text-[#908fa0] hover:text-[#c0c1ff] flex items-center gap-1 transition-colors font-medium disabled:opacity-50"
            >
              {addingLesson ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add Lesson
            </button>
            <span className="text-[#464554] text-xs font-light">|</span>
            <button
              onClick={async () => {
                setAddingLesson(true);
                await onAddLesson(module.id, 'practice');
                setAddingLesson(false);
              }}
              disabled={addingLesson}
              className="text-xs text-[#908fa0] hover:text-teal-400 flex items-center gap-1 transition-colors font-medium disabled:opacity-50"
            >
              {addingLesson ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 text-teal-500" />}
              Add Practice
            </button>
            <span className="text-[#464554] text-xs font-light">|</span>
            <button
              onClick={async () => {
                setAddingLesson(true);
                await onAddLesson(module.id, 'exam');
                setAddingLesson(false);
              }}
              disabled={addingLesson}
              className="text-xs text-[#908fa0] hover:text-violet-400 flex items-center gap-1 transition-colors font-medium disabled:opacity-50"
            >
              {addingLesson ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 text-violet-500" />}
              Add Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Lesson row ────────────────────────────────────────────────────────────────

function LessonRow({ lesson, label, isActive, onSelect, onDelete, onRename, onToggleLock, onDragStart, onDrop, draggedItem, moduleId, moduleLocked }) {
  const [renaming, setRenaming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);

  const hasVideo = lesson.video_source && lesson.video_source !== 'none';
  const isDragged = draggedItem?.id === lesson.id && draggedItem?.type === 'lesson';
  const effectiveLocked = moduleLocked || lesson.is_locked;

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart('lesson', lesson.id, moduleId); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => { e.stopPropagation(); onDrop('lesson', lesson.id, moduleId); }}
      className={`px-3 py-2 flex items-center gap-2 pl-8 cursor-pointer group/lesson border-l-4 transition-colors ${
        isActive
          ? 'bg-[#c0c1ff]/10 border-[#c0c1ff]'
          : 'border-transparent hover:bg-[#0d1c2d]'
      } ${isDragged ? 'opacity-50' : ''}`}
      onClick={() => !renaming && onSelect()}
    >
      <GripVertical className="h-3.5 w-3.5 text-[#464554] cursor-grab shrink-0" />
      <span className={`shrink-0 ${isActive ? 'text-[#d0bcff]' : 'text-[#908fa0]'}`}>
        {isActive ? (
          <Check className="h-4 w-4 text-[#d0bcff]" />
        ) : lesson.type === 'practice' ? (
          <CheckSquare className="h-4 w-4 text-teal-400" />
        ) : lesson.type === 'exam' ? (
          <HelpCircle className="h-4 w-4 text-violet-400" />
        ) : hasVideo ? (
          <Play className="h-4 w-4" />
        ) : (
          <BookOpen className="h-4 w-4" />
        )}
      </span>

      {renaming ? (
        <InlineRename
          value={lesson.title}
          onSave={(title) => { onRename(title); setRenaming(false); }}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <span
          className={`text-sm flex-1 min-w-0 truncate ${isActive ? 'text-[#c0c1ff] font-medium' : 'text-[#d4e4fa]'}`}
          onDoubleClick={(e) => { e.stopPropagation(); setRenaming(true); }}
          title={`${label} ${lesson.title} — double-click to rename`}
        >
          {label} {lesson.title}
        </span>
      )}

      {!lesson.is_published && (
        <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 rounded font-semibold">
          DRAFT
        </span>
      )}
      {lesson.is_free_preview && (
        <span className="shrink-0 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded font-semibold">
          FREE
        </span>
      )}
      {effectiveLocked && (
        <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 rounded font-semibold flex items-center gap-0.5">
          <Lock className="h-2.5 w-2.5" />
          {moduleLocked && !lesson.is_locked ? 'MOD' : 'LOCK'}
        </span>
      )}

      {/* Lock toggle — only for lesson-level lock; module lock is handled on the module */}
      {!moduleLocked && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            setTogglingLock(true);
            await onToggleLock(!lesson.is_locked);
            setTogglingLock(false);
          }}
          disabled={togglingLock}
          title={lesson.is_locked ? 'Unlock lesson' : 'Lock lesson'}
          className={`opacity-0 group-hover/lesson:opacity-100 transition-all p-0.5 rounded disabled:opacity-50 shrink-0 ${lesson.is_locked ? 'text-amber-400 hover:text-amber-300 opacity-100' : 'text-[#908fa0] hover:text-amber-400'}`}
        >
          {togglingLock ? <Loader2 className="h-3 w-3 animate-spin" /> : lesson.is_locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </button>
      )}

      {/* Context menu */}
      <div className="relative shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="opacity-0 group-hover/lesson:opacity-100 text-[#908fa0] hover:text-[#d4e4fa] transition-all p-0.5 rounded"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-5 z-20 bg-[#122131] border border-[#464554] rounded-lg shadow-xl overflow-hidden w-32">
              <button
                onClick={(e) => { e.stopPropagation(); setRenaming(true); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-[#d4e4fa] hover:bg-[#1c2b3c] transition-colors"
              >
                Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Course (top-level group) in syllabus ─────────────────────────────────────

function CourseRow({
  course,
  courseIdx,
  activeLessonId,
  onSelectLesson,
  onAddModule,
  onAddLesson,
  onDeleteCourse,
  onDeleteModule,
  onDeleteLesson,
  onRenameCourse,
  onRenameModule,
  onRenameLesson,
  onToggleCourseLock,
  onToggleModuleLock,
  onToggleLessonLock,
  onDragStart,
  onDrop,
  draggedItem,
}) {
  const [renaming, setRenaming] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [addingModule, setAddingModule] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);

  const modules = (course.modules || []).sort((a, b) => a.order_index - b.order_index);
  const isDragged = draggedItem?.id === course.id && draggedItem?.type === 'course';

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart('course', course.id, null); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => { e.stopPropagation(); onDrop('course', course.id, null); }}
      className={`border border-[#464554] rounded-lg bg-[#051424] ${isDragged ? 'opacity-50' : ''}`}
    >
      {/* Course header — acts as top-level module group */}
      <div className={`px-3 py-3 flex items-center gap-2 bg-[#0d1c2d] hover:bg-[#122131] transition-colors group/course ${expanded ? 'rounded-t-lg' : 'rounded-lg'}`}>
        <GripVertical className="h-4 w-4 text-[#464554] cursor-grab shrink-0" />
        <button onClick={() => setExpanded((v) => !v)} className="text-[#908fa0] shrink-0">
          <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {renaming ? (
          <InlineRename
            value={course.title}
            onSave={(title) => { onRenameCourse(course.id, title); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <h3
            className="text-sm font-bold text-[#d4e4fa] flex-1 min-w-0 truncate cursor-pointer hover:text-[#c0c1ff]"
            onDoubleClick={() => setRenaming(true)}
            title="Double-click to rename"
          >
            {courseIdx + 1}. {course.title}
          </h3>
        )}

        {course.is_locked && (
          <span className="shrink-0 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 rounded font-semibold flex items-center gap-0.5">
            <Lock className="h-2.5 w-2.5" /> LOCKED
          </span>
        )}

        <button
          onClick={async () => {
            setAddingModule(true);
            await onAddModule(course.id);
            setAddingModule(false);
          }}
          disabled={addingModule}
          className="opacity-0 group-hover/course:opacity-100 text-[#c0c1ff] hover:text-[#e1e0ff] text-xs flex items-center gap-1 font-medium transition-all disabled:opacity-50 shrink-0"
        >
          {addingModule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Module
        </button>

        {/* Course lock toggle */}
        <button
          onClick={async () => {
            setTogglingLock(true);
            await onToggleCourseLock(course.id, !course.is_locked);
            setTogglingLock(false);
          }}
          disabled={togglingLock}
          title={course.is_locked ? 'Unlock course' : 'Lock course'}
          className={`opacity-0 group-hover/course:opacity-100 transition-all p-0.5 rounded disabled:opacity-50 shrink-0 ${course.is_locked ? 'text-amber-400 hover:text-amber-300 opacity-100' : 'text-[#908fa0] hover:text-amber-400'}`}
        >
          {togglingLock ? <Loader2 className="h-4 w-4 animate-spin" /> : course.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="opacity-0 group-hover/course:opacity-100 text-[#908fa0] hover:text-[#d4e4fa] transition-all p-0.5 rounded"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-20 bg-[#122131] border border-[#464554] rounded-lg shadow-xl overflow-hidden w-36">
                <button
                  onClick={() => { setRenaming(true); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#d4e4fa] hover:bg-[#1c2b3c] transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => { onDeleteCourse(course.id); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Delete Course
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modules */}
      {expanded && (
        <div className="flex flex-col gap-2 p-2">
          {modules.length === 0 && (
            <p className="text-xs text-[#908fa0] text-center py-3">
              No modules. Click "+ Module" above.
            </p>
          )}
          {modules.map((mod, modIdx) => (
            <ModuleRow
              key={mod.id}
              module={mod}
              moduleIdx={modIdx}
              courseIdx={courseIdx}
              activeLessonId={activeLessonId}
              onSelectLesson={onSelectLesson}
              onAddLesson={onAddLesson}
              onDeleteModule={onDeleteModule}
              onRenameModule={onRenameModule}
              onToggleModuleLock={onToggleModuleLock}
              onDeleteLesson={onDeleteLesson}
              onRenameLesson={onRenameLesson}
              onToggleLessonLock={onToggleLessonLock}
              onDragStart={onDragStart}
              onDrop={onDrop}
              draggedItem={draggedItem}
              courseId={course.id}
              courseLocked={course.is_locked}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main CurriculumBuilder ────────────────────────────────────────────────────

export default function CurriculumBuilder({ bootcampId, initialCourses = [], onCoursesChange, lessonSaveRef }) {
  const router = useRouter();
  const [courses, setCourses] = useState(
    initialCourses.sort((a, b) => a.order_index - b.order_index)
  );
  const [activeLesson, setActiveLesson] = useState(null);
  const [addingCourse, setAddingCourse] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keep lessonSaveRef clear when no lesson is active
  useEffect(() => {
    if (!activeLesson && lessonSaveRef) lessonSaveRef.current = null;
  }, [activeLesson, lessonSaveRef]);

  const handleDragStart = (type, id, parentId) => {
    setDraggedItem({ type, id, parentId });
  };

  const handleDrop = async (type, targetId, targetParentId) => {
    if (!draggedItem || draggedItem.type !== type) return;
    if (draggedItem.id === targetId) return;
    if (draggedItem.parentId !== targetParentId) return;

    const reorderList = (items) => {
      const dragIdx = items.findIndex((i) => i.id === draggedItem.id);
      const dropIdx = items.findIndex((i) => i.id === targetId);
      if (dragIdx === -1 || dropIdx === -1) return null;
      
      const newItems = [...items];
      const [dragged] = newItems.splice(dragIdx, 1);
      newItems.splice(dropIdx, 0, dragged);
      return newItems.map((item, index) => ({ ...item, order_index: index }));
    };

    try {
      if (type === 'course') {
        const newCourses = reorderList(courses);
        if (newCourses) {
          sync(newCourses);
          await reorderCourses(bootcampId, newCourses.map(c => c.id));
        }
      } else if (type === 'module') {
        const courseId = targetParentId;
        const course = courses.find(c => c.id === courseId);
        const newModules = reorderList(course.modules || []);
        if (newModules) {
          sync(courses.map(c => c.id === courseId ? { ...c, modules: newModules } : c));
          await reorderModules(courseId, newModules.map(m => m.id));
        }
      } else if (type === 'lesson') {
        const moduleId = targetParentId;
        let targetCourseId = null;
        for (const c of courses) {
          if ((c.modules || []).some(m => m.id === moduleId)) {
            targetCourseId = c.id;
            break;
          }
        }
        if (targetCourseId) {
          const course = courses.find(c => c.id === targetCourseId);
          const targetModule = course.modules.find(m => m.id === moduleId);
          const newLessons = reorderList(targetModule.lessons || []);
          if (newLessons) {
            sync(courses.map(c => c.id === targetCourseId ? {
              ...c,
              modules: (c.modules || []).map(m => m.id === moduleId ? { ...m, lessons: newLessons } : m)
            } : c));
            await reorderLessons(moduleId, newLessons.map(l => l.id));
          }
        }
      }
    } catch (err) {
      toast.error('Failed to save order');
    }
    setDraggedItem(null);
  };

  const sync = (newCourses) => {
    setCourses(newCourses);
    onCoursesChange?.(newCourses);
  };

  // ── Lesson selection ────────────────────────────────────────────────────────
  const handleSelectLesson = (lesson) => setActiveLesson(lesson);

  const handleLessonSaved = (updated) => {
    setActiveLesson(updated);
    sync(courses.map((c) => ({
      ...c,
      modules: (c.modules || []).map((m) => ({
        ...m,
        lessons: (m.lessons || []).map((l) => l.id === updated.id ? updated : l),
      })),
    })));
    router.refresh();
  };

  // ── Add course ──────────────────────────────────────────────────────────────
  const handleAddCourse = async () => {
    setAddingCourse(true);
    try {
      const course = await createCourse(bootcampId, { title: 'New Course' });
      sync([...courses, { ...course, modules: [] }]);
    } catch (err) {
      toast.error('Failed to create course');
    } finally {
      setAddingCourse(false);
    }
  };

  // ── Rename course ───────────────────────────────────────────────────────────
  const handleRenameCourse = async (courseId, title) => {
    try {
      await updateCourse(courseId, { title });
      sync(courses.map((c) => c.id === courseId ? { ...c, title } : c));
    } catch (err) {
      toast.error('Failed to rename course');
    }
  };

  // ── Delete course ───────────────────────────────────────────────────────────
  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Delete this course and everything inside?')) return;
    try {
      await deleteCourse(courseId);
      const newCourses = courses.filter((c) => c.id !== courseId);
      sync(newCourses);
      if (activeLesson) {
        const stillExists = newCourses.some((c) =>
          (c.modules || []).some((m) =>
            (m.lessons || []).some((l) => l.id === activeLesson.id)
          )
        );
        if (!stillExists) setActiveLesson(null);
      }
      toast.success('Course deleted');
    } catch (err) {
      toast.error('Failed to delete course');
    }
  };

  // ── Add module ──────────────────────────────────────────────────────────────
  const handleAddModule = async (courseId) => {
    try {
      const mod = await createModule(courseId, { title: 'New Module' });
      sync(courses.map((c) =>
        c.id === courseId
          ? { ...c, modules: [...(c.modules || []), { ...mod, lessons: [] }] }
          : c
      ));
    } catch (err) {
      toast.error('Failed to create module');
    }
  };

  // ── Rename module ───────────────────────────────────────────────────────────
  const handleRenameModule = async (moduleId, title) => {
    try {
      await updateModule(moduleId, { title });
      sync(courses.map((c) => ({
        ...c,
        modules: (c.modules || []).map((m) => m.id === moduleId ? { ...m, title } : m),
      })));
    } catch (err) {
      toast.error('Failed to rename module');
    }
  };

  // ── Delete module ───────────────────────────────────────────────────────────
  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    try {
      await deleteModule(moduleId);
      const newCourses = courses.map((c) => ({
        ...c,
        modules: (c.modules || []).filter((m) => m.id !== moduleId),
      }));
      sync(newCourses);
      if (activeLesson) {
        const stillExists = newCourses.some((c) =>
          (c.modules || []).some((m) =>
            (m.lessons || []).some((l) => l.id === activeLesson.id)
          )
        );
        if (!stillExists) setActiveLesson(null);
      }
      toast.success('Module deleted');
    } catch (err) {
      toast.error('Failed to delete module');
    }
  };

  // ── Add lesson ──────────────────────────────────────────────────────────────
  const handleAddLesson = async (moduleId, type = 'lesson') => {
    try {
      let defaultTitle = 'New Lesson';
      if (type === 'practice') defaultTitle = 'New Practice';
      if (type === 'exam') defaultTitle = 'New Exam';

      const lesson = await createLesson(moduleId, {
        title: defaultTitle,
        type: type,
        exam_type: type === 'exam' ? 'mcq' : null,
        exam_questions: type === 'exam' ? [] : null
      });
      sync(courses.map((c) => ({
        ...c,
        modules: (c.modules || []).map((m) =>
          m.id === moduleId
            ? { ...m, lessons: [...(m.lessons || []), lesson] }
            : m
        ),
      })));
      setActiveLesson(lesson);
    } catch (err) {
      toast.error(`Failed to create ${type}`);
    }
  };

  // ── Rename lesson ───────────────────────────────────────────────────────────
  const handleRenameLesson = async (lessonId, title) => {
    try {
      await updateLesson(lessonId, { title });
      const newCourses = courses.map((c) => ({
        ...c,
        modules: (c.modules || []).map((m) => ({
          ...m,
          lessons: (m.lessons || []).map((l) => l.id === lessonId ? { ...l, title } : l),
        })),
      }));
      sync(newCourses);
      if (activeLesson?.id === lessonId) setActiveLesson((p) => ({ ...p, title }));
    } catch (err) {
      toast.error('Failed to rename lesson');
    }
  };

  // ── Toggle course lock ──────────────────────────────────────────────────────
  const handleToggleCourseLock = async (courseId, isLocked) => {
    try {
      await toggleCourseLock(courseId, isLocked);
      sync(courses.map((c) => c.id === courseId ? { ...c, is_locked: isLocked } : c));
      toast.success(isLocked ? 'Course locked' : 'Course unlocked');
    } catch (err) {
      toast.error('Failed to update lock');
    }
  };

  // ── Toggle module lock ──────────────────────────────────────────────────────
  const handleToggleModuleLock = async (moduleId, isLocked) => {
    try {
      await toggleModuleLock(moduleId, isLocked);
      sync(courses.map((c) => ({
        ...c,
        modules: (c.modules || []).map((m) => m.id === moduleId ? { ...m, is_locked: isLocked } : m),
      })));
      toast.success(isLocked ? 'Module locked' : 'Module unlocked');
    } catch (err) {
      toast.error('Failed to update lock');
    }
  };

  // ── Toggle lesson lock ──────────────────────────────────────────────────────
  const handleToggleLessonLock = async (lessonId, isLocked) => {
    try {
      await toggleLessonLock(lessonId, isLocked);
      sync(courses.map((c) => ({
        ...c,
        modules: (c.modules || []).map((m) => ({
          ...m,
          lessons: (m.lessons || []).map((l) => l.id === lessonId ? { ...l, is_locked: isLocked } : l),
        })),
      })));
      toast.success(isLocked ? 'Lesson locked' : 'Lesson unlocked');
    } catch (err) {
      toast.error('Failed to update lock');
    }
  };

  // ── Delete lesson ───────────────────────────────────────────────────────────
  const handleDeleteLesson = async (lessonId, moduleId) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await deleteLesson(lessonId);
      sync(courses.map((c) => ({
        ...c,
        modules: (c.modules || []).map((m) =>
          m.id === moduleId
            ? { ...m, lessons: (m.lessons || []).filter((l) => l.id !== lessonId) }
            : m
        ),
      })));
      if (activeLesson?.id === lessonId) setActiveLesson(null);
      toast.success('Lesson deleted');
    } catch (err) {
      toast.error('Failed to delete lesson');
    }
  };

  const totalModules = courses.reduce((s, c) => s + (c.modules?.length || 0), 0);
  const totalLessons = courses.reduce(
    (s, c) => s + (c.modules || []).reduce((ms, m) => ms + (m.lessons?.length || 0), 0),
    0
  );

  const syllabusUI = (
    <>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#d4e4fa]">Syllabus</h2>
            <p className="text-[11px] text-[#908fa0]">
              {courses.length} course{courses.length !== 1 ? 's' : ''} · {totalModules} module{totalModules !== 1 ? 's' : ''} · {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleAddCourse}
            disabled={addingCourse}
            className="text-[#c0c1ff] hover:text-[#e1e0ff] text-sm flex items-center gap-1 font-medium transition-colors disabled:opacity-50"
          >
            {addingCourse ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add Course
          </button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3 text-[#908fa0]">
              <BookOpen className="h-10 w-10 text-[#464554]" />
              <p className="text-sm">No modules yet. Click &quot;Add Module&quot; to start.</p>
            </div>
          ) : (
            courses.map((course, courseIdx) => (
              <CourseRow
                key={course.id}
                course={course}
                courseIdx={courseIdx}
                activeLessonId={activeLesson?.id}
                onSelectLesson={handleSelectLesson}
                onAddModule={handleAddModule}
                onAddLesson={handleAddLesson}
                onDeleteCourse={handleDeleteCourse}
                onDeleteModule={handleDeleteModule}
                onDeleteLesson={handleDeleteLesson}
                onRenameCourse={handleRenameCourse}
                onRenameModule={handleRenameModule}
                onRenameLesson={handleRenameLesson}
                onToggleCourseLock={handleToggleCourseLock}
                onToggleModuleLock={handleToggleModuleLock}
                onToggleLessonLock={handleToggleLessonLock}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                draggedItem={draggedItem}
              />
            ))
          )}
        </div>
    </>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* ── Left: Syllabus ─────────────────────────────────────────────────── */}
      <div className="xl:col-span-4 min-w-0 flex flex-col gap-4 bg-[#010f1f] p-4 rounded-xl border border-[#464554] min-h-[500px]">
        {syllabusUI}
      </div>

      {/* ── Right: Editor or placeholder ───────────────────────────────────── */}
      {activeLesson ? (
        <LessonEditor
          key={activeLesson.id}
          lesson={activeLesson}
          lessonSerial={(() => {
            const allLessons = courses.flatMap(c => (c.modules || []).sort((a,b) => a.order_index - b.order_index).flatMap(m => (m.lessons || []).sort((a,b) => a.order_index - b.order_index)));
            const videoLessons = allLessons.filter(l => { try { return Array.isArray(JSON.parse(l.content)) && JSON.parse(l.content).some(b => b.type === 'video'); } catch { return false; } });
            const idx = videoLessons.findIndex(l => l.id === activeLesson.id);
            return idx >= 0 ? idx + 1 : allLessons.findIndex(l => l.id === activeLesson.id) + 1;
          })()}
          onSaved={handleLessonSaved}
          onClose={() => setActiveLesson(null)}
          syllabusUI={syllabusUI}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          lessonSaveRef={lessonSaveRef}
        />
      ) : (
        <div className="xl:col-span-8">
          <div className="bg-[#010f1f] rounded-xl border border-[#464554] p-12 text-center flex flex-col items-center gap-4 text-[#908fa0]">
            <Play className="h-10 w-10 text-[#464554]" />
            <p>Select a lesson from the syllabus or create one to edit content.</p>
          </div>
        </div>
      )}
    </div>
  );
}

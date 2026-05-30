/**
 * @file Bootcamp learning client component
 * @module BootcampLearningClient
 */

'use client';

import { marked } from 'marked';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const MultiBlockEditor = dynamic(
  () => import('@/app/account/admin/bootcamps/_components/MultiBlockEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/5" />
    ),
  }
);

import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useTransition,
  memo,
  Suspense,
  lazy,
  Fragment,
} from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Play,
  FileText,
  CheckCircle2,
  BookOpen,
  Layers,
  GraduationCap,
  Trophy,
  Video,
  Lock,
  Search,
  X,
  Menu,
  Clock,
  CircleDot,
  ChevronRight,
  Circle,
  Download,
  StickyNote,
  List,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Send,
  Paperclip,
  Upload,
  Trash2,
  Sparkles,
  MapPin,
  CheckSquare,
  HelpCircle,
  RefreshCw,
  Star,
  Copy,
  Code,
  ExternalLink,
  Brain,
  Puzzle,
  Info,
  Pencil,
  Eye,
  Maximize2,
  Minimize2,
  Users,
  Award,
} from 'lucide-react';
import {
  getLesson,
  getLessonContent,
  updateWatchTimeDelta,
  recordLearningActivity,
  markLessonComplete,
  markLessonIncomplete,
  togglePracticeProblemSolved,
  saveLessonNotes,
  touchLessonAccess,
  submitHelpTicketAction,
  getMemberHelpTickets,
  getMemberBootcampTasks,
  getMemberBootcampSessions,
  submitTaskAction,
  uploadTaskAttachmentAction,
  submitExamSubmission,
  getExamSubmission,
  checkEnrollment,
} from '@/app/_lib/actions/bootcamp-actions';
import VideoPlayer from '@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/VideoPlayer';
import ExtensionGuide from '@/app/account/member/problem-solving/_components/ExtensionGuide';

const parseExamQuestions = (questions, lesson = null) => {
  let list = [];
  if (lesson) {
    try {
      const parsed =
        typeof lesson.content === 'string'
          ? JSON.parse(lesson.content)
          : lesson.content;
      const examBlock = parsed?.find((b) => b.type === 'exam');
      list = examBlock?.questions || [];
    } catch {}
  }
  if (!list || list.length === 0) {
    if (!questions) return [];
    if (Array.isArray(questions)) return questions;
    if (typeof questions === 'string') {
      try {
        const parsed = JSON.parse(questions);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }
  return list;
};

const parsePracticeProblems = (problems) => {
  if (!problems) return [];
  if (Array.isArray(problems)) return problems;
  if (typeof problems === 'string') {
    try {
      const parsed = JSON.parse(problems);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

// Lightweight markdown renderer for task/session descriptions
const MD_DESC_STYLES = `
.md-desc{display:grid;grid-template-columns:1fr;gap:.5rem;line-height:1.6;color:#908fa0;font-size:.8125rem;}
.md-desc .md-h{font-weight:700;color:#d4e4fa;margin-top:.5rem;margin-bottom:-.25rem;}
.md-desc .md-p{line-height:1.65;word-break:break-word;}
.md-desc .md-strong{color:#d4e4fa;font-weight:600;}
.md-desc .md-em{font-style:italic;}
.md-desc .md-a{color:#8083ff;text-decoration:none;}.md-desc .md-a:hover{text-decoration:underline;}
.md-desc .md-ul,.md-desc .md-ol{padding-left:1.25rem;display:flex;flex-direction:column;gap:.15rem;}
.md-desc .md-ul .md-li{list-style-type:disc;}.md-desc .md-ol .md-li{list-style-type:decimal;}
.md-desc .md-li{padding-left:.2rem;}
.md-desc .md-inline-code{background:rgba(128,131,255,.1);color:#8083ff;padding:.1em .35em;border-radius:.3rem;font-size:.8em;font-family:monospace;}
.md-desc .md-code-block{background:#040d17;border:1px solid rgba(255,255,255,0.08);color:#d4e4fa;padding:.75rem 1rem;border-radius:.6rem;font-size:.8em;font-family:monospace;margin:.5rem 0;line-height:1.5;overflow-x:auto;white-space:pre-wrap;word-break:break-all;}
.md-desc .md-bq{border-left:3px solid rgba(255,255,255,.12);padding:.4rem .75rem;background:rgba(255,255,255,.02);border-radius:0 .4rem .4rem 0;}
`;

function buildDescRenderer() {
  const r = new marked.Renderer();
  r.heading = function ({ tokens, depth }) {
    return `<h${depth} class="md-h md-h${depth}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
  };
  r.paragraph = function ({ tokens }) {
    return `<p class="md-p">${this.parser.parseInline(tokens)}</p>\n`;
  };
  r.blockquote = function ({ tokens }) {
    return `<blockquote class="md-bq">${this.parser.parse(tokens)}</blockquote>\n`;
  };
  r.list = function (token) {
    const tag = token.ordered ? 'ol' : 'ul';
    let body = '';
    for (const item of token.items) {
      const inner = this.parser
        .parse(item.tokens)
        .replace(/^\s*<p[^>]*>(.*)<\/p>\s*$/s, '$1');
      body += `<li class="md-li">${inner}</li>\n`;
    }
    return `<${tag} class="md-${tag}">${body}</${tag}>\n`;
  };
  r.strong = function ({ tokens }) {
    return `<strong class="md-strong">${this.parser.parseInline(tokens)}</strong>`;
  };
  r.em = function ({ tokens }) {
    return `<em class="md-em">${this.parser.parseInline(tokens)}</em>`;
  };
  r.codespan = ({ text }) => `<code class="md-inline-code">${text}</code>`;
  r.link = function ({ href, title, tokens }) {
    return `<a href="${href}" class="md-a"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener">${this.parser.parseInline(tokens)}</a>`;
  };
  r.code = ({ text }) => `<pre class="md-code-block">${text}</pre>`;
  return r;
}

const DESC_RENDERER = buildDescRenderer();

function MarkdownDesc({ text, className = '' }) {
  if (!text) return null;
  let html = '';
  try {
    html = marked.parse(text, {
      gfm: true,
      breaks: true,
      renderer: DESC_RENDERER,
    });
  } catch {
    html = `<p>${text}</p>`;
  }
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MD_DESC_STYLES }} />
      <div
        className={`md-desc ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}

// Inline renderer for task/session descriptions stored as richText JSON blocks
function TaskDescriptionRenderer({ content }) {
  if (!content) return null;
  let html = '';
  try {
    const blocks = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(blocks)) {
      html = blocks
        .map((b) => {
          if (!b) return '';
          const type = b.type || 'richText';
          const text = b.content || '';
          if (type === 'markdown') {
            try {
              return marked(text);
            } catch {
              return `<pre>${text}</pre>`;
            }
          }
          // richText, html — already HTML; skip structural/media blocks
          if (type === 'richText' || type === 'html') return text;
          return '';
        })
        .join('');
    } else {
      html = content;
    }
  } catch {
    html = content;
  }
  if (!html || !html.trim()) return null;
  return (
    <div
      className="tiptap-viewer-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Heavy chunk: lazy-load only the markdown/code-highlight renderer
const LessonContentRenderer = lazy(
  () =>
    import('@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer')
);
import LessonComments from '@/app/_components/ui/LessonComments';
import { getLessonCommentsAction } from '@/app/_lib/actions/member-lesson-comments-actions';

// Native History API cache to bypass Next.js monkey-patched router and prevent reloads
let nativePushState = null;
let nativeReplaceState = null;

function getNativeHistory() {
  if (typeof window === 'undefined')
    return { pushState: null, replaceState: null };
  if (nativePushState && nativeReplaceState) {
    return { pushState: nativePushState, replaceState: nativeReplaceState };
  }
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    nativePushState = iframe.contentWindow.history.pushState;
    nativeReplaceState = iframe.contentWindow.history.replaceState;
    document.body.removeChild(iframe);
  } catch (e) {
    nativePushState = window.history.pushState;
    nativeReplaceState = window.history.replaceState;
  }
  return { pushState: nativePushState, replaceState: nativeReplaceState };
}

function ChunkFallback({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-8 text-gray-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      <span className="text-[12px]">{label}</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDurationSecs(seconds) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function formatDurationFull(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SCROLLBAR = `
  .spa-scroll::-webkit-scrollbar { width: 5px; }
  .spa-scroll::-webkit-scrollbar-track { background: transparent; }
  .spa-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius:10px; }
  .spa-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
  .spa-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }

  @keyframes spa-indeterminate {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(20%); }
    100% { transform: translateX(120%); }
  }
  .spa-progress-bar {
    position: absolute;
    inset: 0;
    width: 40%;
    background: linear-gradient(90deg, transparent, rgb(16 185 129), transparent);
    animation: spa-indeterminate 1.1s ease-in-out infinite;
  }

  @keyframes spa-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .spa-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
    background-size: 800px 100%;
    animation: spa-shimmer 1.4s linear infinite;
  }

  @keyframes spa-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .spa-fade-in { animation: spa-fade-in 0.22s ease-out both; }
`;

// ─── Curriculum Rail ──────────────────────────────────────────────────────────

const LessonRow = memo(function LessonRow({
  lesson,
  isActive,
  isCompleted,
  onSelect,
  onPrefetch,
  index,
  activeRef,
  moduleLocked,
}) {
  const hasVideo = lesson.video_source && lesson.video_source !== 'none';
  const duration = formatDurationSecs(lesson.duration);
  const effectiveLocked = moduleLocked || lesson.is_locked;

  return (
    <button
      ref={isActive ? activeRef : null}
      onClick={() => {
        if (effectiveLocked) return;
        onSelect(lesson);
      }}
      onMouseEnter={() => !effectiveLocked && onPrefetch?.(lesson)}
      onFocus={() => !effectiveLocked && onPrefetch?.(lesson)}
      className={`group flex w-full items-start gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors ${
        effectiveLocked
          ? 'cursor-not-allowed opacity-60'
          : isActive
            ? 'border-emerald-500/30 bg-emerald-500/[0.08]'
            : 'border-transparent hover:border-white/10 hover:bg-white/5'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {effectiveLocked ? (
          <Lock className="h-4 w-4 text-gray-600" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : isActive ? (
          lesson.type === 'practice' ? (
            <CheckSquare className="h-4 w-4 animate-pulse text-teal-400" />
          ) : lesson.type === 'exam' ? (
            <HelpCircle className="h-4 w-4 animate-pulse text-violet-400" />
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
              <Play className="h-2 w-2 fill-emerald-400 text-emerald-400" />
            </div>
          )
        ) : lesson.type === 'practice' ? (
          <CheckSquare className="h-4 w-4 text-teal-500/60 transition-colors group-hover:text-teal-400" />
        ) : lesson.type === 'exam' ? (
          <HelpCircle className="h-4 w-4 text-violet-500/60 transition-colors group-hover:text-violet-400" />
        ) : (
          <div className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 text-[8px] font-medium text-gray-600 transition-colors group-hover:border-violet-500/40 group-hover:text-violet-400">
            {index + 1}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`flex items-start gap-1.5 text-[12.5px] leading-snug ${
            effectiveLocked
              ? 'text-gray-600'
              : isCompleted
                ? 'text-gray-500 line-through decoration-white/15'
                : isActive
                  ? 'font-medium text-white'
                  : 'text-gray-300 group-hover:text-white'
          }`}
        >
          <span className="line-clamp-2">{lesson.title}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-gray-500">
          {lesson.type === 'practice' ? (
            <CheckSquare className="h-2.5 w-2.5 text-teal-500" />
          ) : lesson.type === 'exam' ? (
            <HelpCircle className="h-2.5 w-2.5 text-violet-500" />
          ) : hasVideo ? (
            <Video className="h-2.5 w-2.5" />
          ) : (
            <FileText className="h-2.5 w-2.5" />
          )}
          <span>
            {lesson.type === 'practice'
              ? 'Practice'
              : lesson.type === 'exam'
                ? `Exam (${lesson.exam_type?.toUpperCase()})`
                : hasVideo
                  ? 'Video'
                  : 'Reading'}
          </span>
          {duration && (
            <>
              <span className="text-gray-700">·</span>
              <span>{duration}</span>
            </>
          )}
          {effectiveLocked && (
            <span className="ml-auto text-[10px] text-amber-600/80">
              Locked
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

function ModuleGroup({
  module,
  lessonProgress,
  activeLessonId,
  resumeLessonId,
  onSelect,
  onPrefetch,
  activeRef,
  forceOpen,
  courseLocked,
}) {
  const effectiveModuleLocked = courseLocked || module.is_locked;
  const containsActive = module.lessons?.some((l) => l.id === activeLessonId);
  const containsResume = module.lessons?.some((l) => l.id === resumeLessonId);
  const [open, setOpen] = useState(containsActive || containsResume);

  // Auto-open when active lesson enters this module
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const total = module.lessons?.length || 0;
  const done =
    module.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed)
      .length || 0;
  const allDone = total > 0 && done === total;

  const isOpen = forceOpen || open;

  return (
    <div className="ml-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/5"
      >
        <ChevronDown
          className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <span
          className={`flex-1 truncate text-[12px] font-medium ${effectiveModuleLocked ? 'text-gray-600' : allDone ? 'text-gray-500' : 'text-gray-300'} group-hover:text-white`}
        >
          {module.title}
        </span>
        {effectiveModuleLocked ? (
          <Lock className="h-3 w-3 shrink-0 text-amber-600/70" />
        ) : (
          <span
            className={`shrink-0 text-[10px] tabular-nums ${allDone ? 'text-emerald-500' : 'text-gray-600'}`}
          >
            {done}/{total}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pt-1 pl-4">
              {module.lessons?.map((lesson, i) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  isActive={lesson.id === activeLessonId}
                  isCompleted={lessonProgress?.[lesson.id]?.is_completed}
                  onSelect={onSelect}
                  onPrefetch={onPrefetch}
                  activeRef={activeRef}
                  index={i}
                  moduleLocked={effectiveModuleLocked}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CourseGroup({
  course,
  lessonProgress,
  activeLessonId,
  resumeLessonId,
  courseIndex,
  onSelect,
  onPrefetch,
  activeRef,
  forceOpen,
}) {
  const containsActive = course.modules?.some((m) =>
    m.lessons?.some((l) => l.id === activeLessonId)
  );
  const containsResume = course.modules?.some((m) =>
    m.lessons?.some((l) => l.id === resumeLessonId)
  );
  const [open, setOpen] = useState(
    containsActive || containsResume || courseIndex === 0
  );

  // Auto-open when active lesson enters this course
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const total =
    course.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0;
  const done =
    course.modules?.reduce(
      (s, m) =>
        s +
        (m.lessons?.filter((l) => lessonProgress?.[l.id]?.is_completed)
          .length || 0),
      0
    ) || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const isOpen = forceOpen || open;

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-2.5 px-3 py-3 text-left hover:bg-white/5"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[13px] font-semibold transition-colors group-hover:text-violet-300 ${course.is_locked ? 'text-gray-500' : 'text-white'}`}
          >
            {course.title}
          </div>
          {course.is_locked ? (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600/80">
              <Lock className="h-2.5 w-2.5" /> Locked
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1 max-w-[120px] flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 tabular-nums">
                {done}/{total}
              </span>
            </div>
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-2">
              {course.modules?.map((module) => (
                <ModuleGroup
                  key={module.id}
                  module={module}
                  lessonProgress={lessonProgress}
                  activeLessonId={activeLessonId}
                  resumeLessonId={resumeLessonId}
                  onSelect={onSelect}
                  onPrefetch={onPrefetch}
                  activeRef={activeRef}
                  forceOpen={forceOpen}
                  courseLocked={course.is_locked}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CurriculumRail({
  bootcamp,
  lessonProgress,
  activeLessonId,
  resumeLesson,
  onSelect,
  onPrefetch,
  totalLessons,
  completedCount,
  progressPercent,
  onClose,
}) {
  const [query, setQuery] = useState('');
  const activeRef = useRef(null);

  useEffect(() => {
    if (!activeLessonId) return;
    // Wait for accordion expand animation (~180ms) before scrolling
    const t = setTimeout(() => {
      if (activeRef.current) {
        activeRef.current.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }, 220);
    return () => clearTimeout(t);
  }, [activeLessonId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return bootcamp?.courses || [];
    const q = query.trim().toLowerCase();
    return (bootcamp?.courses || [])
      .map((c) => {
        const modules = (c.modules || [])
          .map((m) => {
            const lessons = (m.lessons || []).filter((l) =>
              l.title?.toLowerCase().includes(q)
            );
            return m.title?.toLowerCase().includes(q)
              ? m
              : lessons.length
                ? { ...m, lessons }
                : null;
          })
          .filter(Boolean);
        return c.title?.toLowerCase().includes(q)
          ? c
          : modules.length
            ? { ...c, modules }
            : null;
      })
      .filter(Boolean);
  }, [bootcamp?.courses, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/10 px-4 pt-4 pb-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            Course content
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 tabular-nums">
              {completedCount}/{totalLessons}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-white lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pr-7 pl-8 text-[12px] text-white transition-colors placeholder:text-gray-600 focus:border-violet-500/40 focus:bg-white/5 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 text-gray-500 hover:bg-white/5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom padding clears ChatFAB, mobile CTA bar, and iOS safe-area. */}
      <div
        className="spa-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12rem)',
        }}
      >
        {filtered.length > 0 ? (
          filtered.map((course, ci) => (
            <CourseGroup
              key={course.id}
              course={course}
              lessonProgress={lessonProgress}
              activeLessonId={activeLessonId}
              resumeLessonId={query ? null : resumeLesson?.id}
              courseIndex={ci}
              onSelect={(lesson) => {
                onSelect(lesson);
                onClose?.();
              }}
              onPrefetch={onPrefetch}
              activeRef={activeRef}
              forceOpen={!!query}
            />
          ))
        ) : query ? (
          <div className="px-4 py-10 text-center">
            <Search className="mx-auto mb-2 h-5 w-5 text-gray-700" />
            <p className="text-[12px] text-gray-500">
              No matches for &ldquo;{query}&rdquo;
            </p>
            <button
              onClick={() => setQuery('')}
              className="mt-2 text-[11px] text-violet-400 hover:text-violet-300"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <BookOpen className="mx-auto mb-2 h-5 w-5 text-gray-700" />
            <p className="text-[12px] text-gray-500">No curriculum yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notes Panel ──────────────────────────────────────────────────────────────

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

function TableOfContents({ contentRef }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const container = contentRef?.current;
    if (!container) return;
    const timer = setTimeout(() => {
      const els = container.querySelectorAll('h2, h3, h4');
      const items = [];
      els.forEach((el, i) => {
        if (!el.id)
          el.id = `h-${i}-${el.textContent
            .slice(0, 20)
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase()}`;
        items.push({
          id: el.id,
          text: el.textContent,
          level: parseInt(el.tagName.charAt(1)),
        });
      });
      setHeadings(items);
    }, 400);
    return () => clearTimeout(timer);
  }, [contentRef]);

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const v = entries.filter((e) => e.isIntersecting);
        if (v.length) setActiveId(v[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <div className="sticky top-6">
      <div className="mb-3 flex items-center gap-2 px-1">
        <List className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">
          On this page
        </span>
      </div>
      <nav>
        <ul className="space-y-0.5 border-l border-white/10">
          {headings.map((h) => {
            const isActive = activeId === h.id;
            const indent =
              h.level === 2 ? 'pl-3' : h.level === 3 ? 'pl-5' : 'pl-7';
            return (
              <li key={h.id}>
                <button
                  onClick={() => {
                    document
                      .getElementById(h.id)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveId(h.id);
                  }}
                  className={`w-full py-1.5 text-left ${indent} -ml-px truncate border-l-2 text-[11px] leading-snug transition-all ${
                    isActive
                      ? 'border-violet-500 font-semibold text-violet-300'
                      : 'border-transparent text-gray-600 hover:border-gray-600 hover:text-gray-400'
                  }`}
                >
                  {h.text}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

// ─── Overview tabs: Tasks, Sessions, Help Desk ────────────────────────────────

const DIFF_COLOR = {
  easy: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  hard: 'text-rose-400 bg-rose-500/10 ring-rose-500/20',
};

function PanelLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-4 border-white/5" />
        <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-4 border-transparent border-t-violet-400" />
      </div>
      <p className="mt-3 text-[12px] text-gray-500">Loading…</p>
    </div>
  );
}

function PanelEmpty({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 rounded-full bg-white/5 p-3 ring-1 ring-white/10">
        <Sparkles className="h-5 w-5 text-gray-500" />
      </div>
      <p className="text-[13px] text-gray-500">{message}</p>
    </div>
  );
}

const STATUS_STYLE = {
  pending: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  completed: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  accepted: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20',
  late: 'text-rose-400 bg-rose-500/10 ring-rose-500/20',
  'redo action required': 'text-orange-400 bg-orange-500/10 ring-orange-500/20',
  'bonus deserved': 'text-violet-400 bg-violet-500/10 ring-violet-500/20',
};

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function resolveAttachmentUrl(url) {
  if (!url) return url;
  const m = url.match(/^\/api\/image\/([a-zA-Z0-9_-]+)$/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
  return url;
}

function AttachmentList({ files, onRemove }) {
  if (!files?.length) return null;
  return (
    <ul className="space-y-1.5">
      {files.map((f, i) => (
        <li
          key={i}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"
        >
          <Paperclip className="h-3 w-3 shrink-0 text-violet-400" />
          <a
            href={resolveAttachmentUrl(f.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-[12px] text-violet-300 hover:underline"
          >
            {f.name || `Attachment ${i + 1}`}
          </a>
          {f.size && (
            <span className="text-[10px] text-gray-500 tabular-nums">
              {formatBytes(f.size)}
            </span>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="rounded p-0.5 text-gray-500 hover:bg-white/5 hover:text-rose-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function TaskSubmitForm({ task, onSubmitted, isArchived = false }) {
  const [content, setContent] = useState(
    () =>
      task.mySubmission?.notes ||
      JSON.stringify([
        { id: crypto.randomUUID(), type: 'richText', content: '' },
      ])
  );
  const [attachments, setAttachments] = useState(() =>
    Array.isArray(task.mySubmission?.attachments)
      ? task.mySubmission.attachments
      : []
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const isRedo = task.mySubmission?.status === 'redo action required';
  const canSubmit = (!task.mySubmission || isRedo) && !isArchived;

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setError('');
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadTaskAttachmentAction(fd);
      if (res.error) {
        setError(res.error);
        continue;
      }
      uploaded.push({
        url: res.url,
        name: res.name,
        size: res.size,
        type: res.type,
      });
    }
    setAttachments((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData();
    fd.set('task_id', task.id);
    fd.set('submission_url', '');
    fd.set('notes', content);
    fd.set('attachments', JSON.stringify(attachments));
    const result = await submitTaskAction(fd);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSubmitted(task.id, result.data);
  };

  if (!canSubmit) return null;

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <div>
        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
          Your Submission
        </label>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <MultiBlockEditor value={content} onChange={setContent} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
          Attachments
        </label>
        <AttachmentList
          files={attachments}
          onRemove={(i) =>
            setAttachments((prev) => prev.filter((_, j) => j !== i))
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-2 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          {uploading ? 'Uploading…' : 'Add files'}
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || uploading}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
      >
        <Send className="h-3 w-3" />
        {loading ? 'Submitting…' : isRedo ? 'Resubmit' : 'Submit'}
      </button>
    </form>
  );
}

function MemberTasksPanel({ bootcampId, isArchived = false }) {
  const [tasks, setTasks] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!bootcampId) return;
    getMemberBootcampTasks(bootcampId)
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [bootcampId]);

  const handleSubmitted = useCallback((taskId, submissionData) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, mySubmission: submissionData } : t
      )
    );
  }, []);

  if (tasks === null) return <PanelLoader />;
  if (tasks.length === 0)
    return <PanelEmpty message="No tasks assigned yet." />;

  return (
    <div className="space-y-2">
      {isArchived && (
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[12.5px] leading-normal font-medium text-amber-300 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            This bootcamp is archived. Task submissions and modifications are
            disabled.
          </span>
        </div>
      )}
      {tasks.map((task) => {
        const sub = task.mySubmission;
        const isExpanded = expanded === task.id;
        const isPastDue = task.deadline && new Date(task.deadline) < new Date();

        return (
          <div
            key={task.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors hover:border-white/20"
          >
            <button
              className="flex w-full items-center gap-3 p-4 text-left"
              onClick={() => setExpanded(isExpanded ? null : task.id)}
            >
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${DIFF_COLOR[task.difficulty] ?? 'bg-white/5 text-gray-400 ring-white/10'}`}
              >
                {task.difficulty}
              </span>
              <span className="flex-1 truncate text-[13px] font-medium text-white">
                {task.title}
              </span>
              {task.points != null && (
                <span className="shrink-0 text-[10px] font-bold text-amber-400">
                  {task.points} pts
                </span>
              )}
              {task.deadline && (
                <span
                  className={`shrink-0 text-[11px] ${isPastDue && !sub ? 'text-rose-400' : 'text-gray-500'}`}
                >
                  {new Date(task.deadline).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {sub ? (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ${STATUS_STYLE[sub.status] ?? 'bg-white/5 text-gray-400 ring-white/10'}`}
                >
                  {sub.status}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-gray-500 ring-1 ring-white/10">
                  not submitted
                </span>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
              )}
            </button>

            {isExpanded && (
              <div className="space-y-3 border-t border-white/10 px-4 pt-3 pb-4">
                {task.description && (
                  <TaskDescriptionRenderer content={task.description} />
                )}
                {Array.isArray(task.problem_links) &&
                  task.problem_links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {task.problem_links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] text-violet-400 hover:bg-violet-500/20"
                        >
                          <Download className="h-3 w-3" />
                          Problem {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                {/* Existing submission status */}
                {sub && (
                  <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/2 p-3">
                    <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                      Your Submission
                    </p>
                    {sub.notes && (
                      <TaskDescriptionRenderer content={sub.notes} />
                    )}
                    {Array.isArray(sub.attachments) &&
                      sub.attachments.length > 0 && (
                        <AttachmentList files={sub.attachments} />
                      )}
                    {sub.points_earned != null && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                          Points:
                        </span>
                        <span className="text-[12px] font-bold text-amber-300 tabular-nums">
                          {sub.points_earned}
                          {task.points != null ? ` / ${task.points}` : ''}
                        </span>
                      </div>
                    )}
                    {sub.feedback && (
                      <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2">
                        <p className="mb-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                          Mentor Feedback
                        </p>
                        <p className="text-[12px] text-gray-300">
                          {sub.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isArchived ? (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2.5 text-[12px] leading-relaxed font-medium text-amber-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span>
                      This bootcamp is archived. Task submissions and edits are
                      disabled.
                    </span>
                  </div>
                ) : (
                  <TaskSubmitForm
                    task={task}
                    onSubmitted={handleSubmitted}
                    isArchived={isArchived}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const TARGET_LABEL = {
  'one-on-one': '1:1',
  'selected-group': 'Group',
  'all-bootcamp': 'Broadcast',
};

function MemberSessionRow({ s, isArchived = false }) {
  const [open, setOpen] = useState(false);
  const mentorName = s.mentor?.full_name || '—';
  const dt = new Date(s.scheduled_at || s.session_date);
  const isUpcoming = s.status === 'scheduled' && dt >= new Date();
  const dateStr = dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border shadow-lg shadow-black/20 backdrop-blur-xl transition-all ${isUpcoming ? 'border-violet-500/30 bg-violet-500/[0.05]' : 'border-white/10 bg-zinc-900/50 hover:border-white/20'}`}
    >
      {isUpcoming && (
        <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-500/10 blur-[60px]" />
      )}
      {/* Row header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative z-10 flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${isUpcoming ? 'bg-violet-500/15 ring-violet-500/30' : 'bg-white/5 ring-white/10'}`}
        >
          <Video
            className={`h-3.5 w-3.5 ${isUpcoming ? 'text-violet-400' : 'text-emerald-400'}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">
            {s.topic || 'Session'}
          </p>
          <p className="text-[11px] text-gray-500">
            {dateStr}
            {isUpcoming ? ` · ${timeStr}` : ''} · {s.duration ?? '—'}min ·{' '}
            {mentorName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {s.target_type && (
            <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-gray-400 ring-1 ring-white/10 sm:inline-block">
              {TARGET_LABEL[s.target_type] ?? s.target_type}
            </span>
          )}
          {isUpcoming ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300 ring-1 ring-violet-500/20">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
              upcoming
            </span>
          ) : s.attended === true ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
              attended
            </span>
          ) : s.attended === false ? (
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 ring-1 ring-rose-500/20">
              missed
            </span>
          ) : (
            <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-semibold text-gray-400 ring-1 ring-gray-500/20">
              done
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="relative z-10 space-y-3 border-t border-white/5 bg-black/20 px-4 pt-3 pb-4">
          {s.description && <TaskDescriptionRenderer content={s.description} />}
          {s.notes && (
            <div className="rounded-lg border border-white/10 bg-white/2 px-3 py-2">
              <p className="mb-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                Mentor notes
              </p>
              <p className="text-[12px] whitespace-pre-wrap text-gray-300">
                {s.notes}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {s.location ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-300"
                title={s.location}
              >
                <MapPin className="h-3 w-3" />
                {s.location}
              </span>
            ) : (
              s.meet_link &&
              (isArchived ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-gray-500 ring-1 ring-white/10">
                  <Video className="h-3.5 w-3.5 text-gray-600" />
                  Session Concluded
                </span>
              ) : (
                <a
                  href={s.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500"
                >
                  <Video className="h-3 w-3" />
                  {isUpcoming ? 'Join Meet' : 'Open Meet'}
                  <ChevronRight className="h-3 w-3 opacity-70" />
                </a>
              ))
            )}
            {s.recording_url && (
              <a
                href={s.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
              >
                <CircleDot className="h-3 w-3" />
                Watch recording
                <ChevronRight className="h-3 w-3 opacity-70" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberSessionsPanel({ bootcampId, isArchived = false }) {
  const [sessions, setSessions] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'upcoming' | 'past'

  useEffect(() => {
    if (!bootcampId) return;
    getMemberBootcampSessions(bootcampId)
      .then(setSessions)
      .catch(() => setSessions([]));
  }, [bootcampId]);

  if (sessions === null) return <PanelLoader />;
  if (sessions.length === 0)
    return <PanelEmpty message="No sessions scheduled yet." />;

  const now = new Date();
  const upcoming = sessions.filter(
    (s) =>
      s.status === 'scheduled' &&
      new Date(s.scheduled_at || s.session_date) >= now
  );
  const past = sessions.filter(
    (s) =>
      s.status !== 'scheduled' ||
      new Date(s.scheduled_at || s.session_date) < now
  );

  const visible =
    filter === 'upcoming' ? upcoming : filter === 'past' ? past : sessions;

  return (
    <div className="space-y-4">
      {isArchived && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[12.5px] leading-normal font-medium text-amber-300 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            This bootcamp is archived. Join links for scheduled live sessions
            are concluded.
          </span>
        </div>
      )}
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', value: sessions.length, color: 'text-white' },
          {
            label: 'Upcoming',
            value: upcoming.length,
            color: 'text-violet-400',
          },
          {
            label: 'Attended',
            value: sessions.filter((s) => s.attended).length,
            color: 'text-emerald-400',
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-2.5 text-center shadow-lg shadow-black/20 backdrop-blur-xl"
          >
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[
          ['all', 'All'],
          ['upcoming', 'Upcoming'],
          ['past', 'Past'],
        ].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${filter === v ? 'bg-violet-500/15 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/30' : 'bg-white/5 text-gray-400 ring-1 ring-white/10 hover:text-white hover:ring-white/20'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Session list */}
      {visible.length === 0 ? (
        <PanelEmpty message={`No ${filter} sessions.`} />
      ) : (
        <div className="space-y-2">
          {visible.map((s) => (
            <MemberSessionRow key={s.id} s={s} isArchived={isArchived} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberHelpDeskPanel({ bootcampId, isArchived = false }) {
  const [tickets, setTickets] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!bootcampId) return;
    getMemberHelpTickets(bootcampId)
      .then(setTickets)
      .catch(() => setTickets([]));
  }, [bootcampId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isArchived) return;
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    const fd = new FormData();
    fd.set('bootcamp_id', bootcampId);
    fd.set('subject', subject);
    fd.set('body', body);
    const result = await submitHelpTicketAction(fd);
    if (!result.error) {
      setTickets((prev) => [
        {
          id: `h${Date.now()}`,
          subject,
          body,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        ...(prev || []),
      ]);
      setSubject('');
      setBody('');
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      {isArchived ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 text-[12.5px] leading-normal font-medium text-amber-300 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            This bootcamp is archived. The Help Desk is in read-only mode, and
            submitting new support tickets is disabled.
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="relative space-y-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-5 shadow-lg shadow-black/20 backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-500/[0.08] blur-[60px]" />
          <p className="relative z-10 text-[11px] font-bold tracking-widest text-violet-300 uppercase">
            Ask for help
          </p>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            required
            className="relative z-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-white placeholder-gray-600 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your issue or question…"
            rows={3}
            required
            className="relative z-10 w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-white placeholder-gray-600 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="relative z-10 flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/15 px-4 py-2 text-[12px] font-semibold text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {sending ? 'Sending…' : 'Submit'}
          </button>
        </form>
      )}

      {tickets === null ? (
        <PanelLoader />
      ) : tickets.length === 0 ? (
        <PanelEmpty message="No help requests yet." />
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            Your tickets
          </p>
          {tickets.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors hover:border-white/20"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate text-[13px] font-medium text-white">
                  {t.subject}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${t.status === 'open' ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'}`}
                >
                  {t.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[12px] text-gray-500">
                {t.body}
              </p>
              {t.reply && (
                <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <p className="mb-1 text-[10px] font-semibold text-emerald-400 uppercase">
                    Mentor reply
                  </p>
                  <p className="text-[12px] text-gray-300">{t.reply}</p>
                </div>
              )}
              <p className="mt-1 text-[10px] text-gray-600">
                {new Date(t.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

const OverviewPanel = memo(function OverviewPanel({
  bootcamp,
  allLessons,
  lessonProgress,
  progressPercent,
  completedCount,
  totalLessons,
  totalWatchedSecs,
  totalDurationSecs,
  resumeLesson,
  resumeIndex,
  isComplete,
  onSelectLesson,
  coursesCount,
  modulesCount,
  enrollment,
}) {
  const ctaLabel = isComplete
    ? 'Review'
    : completedCount > 0
      ? 'Resume'
      : 'Start learning';

  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!bootcamp?.id) return;
    getMemberBootcampTasks(bootcamp.id)
      .then(setTasks)
      .catch(() => {});
    getMemberBootcampSessions(bootcamp.id)
      .then(setSessions)
      .catch(() => {});
  }, [bootcamp?.id]);

  const taskEarned = useMemo(() => {
    return tasks.reduce((sum, t) => {
      const sub = t.mySubmission;
      if (sub && sub.status === 'graded') {
        return sum + (sub.points_earned || 0);
      }
      return sum;
    }, 0);
  }, [tasks]);

  const taskMax = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.points || 0), 0);
  }, [tasks]);

  const sessionEarned = useMemo(() => {
    return sessions.reduce((sum, s) => {
      const myAtt = s.attendance_data?.find(
        (a) => a.user_id === enrollment?.user_id
      );
      return sum + (myAtt?.points || 0);
    }, 0);
  }, [sessions, enrollment?.user_id]);

  const sessionCount = useMemo(() => {
    return sessions.filter((s) =>
      s.attendance_data?.some(
        (a) => a.user_id === enrollment?.user_id && a.attended
      )
    ).length;
  }, [sessions, enrollment?.user_id]);

  const totalPoints = useMemo(() => {
    return allLessons.reduce((s, l) => s + (l.points ?? 10), 0);
  }, [allLessons]);

  const totalMaxPoints = totalPoints + taskMax;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      {/* Title + meta */}
      <div className="space-y-3">
        {bootcamp?.difficulty_level && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-violet-300 uppercase ring-1 ring-violet-500/20">
            {bootcamp.difficulty_level}
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {bootcamp?.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[12px] text-gray-500">
          {coursesCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> {coursesCount} courses
            </span>
          )}
          {modulesCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> {modulesCount} modules
            </span>
          )}
          {totalLessons > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> {totalLessons} lessons
            </span>
          )}
          {totalDurationSecs > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />{' '}
              {formatDurationSecs(totalDurationSecs)}
            </span>
          )}
        </div>
      </div>

      {/* Continue card */}
      {resumeLesson && (
        <div
          className={`mt-7 rounded-2xl border ${isComplete ? 'border-amber-500/20 bg-linear-to-br from-amber-500/[0.06] to-transparent' : 'border-emerald-500/20 bg-linear-to-br from-emerald-500/[0.06] to-transparent'} p-5 sm:p-6`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="min-w-0 flex-1">
              <div
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase ${isComplete ? 'text-amber-300' : 'text-emerald-300'}`}
              >
                {isComplete ? (
                  <>
                    <Trophy className="h-3 w-3" /> Bootcamp complete
                  </>
                ) : (
                  <>
                    <CircleDot className="h-3 w-3" />{' '}
                    {completedCount > 0
                      ? 'Continue where you left off'
                      : 'Ready to begin'}
                  </>
                )}
              </div>
              <h3 className="mt-1.5 truncate text-lg font-semibold text-white">
                {resumeLesson.title}
              </h3>
              <div className="mt-1 flex items-center gap-3 text-[12px] text-gray-400">
                <span>
                  Lesson {resumeIndex + 1} of {totalLessons}
                </span>
                {resumeLesson.duration > 0 && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />{' '}
                      {formatDurationSecs(resumeLesson.duration)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => onSelectLesson(resumeLesson)}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] ${
                isComplete
                  ? 'bg-linear-to-r from-amber-500 to-amber-600 shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500'
                  : 'bg-linear-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500'
              }`}
            >
              <Play className="h-4 w-4 fill-current" />
              {ctaLabel}
            </button>
          </div>
        </div>
      )}

      {/* Progress tiles */}
      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
          Your progress
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div className="rounded-xl border border-white/10 bg-white/2 p-4">
            <div className="text-[10.5px] font-semibold tracking-wider text-gray-500 uppercase">
              Overall
            </div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {progressPercent}
              <span className="text-base text-gray-500">%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/2 p-4">
            <div className="text-[10.5px] font-semibold tracking-wider text-gray-500 uppercase">
              Lessons
            </div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {completedCount}
              <span className="text-base text-gray-500">/{totalLessons}</span>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              {totalLessons - completedCount} left
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#161b22] p-4 ring-1 ring-violet-500/20">
            <div className="flex items-center gap-1 text-[10.5px] font-bold tracking-wider text-violet-400 uppercase">
              <Trophy className="h-3 w-3 text-amber-400" /> Score
            </div>
            <div className="mt-1 text-2xl font-black text-white tabular-nums">
              {enrollment?.score || 0}
              <span className="ml-1 text-[11px] font-semibold text-gray-500">
                /{totalMaxPoints} pts
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-linear-to-r from-violet-500 to-pink-500 transition-all duration-500"
                style={{
                  width: `${totalMaxPoints > 0 ? Math.min(100, Math.round(((enrollment?.score || 0) / totalMaxPoints) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/2 p-4">
            <div className="text-[10.5px] font-semibold tracking-wider text-gray-500 uppercase">
              Watched
            </div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {formatDurationSecs(totalWatchedSecs) || '0m'}
            </div>
            <div className="mt-2 truncate text-[11px] text-gray-500">
              of {formatDurationSecs(totalDurationSecs) || '—'}
            </div>
          </div>
        </div>
      </section>

      {/* Points & Performance Breakdown */}
      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
          Score Breakdown
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Curriculum Points */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/2 p-4.5 transition-all duration-300 hover:border-white/20">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-violet-400 uppercase">
                <BookOpen className="h-3.5 w-3.5" /> Curriculum
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                Points from video lessons, interactive practice exercises, and
                curriculum exams.
              </p>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white tabular-nums">
                {Math.max(
                  0,
                  (enrollment?.score || 0) - taskEarned - sessionEarned
                )}
                <span className="ml-1 text-xs font-semibold text-gray-500">
                  /{totalPoints} pts
                </span>
              </span>
              <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-400 ring-1 ring-violet-500/20">
                {totalPoints > 0
                  ? Math.round(
                      (Math.max(
                        0,
                        (enrollment?.score || 0) - taskEarned - sessionEarned
                      ) /
                        totalPoints) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>

          {/* Graded Task Points */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/2 p-4.5 transition-all duration-300 hover:border-white/20">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                <CheckSquare className="h-3.5 w-3.5" /> Weekly Tasks
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                Points earned from milestone homework assignments and reviewed
                programming tasks.
              </p>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white tabular-nums">
                {taskEarned}
                <span className="ml-1 text-xs font-semibold text-gray-500">
                  /{taskMax} pts
                </span>
              </span>
              <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/20">
                {taskMax > 0 ? Math.round((taskEarned / taskMax) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Sessions Attendance Points */}
          <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/2 p-4.5 transition-all duration-300 hover:border-white/20">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                <Users className="h-3.5 w-3.5" /> Live Sessions
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                Bonus attendance points earned from attending live mentorship
                and cohort group sessions.
              </p>
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white tabular-nums">
                {sessionEarned}
                <span className="ml-1 text-xs font-semibold text-gray-500">
                  pts
                </span>
              </span>
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                {sessionCount} attended
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      {bootcamp?.description && (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            About this bootcamp
          </h2>
          <div className="rounded-xl border border-white/10 bg-white/2 p-5">
            <p className="text-[14px] leading-relaxed whitespace-pre-line text-gray-300">
              {bootcamp.description}
            </p>
          </div>
        </section>
      )}

      {/* What you'll learn */}
      {coursesCount > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            What you&apos;ll learn
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {bootcamp.courses.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/2 p-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-[13px] leading-snug text-gray-300">
                  {c.title}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="h-8" />
    </div>
  );
});

// ─── Lesson Panel ─────────────────────────────────────────────────────────────

const LessonPanel = memo(function LessonPanel({
  lesson,
  lessonProgress,
  allLessons,
  onSelectLesson,
  onSaveNotes,
  onMarkComplete,
  onMarkIncomplete,
  completing,
  isCompleted,
  currentIndex,
  bootcampId,
  onProgressUpdate,
  onRefreshEnrollment,
  isArchived = false,
  currentUser = null,
}) {
  const contentAreaRef = useRef(null);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const initialPosition = lessonProgress[lesson.id]?.last_position || 0;
  const [localCompleted, setLocalCompleted] = useState(isCompleted);

  // Comments: load dynamically when lesson mounts
  const [lessonComments, setLessonComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  useEffect(() => {
    if (!lesson?.id) return;
    let cancelled = false;
    setCommentsLoading(true);
    getLessonCommentsAction(lesson.id).then((data) => {
      if (!cancelled) {
        setLessonComments(data || []);
        setCommentsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lesson?.id]);

  const contentHasPractice = useMemo(() => {
    if (!lesson.content) return false;
    try {
      const parsed =
        typeof lesson.content === 'string'
          ? JSON.parse(lesson.content)
          : lesson.content;
      return Array.isArray(parsed) && parsed.some((b) => b.type === 'practice');
    } catch {
      return false;
    }
  }, [lesson.content]);

  const contentHasExam = useMemo(() => {
    if (!lesson.content) return false;
    try {
      const parsed =
        typeof lesson.content === 'string'
          ? JSON.parse(lesson.content)
          : lesson.content;
      return Array.isArray(parsed) && parsed.some((b) => b.type === 'exam');
    } catch {
      return false;
    }
  }, [lesson.content]);

  const [examSub, setExamSub] = useState(null);
  const [loadingExamSub, setLoadingExamSub] = useState(false);
  const [submittingExam, setSubmittingExam] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [cqAnswerText, setCqAnswerText] = useState('');
  const [cqAnswersByQuestion, setCqAnswersByQuestion] = useState({});

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isRetaking, setIsRetaking] = useState(false);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('mcq');
  const [isMcqRetaking, setIsMcqRetaking] = useState(false);
  const [cqAttachments, setCqAttachments] = useState([]);
  const [cqUploading, setCqUploading] = useState(false);

  const lessonScoreDetails = useMemo(() => {
    const weight = lesson.points ?? 10;

    if (lesson.type === 'video' || lesson.type === 'lesson') {
      const earned = localCompleted ? weight : 0;
      return { earned, total: weight };
    } else if (lesson.type === 'practice') {
      let problems = [];
      try {
        const parsed =
          typeof lesson.content === 'string'
            ? JSON.parse(lesson.content)
            : lesson.content;
        const practiceBlock = parsed?.find((b) => b.type === 'practice');
        problems = practiceBlock?.problems || [];
      } catch {}
      if (!problems || problems.length === 0) {
        problems = parsePracticeProblems(lesson.practice_problems);
      }

      let solvedPoints = 0;
      let totalPoints = 0;
      const solvedIndices = lessonProgress[lesson.id]?.solved_problems || [];

      if (Array.isArray(problems)) {
        problems.forEach((p, idx) => {
          const pts = p.points ?? 5;
          totalPoints += pts;
          if (solvedIndices.includes(idx)) {
            solvedPoints += pts;
          }
        });
      }

      if (totalPoints > 0) {
        const ratio = solvedPoints / totalPoints;
        return { earned: Math.floor(ratio * weight), total: weight };
      } else {
        return { earned: localCompleted ? weight : 0, total: weight };
      }
    } else if (lesson.type === 'exam') {
      let questions = [];
      try {
        const parsed =
          typeof lesson.content === 'string'
            ? JSON.parse(lesson.content)
            : lesson.content;
        const examBlock = parsed?.find((b) => b.type === 'exam');
        questions = examBlock?.questions || [];
      } catch {}
      if (!questions || questions.length === 0) {
        questions =
          lesson.random_question_count > 0 &&
          selectedQuestions &&
          selectedQuestions.length > 0
            ? selectedQuestions
            : lesson.exam_questions || [];
      }

      let examMaxScore = 0;
      if (Array.isArray(questions)) {
        questions.forEach((q) => {
          const isMcq = q.options && q.options.length > 0;
          examMaxScore += q.points ?? (isMcq ? 5 : 10);
        });
      }

      // Use highest score across all attempts (best performance)
      let bestScore = examSub?.score || 0;
      const history = examSub?.submitted_answers?.attempts_history || [];
      if (Array.isArray(history)) {
        history.forEach((attempt) => {
          bestScore = Math.max(bestScore, attempt?.score || 0);
        });
      }

      if (examMaxScore > 0) {
        const ratio = bestScore / examMaxScore;
        return { earned: Math.floor(ratio * weight), total: weight };
      } else {
        return { earned: localCompleted ? weight : 0, total: weight };
      }
    }
    return { earned: localCompleted ? weight : 0, total: weight };
  }, [lesson, lessonProgress, localCompleted, examSub, selectedQuestions]);

  const safeParseNotes = (val) => {
    if (!val) {
      return JSON.stringify([
        { id: crypto.randomUUID(), type: 'richText', content: '' },
      ]);
    }
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return val;
    } catch {}
    return JSON.stringify([
      { id: crypto.randomUUID(), type: 'richText', content: val },
    ]);
  };

  const handleCqFiles = async (files) => {
    if (!files?.length) return;
    setCqUploading(true);
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadTaskAttachmentAction(fd);
      if (res.error) {
        toast.error(res.error);
        continue;
      }
      uploaded.push({
        url: res.url,
        name: res.name,
        size: res.size,
        type: res.type,
      });
    }
    setCqAttachments((prev) => [...prev, ...uploaded]);
    setCqUploading(false);
  };

  const selectNovelQuestions = (allQuestions, attemptsHistory, count) => {
    if (!allQuestions || allQuestions.length === 0) return [];
    const limit = Math.min(count || allQuestions.length, allQuestions.length);

    const seenIds = new Set();
    if (Array.isArray(attemptsHistory)) {
      attemptsHistory.forEach((att) => {
        const qList = att.selected_questions || att.questions;
        if (Array.isArray(qList)) {
          qList.forEach((q) => {
            if (q && q.id) seenIds.add(q.id);
          });
        }
      });
    }

    const unseen = allQuestions.filter((q) => !seenIds.has(q.id));
    const seen = allQuestions.filter((q) => seenIds.has(q.id));

    const shuffle = (arr) => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const shuffledUnseen = shuffle(unseen);
    const shuffledSeen = shuffle(seen);

    const selected = shuffledUnseen.slice(0, limit);
    if (selected.length < limit) {
      const needed = limit - selected.length;
      selected.push(...shuffledSeen.slice(0, needed));
    }

    return selected;
  };

  const handleRetakeMcq = () => {
    if (isArchived) {
      toast.error('This bootcamp is archived. Retaking exams is disabled.');
      return;
    }
    const history = examSub?.submitted_answers?.attempts_history || [];
    const currentAttempt = {
      attempt_number: (history.length || 0) + 1,
      selected_questions: selectedQuestions,
      mcq: mcqAnswers,
      cq: {
        answer: cqAnswerText,
        answers_by_question: cqAnswersByQuestion,
        attachments: cqAttachments,
      },
      score: examSub?.score,
      status: examSub?.status,
      graded_at: examSub?.graded_at,
      graded_by: examSub?.graded_by,
      mentor_remarks: examSub?.mentor_remarks || examSub?.mentor_feedback,
      created_at: examSub?.created_at || new Date().toISOString(),
    };
    const updatedHistory = [...history, currentAttempt];

    const randomCount = lesson.random_question_count;
    const resolvedQs = parseExamQuestions(lesson.exam_questions, lesson);
    const qs =
      randomCount > 0
        ? selectNovelQuestions(resolvedQs, updatedHistory, randomCount)
        : resolvedQs;

    setSelectedQuestions(qs);
    setMcqAnswers({});
    setIsMcqRetaking(true);
    setSelectedAttemptIndex(-1);
    toast.success('Started a new MCQ attempt with fresh questions!');
  };

  const handleRetakeCq = () => {
    if (isArchived) {
      toast.error('This bootcamp is archived. Retaking exams is disabled.');
      return;
    }
    const history = examSub?.submitted_answers?.attempts_history || [];
    const currentAttempt = {
      attempt_number: (history.length || 0) + 1,
      selected_questions: selectedQuestions,
      mcq: mcqAnswers,
      cq: {
        answer: cqAnswerText,
        answers_by_question: cqAnswersByQuestion,
        attachments: cqAttachments,
      },
      score: examSub?.score,
      status: examSub?.status,
      graded_at: examSub?.graded_at,
      graded_by: examSub?.graded_by,
      mentor_remarks: examSub?.mentor_remarks || examSub?.mentor_feedback,
      created_at: examSub?.created_at || new Date().toISOString(),
    };
    const updatedHistory = [...history, currentAttempt];

    const randomCount = lesson.random_question_count;
    const resolvedQs = parseExamQuestions(lesson.exam_questions, lesson);
    const qs =
      randomCount > 0
        ? selectNovelQuestions(resolvedQs, updatedHistory, randomCount)
        : resolvedQs;

    setSelectedQuestions(qs);
    setCqAnswerText(
      JSON.stringify([
        { id: crypto.randomUUID(), type: 'richText', content: '' },
      ])
    );
    setCqAnswersByQuestion({});
    setCqAttachments([]);
    setIsRetaking(true);
    setSelectedAttemptIndex(-1);
    toast.success('Started a new CQ attempt with fresh questions!');
  };

  const handleMcqSubmit = async () => {
    if (isArchived) {
      toast.error('This bootcamp is archived. Exam submissions are disabled.');
      return;
    }
    const allQuestions =
      lesson.random_question_count > 0 &&
      selectedQuestions &&
      selectedQuestions.length > 0
        ? selectedQuestions
        : parseExamQuestions(lesson.exam_questions, lesson);
    const activeQuestions = allQuestions.filter(
      (q) => Array.isArray(q.options) && q.options.length > 0
    );

    const unanswered = activeQuestions.filter(
      (q) => mcqAnswers[q.id] === undefined
    );
    if (unanswered.length > 0) {
      toast.error(
        `Please answer all MCQ questions before submitting. (${unanswered.length} remaining)`
      );
      return;
    }

    let mcqScore = 0;
    activeQuestions.forEach((q) => {
      if (mcqAnswers[q.id] === q.correct_option) {
        mcqScore += q.points || 5;
      }
    });

    const history = examSub?.submitted_answers?.attempts_history || [];
    let updatedHistory = history;
    if (
      (isMcqRetaking || examSub?.submitted_answers?.mcq_submitted) &&
      examSub
    ) {
      const lastAttemptNum = history.length + 1;
      const previousAttempt = {
        attempt_number: lastAttemptNum,
        selected_questions: selectedQuestions,
        mcq: examSub.submitted_answers?.mcq || {},
        cq: {
          answer: examSub.submitted_answers?.cq?.answer || '',
          answers_by_question:
            examSub.submitted_answers?.cq?.answers_by_question || {},
          attachments: Array.isArray(examSub.submitted_answers?.cq?.attachments)
            ? examSub.submitted_answers.cq.attachments
            : [],
        },
        score: examSub.score,
        status: examSub.status,
        graded_at: examSub.graded_at,
        graded_by: examSub.graded_by,
        mentor_remarks: examSub.mentor_remarks || examSub.mentor_feedback,
        created_at: examSub.created_at || new Date().toISOString(),
      };
      updatedHistory = [...history, previousAttempt];
    }

    const answersPayload = {
      ...examSub?.submitted_answers,
      mcq: mcqAnswers,
      selected_questions: selectedQuestions,
      mcq_submitted: true,
      mcq_score: mcqScore,
      mcq_submitted_at: new Date().toISOString(),
      attempt_number: updatedHistory.length + 1,
      attempts_history: updatedHistory,
    };

    const isMcqOnly = lesson.exam_type === 'mcq';
    const maxPoints = activeQuestions.reduce(
      (acc, q) => acc + (q.points || 5),
      0
    );
    const finalScore = isMcqOnly ? mcqScore : examSub?.score || mcqScore;
    const finalStatus = isMcqOnly ? 'reviewed' : examSub?.status || 'submitted';

    setSubmittingExam(true);
    try {
      const res = await submitExamSubmission(
        lesson.id,
        bootcampId,
        answersPayload,
        finalScore,
        finalStatus
      );
      setExamSub(res);
      setIsMcqRetaking(false);
      setSelectedAttemptIndex(-1);
      toast.success(
        `MCQ section graded! You scored ${mcqScore} / ${maxPoints} points.`
      );
      if (isMcqOnly) {
        onMarkComplete(lesson.id);
      }
      if (onRefreshEnrollment) {
        onRefreshEnrollment();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit MCQ answers');
    } finally {
      setSubmittingExam(false);
    }
  };

  const handleCqSubmit = async () => {
    if (isArchived) {
      toast.error('This bootcamp is archived. Exam submissions are disabled.');
      return;
    }
    // Validate: at least one question answer must have content, or there's an attachment
    const hasAnyAnswer = Object.values(cqAnswersByQuestion).some((val) => {
      if (!val) return false;
      try {
        const blocks = JSON.parse(val);
        return (
          Array.isArray(blocks) &&
          blocks.some((b) => b.content && b.content.trim() !== '')
        );
      } catch {
        return String(val).trim() !== '';
      }
    });

    if (!hasAnyAnswer && cqAttachments.length === 0) {
      toast.error(
        'Please answer at least one question or upload an attachment before submitting.'
      );
      return;
    }

    const history = examSub?.submitted_answers?.attempts_history || [];
    let updatedHistory = history;
    if ((isRetaking || examSub?.submitted_answers?.cq_submitted) && examSub) {
      const lastAttemptNum = history.length + 1;
      const previousAttempt = {
        attempt_number: lastAttemptNum,
        selected_questions: selectedQuestions,
        mcq: examSub.submitted_answers?.mcq || {},
        cq: {
          answer:
            examSub.submitted_answers?.cq?.answer ||
            examSub.submitted_answers?.answer ||
            '',
          answers_by_question:
            examSub.submitted_answers?.cq?.answers_by_question || {},
          attachments: Array.isArray(examSub.submitted_answers?.cq?.attachments)
            ? examSub.submitted_answers.cq.attachments
            : Array.isArray(examSub.submitted_answers?.attachments)
              ? examSub.submitted_answers.attachments
              : [],
        },
        score: examSub.score,
        status: examSub.status,
        graded_at: examSub.graded_at,
        graded_by: examSub.graded_by,
        mentor_remarks: examSub.mentor_remarks || examSub.mentor_feedback,
        created_at: examSub.created_at || new Date().toISOString(),
      };
      updatedHistory = [...history, previousAttempt];
    }

    const answersPayload = {
      ...examSub?.submitted_answers,
      selected_questions: selectedQuestions,
      cq: {
        answer: cqAnswerText,
        answers_by_question: cqAnswersByQuestion,
        attachments: cqAttachments,
      },
      cq_submitted: true,
      cq_submitted_at: new Date().toISOString(),
      attempt_number: updatedHistory.length + 1,
      attempts_history: updatedHistory,
    };

    const finalStatus = 'pending_review';
    const finalScore = examSub?.score || 0;

    setSubmittingExam(true);
    try {
      const res = await submitExamSubmission(
        lesson.id,
        bootcampId,
        answersPayload,
        finalScore,
        finalStatus
      );
      setExamSub(res);
      setIsRetaking(false);
      toast.success(
        'Subjective solution successfully submitted to your mentor!'
      );
      if (onRefreshEnrollment) {
        onRefreshEnrollment();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit CQ solution');
    } finally {
      setSubmittingExam(false);
    }
  };

  // Load exam submission if item is an exam
  useEffect(() => {
    if (lesson.type === 'exam') {
      setLoadingExamSub(true);
      setIsRetaking(false);
      setSelectedAttemptIndex(-1);
      setActiveTab(lesson.exam_type === 'cq' ? 'cq' : 'mcq');
      setIsMcqRetaking(false);
      getExamSubmission(lesson.id)
        .then((res) => {
          setExamSub(res);
          const allQuestions = parseExamQuestions(
            lesson.exam_questions,
            lesson
          );
          if (res) {
            const attemptAnswers = res.submitted_answers;
            if (attemptAnswers?.selected_questions) {
              setSelectedQuestions(attemptAnswers.selected_questions);
            } else {
              setSelectedQuestions(allQuestions);
            }

            if (lesson.exam_type === 'mcq') {
              setMcqAnswers(attemptAnswers?.mcq || attemptAnswers || {});
            } else if (lesson.exam_type === 'cq') {
              setCqAnswerText(
                safeParseNotes(
                  attemptAnswers?.cq?.answer || attemptAnswers?.answer
                )
              );
              setCqAnswersByQuestion(
                attemptAnswers?.cq?.answers_by_question || {}
              );
              setCqAttachments(
                Array.isArray(attemptAnswers?.cq?.attachments)
                  ? attemptAnswers.cq.attachments
                  : []
              );
            } else if (lesson.exam_type === 'hybrid') {
              setMcqAnswers(attemptAnswers?.mcq || {});
              setCqAnswerText(safeParseNotes(attemptAnswers?.cq?.answer));
              setCqAnswersByQuestion(
                attemptAnswers?.cq?.answers_by_question || {}
              );
              setCqAttachments(
                Array.isArray(attemptAnswers?.cq?.attachments)
                  ? attemptAnswers.cq.attachments
                  : []
              );
            }
          } else {
            if (lesson.random_question_count > 0) {
              const qs = selectNovelQuestions(
                allQuestions,
                [],
                lesson.random_question_count
              );
              setSelectedQuestions(qs);
            } else {
              setSelectedQuestions(allQuestions);
            }
            setMcqAnswers({});
            setCqAnswerText(
              JSON.stringify([
                { id: crypto.randomUUID(), type: 'richText', content: '' },
              ])
            );
            setCqAnswersByQuestion({});
            setCqAttachments([]);
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoadingExamSub(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  useEffect(() => {
    setLocalCompleted(isCompleted);
  }, [isCompleted]);

  // Reset scroll to top when switching lessons
  useEffect(() => {
    if (contentAreaRef.current) contentAreaRef.current.scrollTop = 0;
  }, [lesson.id]);

  // Serialize per-lesson ticks: if a previous save is still flying, queue this
  // delta onto it so we never read-modify-write the same row in parallel.
  const pendingSaveRef = useRef(Promise.resolve());
  const handleProgress = useCallback(
    (progressData) => {
      const delta = Math.floor(progressData.deltaSeconds || 0);
      const ct = progressData.currentTime;
      const pos = ct == null ? null : Math.floor(Number(ct) || 0);
      const lessonId = lesson.id;
      const bId = bootcampId;

      // Update client state immediately so navigations and stats sync in real time
      if (onProgressUpdate) {
        onProgressUpdate((prev) => {
          const currentProgress = prev[lessonId] || {};
          const currentWatchTime = Number(currentProgress.watch_time) || 0;
          return {
            ...prev,
            [lessonId]: {
              ...currentProgress,
              last_position: pos !== null ? pos : currentProgress.last_position,
              watch_time: currentWatchTime + delta,
            },
          };
        });
      }

      // Local-date string so the chart's local-day bucketing matches what gets
      // written. Without this, late-night sessions land on yesterday's UTC date.
      const d = new Date();
      const activityDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const next = pendingSaveRef.current
        .catch(() => {})
        .then(async () => {
          try {
            await Promise.all([
              updateWatchTimeDelta(lessonId, delta, pos, bId),
              delta > 0 && bId
                ? recordLearningActivity({
                    bootcampId: bId,
                    lessonId,
                    deltaSeconds: delta,
                    activityDate,
                  })
                : null,
            ]);
          } catch (err) {
            console.error(
              '[Progress Tracking Error]: Failed to update user watch time:',
              err
            );
          }
        });
      pendingSaveRef.current = next;
      return next;
    },
    [lesson.id, bootcampId, onProgressUpdate]
  );

  const handleVideoComplete = useCallback(async () => {
    if (isArchived) return;
    if (!localCompleted) {
      setLocalCompleted(true);
      onMarkComplete(lesson.id);
    }
  }, [lesson.id, localCompleted, onMarkComplete, isArchived]);

  const handleToggle = useCallback(() => {
    if (isArchived) return;
    if (localCompleted) {
      setLocalCompleted(false);
      onMarkIncomplete(lesson.id);
    } else {
      setLocalCompleted(true);
      onMarkComplete(lesson.id);
    }
  }, [lesson.id, localCompleted, onMarkComplete, onMarkIncomplete, isArchived]);

  const getExamPlayer = (overrideQuestions = null) => {
    if (lesson.type !== 'exam') return null;

    if (loadingExamSub) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm font-medium text-gray-500">
            Loading exam details...
          </p>
        </div>
      );
    }

    const activeQuestions =
      overrideQuestions ||
      (lesson.random_question_count > 0 &&
      selectedQuestions &&
      selectedQuestions.length > 0
        ? selectedQuestions
        : parseExamQuestions(lesson.exam_questions, lesson));

    // Derive displayed attempt values if viewing a completed submission
    const history = examSub?.submitted_answers?.attempts_history || [];
    const displayedAttempt = (() => {
      if (!examSub) return null;
      if (selectedAttemptIndex >= 0 && selectedAttemptIndex < history.length) {
        return history[selectedAttemptIndex];
      }
      return {
        attempt_number:
          examSub.submitted_answers?.attempt_number || history.length + 1,
        selected_questions:
          examSub.submitted_answers?.selected_questions || selectedQuestions,
        mcq:
          examSub.submitted_answers?.mcq ||
          (lesson.exam_type === 'mcq'
            ? examSub.submitted_answers?.mcq || examSub.submitted_answers
            : {}),
        cq: {
          answer: safeParseNotes(
            examSub.submitted_answers?.cq?.answer ||
              examSub.submitted_answers?.answer
          ),
          answers_by_question:
            examSub.submitted_answers?.cq?.answers_by_question ||
            examSub.submitted_answers?.answers_by_question ||
            {},
          attachments: Array.isArray(examSub.submitted_answers?.cq?.attachments)
            ? examSub.submitted_answers.cq.attachments
            : Array.isArray(examSub.submitted_answers?.attachments)
              ? examSub.submitted_answers.attachments
              : [],
        },
        score: examSub.score,
        status: examSub.status,
        graded_at: examSub.graded_at,
        graded_by: examSub.graded_by,
        mentor_remarks: examSub.mentor_remarks || examSub.mentor_feedback,
        created_at: examSub.created_at,
      };
    })();

    const displayedQuestions =
      displayedAttempt?.selected_questions || activeQuestions || [];
    const displayedMcqAnswers = displayedAttempt?.mcq || {};
    const displayedCqAnswerText = displayedAttempt?.cq?.answer || '';
    const displayedCqAttachments = displayedAttempt?.cq?.attachments || [];
    const displayedScore = displayedAttempt?.score;
    const displayedStatus = displayedAttempt?.status;
    const displayedMentorRemarks = displayedAttempt?.mentor_remarks;

    const maxPoints =
      examSub && !isRetaking
        ? displayedQuestions.reduce((acc, q) => acc + (q.points || 5), 0)
        : activeQuestions.reduce((acc, q) => acc + (q.points || 5), 0);

    const mcqMaxPoints = (
      examSub && !isRetaking ? displayedQuestions : activeQuestions
    )
      .filter((q) => Array.isArray(q.options) && q.options.length > 0)
      .reduce((acc, q) => acc + (q.points || 5), 0);

    const isMcq = lesson.exam_type === 'mcq';
    const isCq = lesson.exam_type === 'cq';
    const isHybrid = lesson.exam_type === 'hybrid';

    // Track submission status per section
    const isMcqSubmitted = !!(
      examSub?.submitted_answers?.mcq_submitted ||
      (isMcq && examSub)
    );
    const isCqSubmitted = !!(
      examSub?.submitted_answers?.cq_submitted ||
      (isCq && examSub)
    );

    // Fully completed state for the whole exam lesson
    const isFullySubmitted = isMcq
      ? isMcqSubmitted
      : isCq
        ? isCqSubmitted
        : isMcqSubmitted && isCqSubmitted;

    // Graded/Submitted status card and reviews when fully complete
    if (isFullySubmitted && !isRetaking && !isMcqRetaking) {
      return (
        <div className="space-y-6">
          {/* Graded/Submitted status card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-violet-600/[0.08] to-transparent p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-400">
                  <Trophy className="h-3.5 w-3.5" />
                  {isHybrid
                    ? 'Hybrid MCQ & CQ Exam'
                    : isMcq
                      ? 'Auto-Graded MCQ Exam'
                      : 'Subjective CQ Exam'}
                </span>
                <h3 className="mt-2 text-lg font-bold text-white">
                  {isMcq
                    ? 'Exam Finished'
                    : displayedStatus === 'reviewed'
                      ? 'Solution Reviewed'
                      : 'Solution Submitted'}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Submitted on{' '}
                  {new Date(
                    displayedAttempt?.created_at || examSub.created_at
                  ).toLocaleDateString()}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-3">
                <div className="w-full shrink-0 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center sm:w-36">
                  <p className="text-[10px] font-bold tracking-wider text-gray-600 uppercase">
                    Score / Grade
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-white">
                    {displayedStatus === 'reviewed' || isMcq ? (
                      <>
                        <span className="text-emerald-400">
                          {displayedScore}
                        </span>
                        <span className="text-sm text-gray-600">
                          {' '}
                          / {maxPoints || 100} pts
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-amber-400">
                        Pending Review
                      </span>
                    )}
                  </p>
                </div>

                {!isCq && !isArchived && (
                  <button
                    type="button"
                    onClick={
                      isMcq || isHybrid ? handleRetakeMcq : handleRetakeCq
                    }
                    className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-[10px] font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 active:scale-95"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retake Exam
                  </button>
                )}
              </div>
            </div>

            {displayedMentorRemarks && (
              <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
                    Mentor Feedback
                  </h4>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-300 italic">
                  &ldquo;{displayedMentorRemarks}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* NOTE: lesson content/instructions are rendered once by the parent LessonContentRenderer.
               No duplicate rendering needed here. */}

          {/* Attempt Selector Pill Row */}
          {history.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.02] to-transparent p-5">
              <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Attempt History
              </h4>
              <div className="flex flex-wrap gap-2">
                {history.map((att, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAttemptIndex(idx)}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                      selectedAttemptIndex === idx
                        ? 'border-violet-500/40 bg-violet-500/20 text-violet-300 shadow-md shadow-violet-500/10'
                        : 'border-white/5 bg-zinc-900/60 text-gray-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <span>Attempt {idx + 1}</span>
                    <span className="text-[10px] font-normal opacity-75">
                      (
                      {att.score != null
                        ? `${att.score} pts`
                        : att.status === 'reviewed'
                          ? `${att.score || 0} pts`
                          : 'Pending'}
                      )
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAttemptIndex(-1)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                    selectedAttemptIndex === -1
                      ? 'border-violet-500/50 bg-violet-600/30 text-white shadow-md shadow-violet-500/10'
                      : 'border-white/5 bg-zinc-900/60 text-gray-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <span>Latest (Attempt {history.length + 1})</span>
                  <span className="text-[10px] font-normal opacity-75">
                    (
                    {examSub.status === 'reviewed' || isMcq
                      ? `${examSub.score || 0} pts`
                      : 'Pending'}
                    )
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Submitted content read-only view */}
          <div className="space-y-6">
            {(isMcq || isHybrid) && (
              <div className="space-y-6">
                <h4 className="text-sm font-bold tracking-wider text-white uppercase">
                  Question Review
                </h4>
                {displayedQuestions.map((q, qIdx) => {
                  const selectedOpt = displayedMcqAnswers[q.id];
                  const isCorrect = selectedOpt === q.correct_option;

                  return (
                    <div
                      key={q.id || qIdx}
                      className={`space-y-4 rounded-xl border p-5 ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-red-500/20 bg-red-500/[0.02]'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isCorrect ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border border-red-500/20 bg-red-500/10 text-red-400'}`}
                          >
                            {qIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            Question {qIdx + 1}
                          </span>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                        >
                          {isCorrect
                            ? `+${q.points || 5} Points`
                            : `0 / ${q.points || 5} Points`}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-white">
                        <MarkdownDesc
                          text={q.question}
                          className="text-white [&_p]:text-sm [&_p]:font-semibold [&_p]:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(q.options || ['', '', '', '']).map((opt, optIdx) => {
                          const optLabels = ['A', 'B', 'C', 'D'];
                          const isStudentSelect = selectedOpt === optIdx;
                          const isCorrectAnswer = q.correct_option === optIdx;

                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs ${
                                isCorrectAnswer
                                  ? 'border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-300'
                                  : isStudentSelect
                                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                    : 'border-white/5 bg-white/[0.02] text-gray-400'
                              }`}
                            >
                              <span>
                                {optLabels[optIdx]}. {opt}
                              </span>
                              {isCorrectAnswer ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                              ) : isStudentSelect ? (
                                <X className="h-3.5 w-3.5 shrink-0 text-red-400" />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(isCq || isHybrid) &&
              (() => {
                const cqQs = displayedQuestions.filter(
                  (q) => !Array.isArray(q.options) || q.options.length === 0
                );
                const submittedByQuestion =
                  displayedAttempt?.cq?.answers_by_question || {};
                return (
                  <div className="space-y-5">
                    <h4 className="text-sm font-bold tracking-wider text-white uppercase">
                      Your Submitted Solution
                    </h4>

                    {/* Per-question submitted answers */}
                    {cqQs.length > 0 ? (
                      <div className="space-y-4">
                        {cqQs.map((q, idx) => {
                          const qId = q.id || String(idx);
                          const answerText =
                            submittedByQuestion[qId] ||
                            (cqQs.length === 1 ? displayedCqAnswerText : '') ||
                            '';
                          return (
                            <div
                              key={qId}
                              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
                            >
                              <div className="flex items-start gap-3 border-b border-white/5 bg-white/[0.01] px-4 py-3">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <MarkdownDesc
                                    text={q.question}
                                    className="text-slate-200 [&_p]:text-xs [&_p]:font-semibold [&_p]:text-slate-200"
                                  />
                                  {q.points != null && (
                                    <span className="mt-1 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                      {q.points} pts
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="px-4 py-3">
                                <span className="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                                  Your Answer
                                </span>
                                {answerText ? (
                                  <TaskDescriptionRenderer
                                    content={answerText}
                                  />
                                ) : (
                                  <p className="text-xs text-gray-600 italic">
                                    No answer provided for this question.
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : displayedCqAnswerText ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <h5 className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">
                          Written Answer
                        </h5>
                        <TaskDescriptionRenderer
                          content={displayedCqAnswerText}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">
                        No subjective answers were submitted.
                      </p>
                    )}

                    {displayedCqAttachments &&
                      displayedCqAttachments.length > 0 && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                          <h5 className="mb-2 font-sans text-xs font-bold tracking-wider text-gray-500 uppercase">
                            Attachments
                          </h5>
                          <AttachmentList files={displayedCqAttachments} />
                        </div>
                      )}
                  </div>
                );
              })()}
          </div>
        </div>
      );
    }

    // Interactive Exam taking view
    return (
      <div className="space-y-6">
        {/* Upper card */}
        <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.02] to-transparent p-5">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <GraduationCap className="h-5 w-5 text-violet-400" />
            Interactive Exam Player
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {isHybrid
              ? 'This is a Hybrid Exam. Step 1 (MCQ Assessment) is evaluated automatically. Step 2 (CQ Solution) is graded manually by your mentor.'
              : isMcq
                ? `Answer all ${activeQuestions.length} questions to complete the exam. Auto-graded instantly.`
                : 'Review the task description, guidelines, and submit your written explanation or code repository below for review.'}
          </p>
        </div>

        {isArchived && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 text-[12.5px] leading-normal font-medium text-amber-300 shadow-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              This bootcamp is archived. The exam player is in read-only mode,
              and retakes/submissions are disabled.
            </span>
          </div>
        )}

        {/* NOTE: lesson content/instructions are rendered once by the parent LessonContentRenderer.
             No duplicate rendering needed here. */}

        {/* Tab switcher for Hybrid */}
        {isHybrid && (
          <div className="flex gap-1 rounded-xl border-b border-white/10 bg-white/[0.01] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('mcq')}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold tracking-wider uppercase transition-all ${
                activeTab === 'mcq'
                  ? 'border border-violet-500/30 bg-violet-600/20 text-violet-300'
                  : 'border border-transparent bg-transparent text-gray-500 hover:text-white'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Step 1: MCQ Assessment
              {isMcqSubmitted && !isMcqRetaking && (
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                  Graded
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cq')}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold tracking-wider uppercase transition-all ${
                activeTab === 'cq'
                  ? 'border border-violet-500/30 bg-violet-600/20 text-violet-300'
                  : 'border border-transparent bg-transparent text-gray-500 hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Step 2: Subjective Task (CQ)
              {isCqSubmitted && (
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                  Submitted
                </span>
              )}
            </button>
          </div>
        )}

        {/* Content rendering depending on active tab */}
        {activeTab === 'mcq' && (isMcq || isHybrid) && (
          <div className="space-y-6">
            {/* If MCQ is already submitted and we are NOT retaking, show evaluated reviews + a retake button! */}
            {isMcqSubmitted && !isMcqRetaking ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      MCQ Section Graded
                    </h4>
                    <p className="mt-1 text-xs text-gray-400">
                      You scored{' '}
                      <span className="font-bold text-emerald-400">
                        {examSub?.submitted_answers?.mcq_score ||
                          examSub?.score ||
                          0}
                      </span>{' '}
                      out of {mcqMaxPoints} points on your latest MCQ attempt.
                    </p>
                  </div>
                  {!isArchived && (
                    <button
                      type="button"
                      onClick={handleRetakeMcq}
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 active:scale-95"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retake MCQ Section
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Question Evaluation Review
                  </h4>
                  {activeQuestions.map((q, qIdx) => {
                    const selectedOpt = mcqAnswers[q.id];
                    const isCorrect = selectedOpt === q.correct_option;

                    return (
                      <div
                        key={q.id || qIdx}
                        className={`space-y-4 rounded-xl border p-5 ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-red-500/20 bg-red-500/[0.02]'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isCorrect ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border border-red-500/20 bg-red-500/10 text-red-400'}`}
                            >
                              {qIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-500">
                              Question {qIdx + 1}
                            </span>
                          </div>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                          >
                            {isCorrect
                              ? `+${q.points || 5} Points`
                              : `0 / ${q.points || 5} Points`}
                          </span>
                        </div>

                        <div className="text-sm font-semibold text-white">
                          <MarkdownDesc
                            text={q.question}
                            className="text-white [&_p]:text-sm [&_p]:font-semibold [&_p]:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {(q.options || ['', '', '', '']).map(
                            (opt, optIdx) => {
                              const optLabels = ['A', 'B', 'C', 'D'];
                              const isStudentSelect = selectedOpt === optIdx;
                              const isCorrectAnswer =
                                q.correct_option === optIdx;

                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs ${
                                    isCorrectAnswer
                                      ? 'border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-300'
                                      : isStudentSelect
                                        ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                        : 'border-white/5 bg-white/[0.02] text-gray-400'
                                  }`}
                                >
                                  <span>
                                    {optLabels[optIdx]}. {opt}
                                  </span>
                                  {isCorrectAnswer ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                  ) : isStudentSelect ? (
                                    <X className="h-3.5 w-3.5 shrink-0 text-red-400" />
                                  ) : null}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Interactive MCQ taker cards
              <div className="space-y-6">
                {activeQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                        {qIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-500">
                        Question {qIdx + 1} of {activeQuestions.length}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white">
                      <MarkdownDesc
                        text={q.question}
                        className="text-white [&_p]:text-sm [&_p]:font-semibold [&_p]:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(q.options || ['', '', '', '']).map((opt, optIdx) => {
                        const optLabels = ['A', 'B', 'C', 'D'];
                        const isSelected = mcqAnswers[q.id] === optIdx;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              if (isArchived) return;
                              setMcqAnswers((p) => ({ ...p, [q.id]: optIdx }));
                            }}
                            disabled={isArchived}
                            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-xs transition-all ${
                              isArchived
                                ? 'cursor-not-allowed border-white/5 opacity-60'
                                : 'cursor-pointer'
                            } ${
                              isSelected
                                ? 'border-violet-500 bg-violet-500/10 font-semibold text-white'
                                : 'border-white/5 bg-white/[0.01] text-gray-400 hover:border-white/15 hover:bg-white/5'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                                isSelected
                                  ? 'animate-pulse bg-violet-500 text-white'
                                  : 'bg-white/10 text-gray-400'
                              }`}
                            >
                              {optLabels[optIdx]}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!isArchived && (
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      disabled={submittingExam}
                      onClick={handleMcqSubmit}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-50"
                    >
                      {submittingExam ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Submit & Grade MCQ Answers
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cq' && (isCq || isHybrid) && (
          <div className="space-y-6">
            {(() => {
              // Only subjective questions (no options array = CQ question)
              const cqQuestions = displayedQuestions.filter(
                (q) => !Array.isArray(q.options) || q.options.length === 0
              );
              // Per-question submitted answers from the current displayed attempt
              const submittedByQuestion =
                displayedAttempt?.cq?.answers_by_question ||
                displayedAttempt?.answers_by_question ||
                {};

              if (isCqSubmitted) {
                return (
                  // ── Read-only submitted view ──────────────────────────────
                  <div className="space-y-5">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-white">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Subjective Answers Submitted
                      </h4>
                      <p className="mt-1 text-xs text-gray-400">
                        Your subjective CQ answers have been submitted to your
                        mentor for manual grading.
                      </p>
                    </div>

                    {/* Per-question submitted answers */}
                    {cqQuestions.length > 0 && (
                      <div className="space-y-4">
                        {cqQuestions.map((q, idx) => {
                          const qId = q.id || String(idx);
                          const answerText =
                            submittedByQuestion[qId] ||
                            displayedCqAnswerText ||
                            '';
                          return (
                            <div
                              key={qId}
                              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
                            >
                              {/* Question */}
                              <div className="flex items-start gap-3 border-b border-white/5 bg-white/[0.01] px-4 py-3">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs leading-relaxed font-semibold text-slate-200">
                                    <MarkdownDesc
                                      text={q.question}
                                      className="text-slate-200 [&_p]:text-xs [&_p]:font-semibold [&_p]:text-slate-200"
                                    />
                                  </div>
                                  {q.points != null && (
                                    <span className="mt-1 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                      {q.points} pts
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Answer */}
                              <div className="px-4 py-3">
                                <span className="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                                  Your Answer
                                </span>
                                {answerText ? (
                                  <TaskDescriptionRenderer
                                    content={answerText}
                                  />
                                ) : (
                                  <p className="text-xs text-gray-600 italic">
                                    No answer provided for this question.
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Legacy general answer fallback if no per-question */}
                    {cqQuestions.length === 0 && displayedCqAnswerText && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                        <h5 className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">
                          Your Explanation
                        </h5>
                        <TaskDescriptionRenderer
                          content={displayedCqAnswerText}
                        />
                      </div>
                    )}

                    {displayedCqAttachments?.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <h5 className="font-sans text-xs font-bold tracking-wider text-gray-500 uppercase">
                          Attachments
                        </h5>
                        <AttachmentList files={displayedCqAttachments} />
                      </div>
                    )}
                  </div>
                );
              }

              // ── Interactive CQ Form ───────────────────────────────────────
              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-violet-400" />
                    <h4 className="font-sans text-xs font-bold tracking-wider text-white uppercase">
                      Answer Each Question
                    </h4>
                    <span className="ml-auto font-mono text-[10px] text-gray-500">
                      {cqQuestions.length} question
                      {cqQuestions.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Per-question answer editors */}
                  {cqQuestions.length > 0 ? (
                    <div className="space-y-5">
                      {cqQuestions.map((q, idx) => {
                        const qId = q.id || String(idx);
                        const answerVal = cqAnswersByQuestion[qId] || '';
                        return (
                          <div
                            key={qId}
                            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.015]"
                          >
                            {/* Question header */}
                            <div className="flex items-start gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs leading-relaxed font-semibold text-slate-100">
                                  <MarkdownDesc
                                    text={q.question}
                                    className="text-slate-100 [&_p]:text-xs [&_p]:font-semibold [&_p]:text-slate-100"
                                  />
                                </div>
                                {q.points != null && (
                                  <span className="mt-1.5 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                    {q.points} pts
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Answer editor */}
                            <div className="p-3">
                              <span className="mb-2 block font-sans text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                                Your Answer
                              </span>
                              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/10">
                                <MultiBlockEditor
                                  value={answerVal}
                                  onChange={(val) =>
                                    setCqAnswersByQuestion((prev) => ({
                                      ...prev,
                                      [qId]: val,
                                    }))
                                  }
                                  readOnly={isArchived}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Fallback: no structured questions — show single editor
                    <div className="space-y-2">
                      <label className="block font-sans text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        Explanation / Remarks (Required)
                      </label>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/10">
                        <MultiBlockEditor
                          value={cqAnswerText}
                          onChange={setCqAnswerText}
                          readOnly={isArchived}
                        />
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  <div className="space-y-2 border-t border-white/5 pt-2">
                    <label className="block font-sans text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                      Attachments (Optional)
                    </label>
                    <AttachmentList
                      files={cqAttachments}
                      onRemove={
                        isArchived
                          ? undefined
                          : (i) =>
                              setCqAttachments((prev) =>
                                prev.filter((_, j) => j !== i)
                              )
                      }
                    />
                    <input
                      type="file"
                      multiple
                      onChange={(e) =>
                        handleCqFiles(Array.from(e.target.files || []))
                      }
                      className="hidden"
                      id="cq-file-input"
                    />
                    {!isArchived && (
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById('cq-file-input')?.click()
                        }
                        disabled={cqUploading}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
                      >
                        {cqUploading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        {cqUploading ? 'Uploading…' : 'Add files'}
                      </button>
                    )}
                  </div>

                  {!isArchived && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={submittingExam || cqUploading}
                        onClick={handleCqSubmit}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-violet-600 px-6 py-3 font-sans text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-50"
                      >
                        {submittingExam ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Submit CQ Solution to Mentor
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const examPlayer = getExamPlayer();

  const hasVideo =
    lesson.video_source &&
    lesson.video_source !== 'none' &&
    (lesson.video_id || lesson.video_url);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Scrollable content + TOC */}
      <div className="flex flex-1 overflow-hidden">
        <div
          ref={contentAreaRef}
          className="spa-scroll min-w-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-5xl space-y-5 p-4 pb-8 sm:p-6 lg:p-8 2xl:max-w-6xl">
            {/* Lesson title */}
            <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.04] to-transparent p-4 sm:p-5">
              <h1 className="text-lg leading-tight font-extrabold tracking-tight text-white sm:text-xl lg:text-2xl">
                {lesson.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 uppercase">
                  {lesson.type || 'lesson'}
                </span>
                <span className="flex items-center gap-1 rounded border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-400">
                  <Award className="h-3 w-3 text-amber-400" />
                  Score: {lessonScoreDetails.earned} /{' '}
                  {lessonScoreDetails.total} pts
                </span>
                {lesson.duration > 0 && (
                  <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <Clock className="h-3.5 w-3.5" />{' '}
                    {formatDurationFull(lesson.duration)}
                  </span>
                )}
                {hasVideo && (
                  <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <Play className="h-3.5 w-3.5" /> Video lesson
                  </span>
                )}
                {localCompleted && (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                  </span>
                )}
              </div>
            </div>

            <>
              {/* Video — keyed so it remounts cleanly between lessons */}
              {hasVideo && (
                <VideoPlayer
                  key={lesson.id}
                  lesson={lesson}
                  initialPosition={initialPosition}
                  onProgress={handleProgress}
                  onComplete={handleVideoComplete}
                />
              )}

              {/* Completion toggle */}
              <div
                className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                  localCompleted
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-white/10 bg-white/2'
                }`}
              >
                <div className="flex items-center gap-3">
                  {localCompleted ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-gray-600" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-semibold ${localCompleted ? 'text-emerald-300' : 'text-white'}`}
                    >
                      {localCompleted ? 'Completed!' : 'Mark as complete'}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {localCompleted
                        ? 'Great work — keep going!'
                        : 'Mark done when finished'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={completing || isArchived}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                    localCompleted
                      ? 'border border-emerald-500/25 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500'
                  }`}
                >
                  {completing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {localCompleted ? '✓ Done' : 'Complete Curriculum Item'}
                </button>
              </div>

              {/* Rich content */}
              {lesson.content ? (
                <Suspense fallback={<ChunkFallback label="Loading content…" />}>
                  <LessonContentRenderer
                    key={lesson.id}
                    content={lesson.content}
                    lessonId={lesson.id}
                    onProgress={handleProgress}
                    onComplete={handleVideoComplete}
                    initialPosition={initialPosition}
                    practiceProblemsComponent={(problems) => (
                      <PracticeProblemsCockpit
                        lesson={{
                          ...lesson,
                          practice_problems: problems,
                        }}
                        lessonProgress={lessonProgress}
                        onProgressUpdate={onProgressUpdate}
                        bootcampId={bootcampId}
                        onRefreshEnrollment={onRefreshEnrollment}
                        isArchived={isArchived}
                      />
                    )}
                    examComponent={(questions) => getExamPlayer(questions)}
                  />
                </Suspense>
              ) : lesson._pendingContent ? (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/2 p-5">
                  <div className="spa-skeleton h-3 w-full rounded" />
                  <div className="spa-skeleton h-3 w-11/12 rounded" />
                  <div className="spa-skeleton h-3 w-9/12 rounded" />
                  <div className="spa-skeleton h-3 w-10/12 rounded" />
                </div>
              ) : null}

              {/* Dedicated Exam renderer for standalone exam items without an inline exam block */}
              {lesson.type === 'exam' && !contentHasExam && examPlayer}

              {/* Dedicated Practice Problems renderer for standalone practice items without an inline practice block */}
              {lesson.type === 'practice' && !contentHasPractice && (
                <PracticeProblemsCockpit
                  lesson={lesson}
                  lessonProgress={lessonProgress}
                  onProgressUpdate={onProgressUpdate}
                  bootcampId={bootcampId}
                  onRefreshEnrollment={onRefreshEnrollment}
                  isArchived={isArchived}
                />
              )}

              {/* Attachments */}
              {lesson.attachments?.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/2">
                  <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                    <Download className="h-4 w-4 text-purple-400" />
                    <h3 className="text-[13px] font-semibold text-white">
                      Attachments
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {lesson.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/2 px-3 py-2.5 text-xs text-gray-300 transition-all hover:border-white/10 hover:bg-white/5"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-gray-500" />
                        <span className="truncate">
                          {att.name || `Attachment ${i + 1}`}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>

            {/* Notes */}
            <NotesPanel
              lessonId={lesson.id}
              initialNotes={lessonProgress[lesson.id]?.notes}
              onSave={onSaveNotes}
              isArchived={isArchived}
            />

            {/* Comments */}
            {commentsLoading ? (
              <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/[0.07] pt-8">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
                <span className="text-xs text-gray-600">
                  Loading discussion…
                </span>
              </div>
            ) : (
              <LessonComments
                lessonId={lesson.id}
                initialComments={lessonComments}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>

        {/* TOC (xl+) */}
        <div className="spa-scroll hidden w-64 shrink-0 overflow-y-auto border-l border-white/10 p-4 pt-8 xl:block">
          <TableOfContents contentRef={contentAreaRef} />
        </div>
      </div>

      {/* Lesson nav footer */}
      <div className="shrink-0 border-t border-white/10 bg-zinc-950 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {prevLesson ? (
            <button
              onClick={() => onSelectLesson(prevLesson)}
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[12px] font-medium text-gray-400 transition-all hover:border-white/15 hover:bg-white/10 hover:text-white sm:px-4 sm:text-[13px]"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden max-w-[200px] truncate sm:inline md:max-w-[300px]">
                {prevLesson.title}
              </span>
              <span className="sm:hidden">Prev</span>
            </button>
          ) : (
            <div />
          )}

          <span className="text-[11px] text-gray-600 tabular-nums">
            {currentIndex + 1} / {allLessons.length}
          </span>

          {nextLesson ? (
            <button
              onClick={() => onSelectLesson(nextLesson)}
              className="group flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-violet-700 px-3 py-2.5 text-[12px] font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-violet-600 sm:px-5 sm:text-[13px]"
            >
              <span className="hidden max-w-[200px] truncate sm:inline md:max-w-[300px]">
                {nextLesson.title}
              </span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              onClick={() => onSelectLesson(null)}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-600 px-3 py-2.5 text-[12px] font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500 sm:px-5 sm:text-[13px]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Finish Course</span>
              <span className="sm:hidden">Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Lesson Skeleton ──────────────────────────────────────────────────────────

function LessonSkeleton({ title, hasVideo }) {
  return (
    <div className="spa-fade-in mx-auto max-w-5xl space-y-5 p-4 pb-8 sm:p-6 lg:p-8 2xl:max-w-6xl">
      <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/[0.04] to-transparent p-4 sm:p-5">
        {title ? (
          <h1 className="text-lg leading-tight font-extrabold tracking-tight text-white sm:text-xl lg:text-2xl">
            {title}
          </h1>
        ) : (
          <div className="spa-skeleton h-6 w-2/3 rounded-md" />
        )}
        <div className="mt-3 flex gap-3">
          <div className="spa-skeleton h-3 w-16 rounded" />
          <div className="spa-skeleton h-3 w-20 rounded" />
        </div>
      </div>
      {hasVideo !== false && (
        <div className="spa-skeleton aspect-video w-full rounded-2xl" />
      )}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/2 p-5">
        <div className="spa-skeleton h-3 w-full rounded" />
        <div className="spa-skeleton h-3 w-11/12 rounded" />
        <div className="spa-skeleton h-3 w-9/12 rounded" />
        <div className="spa-skeleton h-3 w-10/12 rounded" />
      </div>
    </div>
  );
}

// ─── Main SPA Shell ───────────────────────────────────────────────────────────

// Extract lessonId from the current URL path (client-side only)
function getLessonIdFromUrl() {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(/\/bootcamps\/[^/]+\/([^/]+)$/);
  return m ? m[1] : null;
}

function PracticeProblemsCockpit({
  lesson,
  lessonProgress,
  onProgressUpdate,
  bootcampId,
  onRefreshEnrollment,
  isArchived = false,
}) {
  const [selectedProblem, setSelectedProblem] = useState(null); // { problem, pIdx }
  const [modalTab, setModalTab] = useState('editorial'); // 'editorial' | 'solution' | 'ai'
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [toggling, setToggling] = useState({});

  // Ask AI state
  const [aiQuestion, setAiQuestion] = useState({}); // { [problemIdx]: string }
  const [aiResponses, setAiResponses] = useState({}); // { [problemIdx]: string }
  const [aiLoading, setAiLoading] = useState({}); // { [problemIdx]: boolean }
  const [aiError, setAiError] = useState({}); // { [problemIdx]: string }

  const [bookmarkedProblems, setBookmarkedProblems] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(
        `bookmarks_${bootcampId}_${lesson.id}`
      );
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleBookmark = (pIdx) => {
    setBookmarkedProblems((prev) => {
      const next = prev.includes(pIdx)
        ? prev.filter((idx) => idx !== pIdx)
        : [...prev, pIdx];
      try {
        localStorage.setItem(
          `bookmarks_${bootcampId}_${lesson.id}`,
          JSON.stringify(next)
        );
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const solvedList = lessonProgress[lesson.id]?.solved_problems || [];
  const problems = parsePracticeProblems(lesson.practice_problems);

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

  const handleToggleSolved = async (pIdx, name) => {
    if (isArchived) {
      toast.error(
        'This bootcamp is archived. Toggling problem solve status is disabled.'
      );
      return;
    }
    if (toggling[pIdx]) return;
    setToggling((prev) => ({ ...prev, [pIdx]: true }));

    const isSolved = solvedList.includes(pIdx);

    // Optimistic UI update
    const nextSolved = isSolved
      ? solvedList.filter((idx) => idx !== pIdx)
      : [...solvedList, pIdx];

    const allSolved =
      problems.length > 0 &&
      problems.every((_, idx) => nextSolved.includes(idx));

    onProgressUpdate((prev) => ({
      ...prev,
      [lesson.id]: {
        ...prev[lesson.id],
        solved_problems: nextSolved,
        is_completed: allSolved,
      },
    }));

    try {
      await togglePracticeProblemSolved(lesson.id, pIdx, !isSolved, bootcampId);
      if (!isSolved) {
        toast.success(`Marked "${name}" as solved! 🌟`);
      } else {
        toast.success(`Marked "${name}" as unsolved.`);
      }
      if (onRefreshEnrollment) {
        onRefreshEnrollment();
      }
    } catch (err) {
      console.error('Failed to toggle problem solve status:', err);
      toast.error('Failed to update progress.');
      // Rollback on error
      onProgressUpdate((prev) => ({
        ...prev,
        [lesson.id]: {
          ...prev[lesson.id],
          solved_problems: solvedList,
          is_completed:
            solvedList.length > 0 &&
            problems.every((_, idx) => solvedList.includes(idx)),
        },
      }));
    } finally {
      setToggling((prev) => ({ ...prev, [pIdx]: false }));
    }
  };

  const handleCopyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    toast.success('Solution copied! 📋');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleAskAI = async (pIdx, p) => {
    const question =
      aiQuestion[pIdx]?.trim() ||
      `Help me understand how to approach this problem: ${p.name}. What is the correct logic?`;
    if (!question) return;

    setAiLoading((prev) => ({ ...prev, [pIdx]: true }));
    setAiError((prev) => ({ ...prev, [pIdx]: null }));

    try {
      const res = await fetch('/api/code/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: p.solution_code || '// No code solved yet.',
          language: 'cpp',
          question: question,
          history: [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.explanation) {
        setAiResponses((prev) => ({ ...prev, [pIdx]: data.explanation }));
      } else {
        setAiError((prev) => ({
          ...prev,
          [pIdx]: data.error || 'Failed to get AI response. Please try again.',
        }));
      }
    } catch (err) {
      console.error('AI tutor query error:', err);
      setAiError((prev) => ({
        ...prev,
        [pIdx]: 'Network error. Please try again.',
      }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [pIdx]: false }));
    }
  };

  if (problems.length === 0) return null;

  // Calculate solved percent
  const solvedCount = solvedList.length;
  const totalCount = problems.length;
  const percent = Math.round((solvedCount / totalCount) * 100);
  const totalPoints = problems.reduce((acc, p) => acc + (p.points ?? 5), 0);
  const earnedPoints = problems.reduce(
    (acc, p, idx) => acc + (solvedList.includes(idx) ? (p.points ?? 5) : 0),
    0
  );

  return (
    <div className="mt-6 flex flex-col gap-6">
      {isArchived && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 text-[12.5px] leading-normal font-medium text-amber-300 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            This bootcamp is archived. Toggling problem solve status is
            disabled.
          </span>
        </div>
      )}
      {/* Cockpit Card Header */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/10 bg-linear-to-br from-teal-500/[0.03] to-transparent p-5">
        <div className="mb-5 flex flex-col gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-teal-400 uppercase">
              Practice Cockpit
            </span>
            <h3 className="mt-2 flex items-center gap-2 text-lg font-bold text-white">
              {lesson.title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-300">
              {solvedCount} / {totalCount} Solved ({percent}%)
            </span>
            <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">
              {earnedPoints} / {totalPoints} pts
            </span>
          </div>
        </div>

        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-teal-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        {percent === 100 ? (
          <p className="flex animate-bounce items-center gap-1.5 text-xs font-medium text-emerald-400">
            🎉 All practice problems solved! Outstanding job!
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            Complete all problems to finish this practice module and advance
            your ranking.
          </p>
        )}
      </div>

      {/* Arena view: Table of problems directly rendered */}
      <div className="custom-scrollbar animate-in fade-in overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/20 duration-200">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="w-16 p-4 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Status
              </th>
              <th className="w-24 p-4 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Star
              </th>
              <th className="p-4 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Problem
              </th>
              <th className="w-24 p-4 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Points
              </th>
              <th className="w-24 p-4 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Workspace
              </th>
              <th className="w-24 p-4 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Editorial
              </th>
              <th className="w-24 p-4 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Video
              </th>
              <th className="w-24 p-4 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Code
              </th>
              <th className="w-24 p-4 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Ask AI
              </th>
              <th className="w-24 p-4 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                AC
              </th>
              <th className="w-28 p-4 text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {problems.map((p, pIdx) => {
              const isSolved = solvedList.includes(pIdx);

              const workspaceUrl = p.url
                ? p.url
                : p.source?.startsWith('http')
                  ? p.source
                  : `https://vjudge.net/problem/${encodeURIComponent(p.source || p.name)}`;

              const videoUrl = p.video_url
                ? p.video_url
                : `https://www.youtube.com/results?search_query=${encodeURIComponent(p.name + ' ' + (p.source || '') + ' solution')}`;

              return (
                <Fragment key={p.id || pIdx}>
                  <tr
                    className={`transition-colors hover:bg-white/[0.01] ${isSolved ? 'bg-emerald-500/[0.01]' : ''}`}
                  >
                    {/* Status */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSolved(
                            pIdx,
                            p.name || `Problem ${pIdx + 1}`
                          )
                        }
                        disabled={toggling[pIdx] || isArchived}
                        className={`mx-auto flex h-5 w-5 items-center justify-center rounded-lg border transition-all disabled:opacity-50 ${
                          isArchived
                            ? 'cursor-not-allowed border-gray-600'
                            : 'cursor-pointer hover:scale-110 active:scale-95'
                        }`}
                        style={{
                          borderColor: isSolved ? '#10b981' : '#464554',
                          backgroundColor: isSolved
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'transparent',
                        }}
                      >
                        {toggling[pIdx] ? (
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        ) : isSolved ? (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-3 w-3 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </motion.svg>
                        ) : null}
                      </button>
                    </td>

                    {/* Star Bookmark */}
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(pIdx)}
                        className="group mx-auto flex h-8 w-8 cursor-pointer items-center justify-center transition-transform hover:scale-110 active:scale-90"
                        title={
                          bookmarkedProblems.includes(pIdx)
                            ? 'Remove Bookmark'
                            : 'Bookmark Problem'
                        }
                      >
                        <Star
                          className={`h-4.5 w-4.5 transition-colors ${
                            bookmarkedProblems.includes(pIdx)
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.4)] filter'
                              : 'text-zinc-600 group-hover:text-zinc-400'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Problem Name */}
                    <td className="p-4">
                      <a
                        href={workspaceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm font-semibold transition-colors hover:text-teal-400 hover:underline ${
                          isSolved
                            ? 'text-emerald-300/80 line-through decoration-white/10'
                            : 'text-white'
                        }`}
                      >
                        {p.name || `Problem ${pIdx + 1}`}
                      </a>
                    </td>

                    {/* Points */}
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-amber-400">
                        {p.points ?? 5} pts
                      </span>
                    </td>

                    {/* Workspace Link */}
                    <td className="p-4 text-center">
                      <a
                        href={workspaceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/10 bg-teal-500/10 p-2 text-teal-300 transition-all hover:border-teal-500/30 hover:bg-teal-500/20"
                        title="Open Solve Workspace"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>

                    {/* Editorial Toggle */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        disabled={!p.editorial}
                        onClick={() => {
                          setSelectedProblem({ problem: p, pIdx });
                          setModalTab('editorial');
                        }}
                        className={`mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border p-2 transition-all ${
                          !p.editorial
                            ? 'cursor-not-allowed border-white/5 bg-zinc-800/20 text-gray-600 opacity-20'
                            : 'border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white'
                        }`}
                        title={p.editorial ? 'View Editorial' : 'No Editorial'}
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
                    </td>

                    {/* Video Link */}
                    <td className="p-4 text-center">
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/10 p-2 text-red-300 transition-all hover:border-red-500/30 hover:bg-red-500/20"
                        title={
                          p.video_url
                            ? 'Watch Video Solution'
                            : 'Search Video Solution on YouTube'
                        }
                      >
                        <Video className="h-4 w-4" />
                      </a>
                    </td>

                    {/* Code Toggle */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        disabled={!p.solution_code}
                        onClick={() => {
                          setSelectedProblem({ problem: p, pIdx });
                          setModalTab('solution');
                        }}
                        className={`mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border p-2 transition-all ${
                          !p.solution_code
                            ? 'cursor-not-allowed border-white/5 bg-zinc-800/20 text-gray-600 opacity-20'
                            : 'border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white'
                        }`}
                        title={
                          p.solution_code ? 'View Solution Code' : 'No Code'
                        }
                      >
                        <Code className="h-4 w-4" />
                      </button>
                    </td>

                    {/* Ask AI Toggle */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProblem({ problem: p, pIdx });
                          setModalTab('ai');
                          if (!aiQuestion[pIdx]) {
                            setAiQuestion((prev) => ({
                              ...prev,
                              [pIdx]: `Explain the logic and mathematical intuition behind: ${p.name}`,
                            }));
                          }
                        }}
                        className="mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] p-2 text-gray-300 transition-all hover:bg-white/[0.08] hover:text-white"
                        title="Ask AI Coding Tutor"
                      >
                        <Brain className="h-4 w-4" />
                      </button>
                    </td>

                    {/* AC Count */}
                    <td className="p-4 text-center">
                      <div className="inline-block rounded border border-emerald-500/10 bg-emerald-500/5 px-2 py-0.5 text-center text-[10px] font-bold text-emerald-400">
                        {p.accepted_count ? `${p.accepted_count} AC` : '—'}
                      </div>
                    </td>

                    {/* Source badge */}
                    <td className="p-4 text-center">
                      <div
                        className="inline-block max-w-[100px] truncate rounded border border-teal-500/10 bg-[#16222f] px-2 py-0.5 text-center text-[9px] font-extrabold tracking-widest text-teal-300 uppercase"
                        title={p.source}
                      >
                        {getPlatformName(p.source)}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Practice Problem Solution & AI Tutor Hub Modal */}
      {selectedProblem &&
        (() => {
          const p = selectedProblem.problem;
          const pIdx = selectedProblem.pIdx;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md">
              <div className="animate-in fade-in zoom-in-95 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-teal-500/25 bg-[#05111d] shadow-2xl duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-[#010f1f] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="truncate rounded border border-teal-500/10 bg-[#16222f] px-2.5 py-1 text-[10px] font-extrabold tracking-widest text-teal-300 uppercase">
                      {getPlatformName(p.source)}
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                        {p.name || `Problem ${pIdx + 1}`}
                        {solvedList.includes(pIdx) && (
                          <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-emerald-400 uppercase">
                            Solved
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProblem(null)}
                    className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-1.5 text-gray-400 transition-colors hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Tab Selector Bar */}
                <div className="flex items-center gap-2 border-b border-white/5 bg-[#020b15] px-6 py-1">
                  {p.editorial && (
                    <button
                      type="button"
                      onClick={() => setModalTab('editorial')}
                      className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
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
                      className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                        modalTab === 'solution'
                          ? 'border-teal-400 bg-teal-500/5 text-teal-300'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <Code className="h-4 w-4" />
                      Solution Code
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setModalTab('ai')}
                    className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                      modalTab === 'ai'
                        ? 'border-violet-400 bg-violet-500/5 text-violet-300'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <Brain className="h-4 w-4 text-violet-400" />
                    AI Coding Tutor
                  </button>
                </div>

                {/* Modal Content Body */}
                <div className="flex-1 overflow-y-auto bg-zinc-950/20 p-6 text-left">
                  {modalTab === 'editorial' && p.editorial && (
                    <div className="flex flex-col gap-2">
                      <div className="rounded-xl border border-white/5 bg-zinc-950/30 p-5 leading-relaxed">
                        <MarkdownDesc
                          text={p.editorial}
                          className="text-gray-300"
                        />
                      </div>
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
                          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all hover:bg-zinc-800 hover:text-white active:scale-95"
                        >
                          {copiedIdx === pIdx ? (
                            <>
                              <CheckSquare className="h-4 w-4 text-emerald-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy Code
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="custom-scrollbar overflow-x-auto rounded-xl border border-white/5 bg-zinc-950 p-5 font-mono text-xs text-emerald-300">
                        <code>{p.solution_code}</code>
                      </pre>
                    </div>
                  )}

                  {modalTab === 'ai' && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-zinc-950/40 p-5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={aiQuestion[pIdx] || ''}
                            onChange={(e) =>
                              setAiQuestion((prev) => ({
                                ...prev,
                                [pIdx]: e.target.value,
                              }))
                            }
                            placeholder="Ask a question about this problem..."
                            className="flex-1 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAskAI(pIdx, p);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAskAI(pIdx, p)}
                            disabled={
                              aiLoading[pIdx] || !aiQuestion[pIdx]?.trim()
                            }
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {aiLoading[pIdx] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Ask Tutor
                          </button>
                        </div>

                        {aiError[pIdx] && (
                          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                            {aiError[pIdx]}
                          </div>
                        )}

                        {aiLoading[pIdx] && (
                          <div className="flex flex-col items-center justify-center gap-2 py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                            <span className="text-[11px] text-gray-500 italic">
                              AI Tutor is parsing problem parameters & creating
                              guidelines...
                            </span>
                          </div>
                        )}

                        {aiResponses[pIdx] && !aiLoading[pIdx] && (
                          <div className="border-t border-white/5 pt-4">
                            <div
                              className="md-desc prose prose-invert max-w-none overflow-hidden rounded-xl border border-white/5 bg-black/10 p-5 text-xs text-gray-300"
                              dangerouslySetInnerHTML={{
                                __html: (() => {
                                  let html = '';
                                  try {
                                    html = marked.parse(aiResponses[pIdx], {
                                      gfm: true,
                                      breaks: true,
                                    });
                                  } catch {
                                    html = `<p>${aiResponses[pIdx]}</p>`;
                                  }
                                  return html;
                                })(),
                              }}
                            />
                          </div>
                        )}
                      </div>
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

export default function BootcampLearningClient({
  bootcamp,
  lessonProgress: initialProgress = {},
  enrollment: initialEnrollment = {},
  currentUser = null,
}) {
  const [lessonProgress, setLessonProgress] = useState(initialProgress);
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  // activeLessonId: what the sidebar highlights (set immediately on click)
  const [activeLessonId, setActiveLessonId] = useState(null);
  // loadedLesson: what is actually rendered in the main panel
  const [loadedLesson, setLoadedLesson] = useState(null);
  const [loading, startLoading] = useTransition();
  const [loadError, setLoadError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [completing, startCompleting] = useTransition();
  const isArchived = bootcamp?.status === 'archived';

  const refreshEnrollment = useCallback(async () => {
    try {
      const res = await checkEnrollment(bootcamp?.id);
      if (res.enrolled && res.enrollment) {
        setEnrollment(res.enrollment);
      }
    } catch (err) {
      console.error('Failed to refresh enrollment:', err);
    }
  }, [bootcamp?.id]);

  useEffect(() => {
    if (Object.keys(lessonProgress).length > 0) {
      refreshEnrollment();
    }
  }, [lessonProgress, refreshEnrollment]);

  const lessonCacheRef = useRef({});
  const prefetchInflightRef = useRef(new Set());
  const navTokenRef = useRef(0);
  const activeLessonIdRef = useRef(null);
  // Sync ref on every render — no useEffect lag
  activeLessonIdRef.current = activeLessonId;

  const allLessons = useMemo(() => {
    const out = [];
    bootcamp?.courses?.forEach((c) => {
      if (c.is_published === false) return;
      c.modules?.forEach((m) => {
        if (m.is_published === false) return;
        m.lessons?.forEach((l) => {
          if (l.is_published === false) return;
          out.push(l);
        });
      });
    });
    return out;
  }, [bootcamp?.courses]);

  const totalLessons = allLessons.length;
  const totalWeight = allLessons.reduce((s, l) => s + (l.weight ?? 1), 0);
  const totalPoints = allLessons.reduce((s, l) => s + (l.points ?? 10), 0);
  const completedCount = allLessons.filter(
    (l) => lessonProgress?.[l.id]?.is_completed
  ).length;
  const completedWeight = allLessons
    .filter((l) => lessonProgress?.[l.id]?.is_completed)
    .reduce((s, l) => s + (l.weight ?? 1), 0);
  const progressPercent =
    totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  const isComplete = totalWeight > 0 && completedWeight >= totalWeight;

  const resumeLesson = useMemo(() => {
    // Find the most recently accessed lesson (by updated_at)
    let lastAccessedLesson = null;
    let lastAccessedAt = null;
    for (const l of allLessons) {
      const p = lessonProgress?.[l.id];
      if (!p?.updated_at) continue;
      if (!lastAccessedAt || p.updated_at > lastAccessedAt) {
        lastAccessedAt = p.updated_at;
        lastAccessedLesson = l;
      }
    }
    if (lastAccessedLesson) return lastAccessedLesson;
    // No history: return first uncompleted lesson or first lesson
    return (
      allLessons.find((l) => !lessonProgress?.[l.id]?.is_completed) ||
      allLessons[0]
    );
  }, [allLessons, lessonProgress]);
  const resumeIndex = useMemo(
    () =>
      resumeLesson ? allLessons.findIndex((l) => l.id === resumeLesson.id) : -1,
    [allLessons, resumeLesson]
  );

  const coursesCount = bootcamp?.courses?.length || 0;
  const modulesCount =
    bootcamp?.courses?.reduce((s, c) => s + (c.modules?.length || 0), 0) || 0;
  const totalWatchedSecs = allLessons
    .filter((l) => lessonProgress?.[l.id]?.is_completed)
    .reduce((s, l) => s + (l.duration || 0), 0);
  const totalDurationSecs = allLessons.reduce(
    (s, l) => s + (l.duration || 0),
    0
  );

  // Index for Next/Prev — track what's actually rendered (loadedLesson),
  // not what's pending (activeLessonId may be ahead during async load).
  const currentIndex = useMemo(
    () =>
      loadedLesson?.id
        ? allLessons.findIndex((l) => l.id === loadedLesson.id)
        : -1,
    [allLessons, loadedLesson?.id]
  );

  // Stable refs so all callbacks below can have [] deps
  const allLessonsRef = useRef(allLessons);
  allLessonsRef.current = allLessons; // sync inline, no useEffect needed

  const bootcampRef = useRef(bootcamp);
  bootcampRef.current = bootcamp;

  // These never recreate — they read everything through stable refs
  const loadFullLesson = useCallback(async (lessonId) => {
    const cached = lessonCacheRef.current[lessonId];
    if (cached && cached.content !== undefined) return cached;
    const stub = allLessonsRef.current.find((l) => l.id === lessonId);
    if (!stub) {
      const full = await getLesson(lessonId);
      lessonCacheRef.current[lessonId] = full;
      return full;
    }
    const content = await getLessonContent(lessonId);
    const merged = content ? { ...stub, ...content } : stub;
    lessonCacheRef.current[lessonId] = merged;
    return merged;
  }, []); // stable — only reads refs

  const prefetchLesson = useCallback((lesson) => {
    if (!lesson?.id) return;
    if (lessonCacheRef.current[lesson.id]?.content !== undefined) return;
    if (prefetchInflightRef.current.has(lesson.id)) return;
    prefetchInflightRef.current.add(lesson.id);
    const stub =
      allLessonsRef.current.find((l) => l.id === lesson.id) || lesson;
    getLessonContent(lesson.id)
      .then((content) => {
        lessonCacheRef.current[lesson.id] = content
          ? { ...stub, ...content }
          : stub;
      })
      .catch(() => {})
      .finally(() => {
        prefetchInflightRef.current.delete(lesson.id);
      });
  }, []); // stable — only reads refs

  // Core navigation. `mode`: 'push' (default — entering from overview / new entry),
  // 'replace' (lesson-to-lesson switch), 'none' (browser popstate — URL already set).
  // Fully stable ([] deps) — reads everything through refs.
  const navigateToLesson = useCallback(
    (lesson, mode = 'push') => {
      const token = ++navTokenRef.current;
      const bootcampId = bootcampRef.current?.id;
      const nativeHistory = getNativeHistory();
      const pushState = nativeHistory.pushState
        ? nativeHistory.pushState.bind(window.history)
        : window.history.pushState.bind(window.history);
      const replaceState = nativeHistory.replaceState
        ? nativeHistory.replaceState.bind(window.history)
        : window.history.replaceState.bind(window.history);

      if (!lesson) {
        setActiveLessonId(null);
        setLoadedLesson(null);
        setLoadError(null);
        if (mode !== 'none') {
          const url = `/account/member/bootcamps/${bootcampId}`;
          if (mode === 'replace') replaceState(null, '', url);
          else pushState(null, '', url);
        }
        return;
      }

      const url = `/account/member/bootcamps/${bootcampId}/${lesson.id}`;
      // Use History API directly to avoid Next.js server re-render on dynamic segment change
      if (mode === 'push') pushState(null, '', url);
      else if (mode === 'replace') replaceState(null, '', url);

      setActiveLessonId(lesson.id);
      setLoadError(null);

      // Fire-and-forget so resume tracking works for non-video lessons too
      touchLessonAccess(lesson.id, bootcampId).catch(() => {});
      // Optimistically update updated_at so resumeLesson re-computes in this session
      setLessonProgress((prev) => ({
        ...prev,
        [lesson.id]: {
          ...prev[lesson.id],
          updated_at: new Date().toISOString(),
        },
      }));

      // Fast path: already have full content in cache
      const cached = lessonCacheRef.current[lesson.id];
      if (cached && cached.content !== undefined) {
        setLoadedLesson(cached);
        return;
      }
      // Lesson object already carries content (e.g. SSR initial lesson passed directly)
      if (lesson.content !== undefined) {
        lessonCacheRef.current[lesson.id] = lesson;
        setLoadedLesson(lesson);
        return;
      }

      // Instant render: show stub immediately (title, video metadata available from
      // curriculum) so the header and video mount with zero wait. Content body
      // (markdown, attachments) streams in when the small content fetch resolves.
      const stub =
        allLessonsRef.current.find((l) => l.id === lesson.id) || lesson;
      const optimisticLesson = {
        ...stub,
        content: undefined,
        _pendingContent: true,
      };
      setLoadedLesson(optimisticLesson);

      startLoading(async () => {
        try {
          const full = await loadFullLesson(lesson.id);
          if (navTokenRef.current !== token) return;
          if (!full) {
            setLoadError('Lesson not found.');
            return;
          }
          setLoadedLesson(full);
        } catch {
          if (navTokenRef.current !== token) return;
          setLoadError('Failed to load lesson. Please try again.');
        }
      });
    },
    [] // stable — reads everything through refs
  );

  // Wrapper used by UI: smart-detect push vs replace, skip no-op.
  // Stable identity (reads everything via refs) so memoized children never re-render due to this.
  const selectLesson = useCallback(
    (lesson) => {
      const current = activeLessonIdRef.current;
      if (!lesson) {
        if (!current) return;
        return navigateToLesson(null, 'push');
      }
      if (lesson.id === current) return;
      if (lesson.is_locked) return;
      const bc = bootcampRef.current;
      const parentCourse = bc?.courses?.find((c) =>
        (c.modules || []).some((m) =>
          (m.lessons || []).some((l) => l.id === lesson.id)
        )
      );
      if (parentCourse?.is_locked) return;
      const parentModule = (parentCourse?.modules || []).find((m) =>
        (m.lessons || []).some((l) => l.id === lesson.id)
      );
      if (parentModule?.is_locked) return;
      const mode = current ? 'replace' : 'push';
      navigateToLesson(lesson, mode);
    },
    [navigateToLesson]
  );

  // On mount: if URL already contains a lessonId (direct link / page refresh),
  // navigate to it immediately client-side. The layout no longer passes SSR lesson data
  // since it's shared across all lesson URLs — the client fetches it.
  useEffect(() => {
    const lessonId = getLessonIdFromUrl();
    if (lessonId) {
      navigateToLesson({ id: lessonId }, 'none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefetch neighbors whenever the loaded lesson changes (reads allLessons via ref — stable dep)
  useEffect(() => {
    if (!loadedLesson?.id) return;
    const lessons = allLessonsRef.current;
    const idx = lessons.findIndex((l) => l.id === loadedLesson.id);
    if (idx < 0) return;
    const schedule = (cb) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(cb, { timeout: 1500 });
      } else {
        setTimeout(cb, 300);
      }
    };
    const neighbors = [
      lessons[idx - 1],
      lessons[idx + 1],
      lessons[idx + 2],
    ].filter(Boolean);
    neighbors.forEach((l) => schedule(() => prefetchLesson(l)));
  }, [loadedLesson?.id, prefetchLesson]);

  // Browser back/forward — DO NOT push, just sync state
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const match = path.match(/\/bootcamps\/[^/]+\/([^/]+)$/);
      if (match) {
        navigateToLesson({ id: match[1] }, 'none');
      } else {
        navigateToLesson(null, 'none');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [navigateToLesson]);

  const moduleIndex = useMemo(() => {
    const lessonToModule = {};
    const moduleLessons = {};
    bootcamp?.courses?.forEach((c) =>
      c.modules?.forEach((m) => {
        const ids = (m.lessons || []).map((l) => l.id);
        moduleLessons[m.id] = ids;
        ids.forEach((id) => {
          lessonToModule[id] = m.id;
        });
      })
    );
    return { lessonToModule, moduleLessons };
  }, [bootcamp]);

  const handleMarkComplete = useCallback(
    (lessonId) => {
      if (isArchived) return;
      startCompleting(async () => {
        await markLessonComplete(lessonId, bootcamp?.id);
        const nextProgress = {
          ...lessonProgress,
          [lessonId]: { ...lessonProgress[lessonId], is_completed: true },
        };
        setLessonProgress(nextProgress);

        // Detect if this lesson's module just became fully complete.
        const moduleId = moduleIndex.lessonToModule[lessonId];
        let completedModuleId = null;
        if (moduleId) {
          const ids = moduleIndex.moduleLessons[moduleId] || [];
          const allDone =
            ids.length > 0 && ids.every((id) => nextProgress[id]?.is_completed);
          if (allDone) completedModuleId = moduleId;
        }
        if (bootcamp?.id) {
          const d = new Date();
          const activityDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          recordLearningActivity({
            bootcampId: bootcamp.id,
            completedLessonId: lessonId,
            completedModuleId,
            activityDate,
          }).catch(() => {});
        }
        refreshEnrollment();
      });
    },
    [bootcamp, moduleIndex, lessonProgress, refreshEnrollment, isArchived]
  );

  const handleMarkIncomplete = useCallback(
    (lessonId) => {
      if (isArchived) return;
      startCompleting(async () => {
        await markLessonIncomplete(lessonId, bootcamp?.id);
        setLessonProgress((prev) => ({
          ...prev,
          [lessonId]: { ...prev[lessonId], is_completed: false },
        }));
        refreshEnrollment();
      });
    },
    [bootcamp?.id, refreshEnrollment, isArchived]
  );

  const handleSaveNotes = useCallback(
    async (lessonId, notes) => {
      if (isArchived) return;
      await saveLessonNotes(lessonId, notes);
      setLessonProgress((prev) => ({
        ...prev,
        [lessonId]: { ...prev[lessonId], notes },
      }));
    },
    [isArchived]
  );

  const ctaLabel = isComplete
    ? 'Review'
    : completedCount > 0
      ? 'Resume'
      : 'Start learning';
  const isLessonView = !!activeLessonId;

  // Stub of the lesson currently being navigated to (used for instant skeleton
  // header while the full lesson body loads).
  const pendingLessonStub = useMemo(() => {
    if (!activeLessonId) return null;
    if (loadedLesson?.id === activeLessonId) return null;
    return allLessons.find((l) => l.id === activeLessonId) || null;
  }, [activeLessonId, loadedLesson?.id, allLessons]);
  const isSwitching = !!pendingLessonStub;

  const mainScrollRef = useRef(null);
  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
  }, [activeLessonId]);

  // Measure available height for the body row at runtime so the sidebar
  // and main scroll containers always have the exact remaining viewport
  // space, regardless of how many parent headers/topbars exist above us.
  const bodyRef = useRef(null);
  const [bodyHeight, setBodyHeight] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!bodyRef.current) return;
        const top = bodyRef.current.getBoundingClientRect().top;
        const available = window.innerHeight - top;
        setBodyHeight(Math.max(0, available));
      });
    };
    measure();
    // Re-measure after layout settles (fonts, images, parent collapses, etc.)
    const t = setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measure)
        : null;
    if (ro && bodyRef.current?.parentElement) {
      ro.observe(bodyRef.current.parentElement);
      ro.observe(document.body);
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      ro?.disconnect();
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950 text-white">
      <style dangerouslySetInnerHTML={{ __html: SCROLLBAR }} />

      {/* Topbar */}
      <header className="shrink-0 border-b border-white/10 bg-zinc-950/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
          {isLessonView ? (
            <button
              onClick={() => selectLesson(null)}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
          ) : (
            <Link
              href="/account/member/bootcamps"
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Bootcamps</span>
            </Link>
          )}

          <span className="text-gray-700">/</span>
          <div className="flex min-w-0 flex-1 items-center gap-2 truncate text-[13px] font-semibold text-white/90">
            <span className="truncate">
              {isLessonView
                ? pendingLessonStub?.title || loadedLesson?.title || 'Loading…'
                : bootcamp?.title}
            </span>
            {isSwitching && (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-400" />
            )}
          </div>

          {/* Points display */}
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-linear-to-r from-violet-500/10 to-pink-500/10 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/10">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="mr-0.5 hidden font-medium text-gray-400 sm:inline">
              Points:
            </span>
            <span className="text-white">{enrollment.score || 0}</span>
            <span className="font-medium text-gray-500">/{totalPoints}</span>
          </div>

          {/* Mobile: open curriculum drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Open curriculum"
          >
            <Menu className="h-4 w-4" />
          </button>

          {!isLessonView && resumeLesson && (
            <button
              onClick={() => selectLesson(resumeLesson)}
              className="hidden items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm shadow-emerald-500/20 transition-colors hover:bg-emerald-400 sm:inline-flex"
            >
              <Play className="h-3 w-3 fill-current" />
              {ctaLabel}
            </button>
          )}
        </div>
      </header>

      {/* Body — height measured at runtime so it always exactly fills
          remaining viewport space regardless of ancestor headers/footers. */}
      <div
        ref={bodyRef}
        className="flex min-h-0 flex-1 overflow-hidden"
        style={bodyHeight ? { height: `${bodyHeight}px` } : undefined}
      >
        {/* Desktop sidebar */}
        <aside className="hidden h-full w-[320px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-zinc-900 lg:flex xl:w-[360px]">
          <CurriculumRail
            bootcamp={bootcamp}
            lessonProgress={lessonProgress}
            activeLessonId={activeLessonId}
            resumeLesson={activeLessonId ? null : resumeLesson}
            onSelect={selectLesson}
            onPrefetch={prefetchLesson}
            totalLessons={totalLessons}
            completedCount={completedCount}
            progressPercent={progressPercent}
          />
        </aside>

        {/* Main content area */}
        <main
          ref={mainScrollRef}
          className="spa-scroll h-full min-w-0 flex-1 overflow-y-auto"
        >
          {/* Inline loading bar while a lesson fetches */}
          {(loading || isSwitching) && (
            <div className="sticky top-0 z-20 h-0.5 w-full overflow-hidden bg-emerald-500/10">
              <div className="spa-progress-bar" />
            </div>
          )}
          {isSwitching ? (
            <LessonSkeleton
              title={pendingLessonStub?.title}
              hasVideo={
                pendingLessonStub?.video_source &&
                pendingLessonStub.video_source !== 'none'
              }
            />
          ) : loadError ? (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 px-4 text-center text-gray-500">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <span className="text-[13px]">{loadError}</span>
                <button
                  onClick={() => {
                    setLoadError(null);
                    setActiveLessonId(null);
                  }}
                  className="text-[12px] text-violet-400 hover:text-violet-300"
                >
                  Back to overview
                </button>
              </div>
            </div>
          ) : isLessonView && loadedLesson ? (
            <div key={loadedLesson.id} className="spa-fade-in h-full">
              <LessonPanel
                lesson={loadedLesson}
                lessonProgress={lessonProgress}
                allLessons={allLessons}
                onSelectLesson={selectLesson}
                onSaveNotes={handleSaveNotes}
                onMarkComplete={handleMarkComplete}
                onMarkIncomplete={handleMarkIncomplete}
                completing={completing}
                isCompleted={lessonProgress[loadedLesson.id]?.is_completed}
                currentIndex={currentIndex}
                bootcampId={bootcamp?.id}
                onProgressUpdate={setLessonProgress}
                onRefreshEnrollment={refreshEnrollment}
                isArchived={isArchived}
                currentUser={currentUser}
              />
            </div>
          ) : (
            <OverviewPanel
              bootcamp={bootcamp}
              allLessons={allLessons}
              lessonProgress={lessonProgress}
              progressPercent={progressPercent}
              completedCount={completedCount}
              totalLessons={totalLessons}
              totalWatchedSecs={totalWatchedSecs}
              totalDurationSecs={totalDurationSecs}
              resumeLesson={resumeLesson}
              resumeIndex={resumeIndex}
              isComplete={isComplete}
              onSelectLesson={selectLesson}
              coursesCount={coursesCount}
              modulesCount={modulesCount}
              enrollment={enrollment}
              isArchived={isArchived}
            />
          )}
        </main>
      </div>

      {/* Mobile curriculum drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 left-0 z-50 flex h-[100dvh] w-[88%] max-w-[360px] flex-col overflow-hidden border-r border-white/10 bg-zinc-900 lg:hidden"
            >
              <CurriculumRail
                bootcamp={bootcamp}
                lessonProgress={lessonProgress}
                activeLessonId={activeLessonId}
                resumeLesson={activeLessonId ? null : resumeLesson}
                onSelect={selectLesson}
                onPrefetch={prefetchLesson}
                totalLessons={totalLessons}
                completedCount={completedCount}
                progressPercent={progressPercent}
                onClose={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile sticky CTA (overview only) */}
      {!isLessonView && resumeLesson && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur-xl sm:hidden">
          <button
            onClick={() => selectLesson(resumeLesson)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
          >
            <Play className="h-4 w-4 fill-current" />
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}

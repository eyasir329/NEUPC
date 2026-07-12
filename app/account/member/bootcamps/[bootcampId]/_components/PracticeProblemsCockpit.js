/**
 * @file Practice problems cockpit panel.
 * @module PracticeProblemsCockpit
 */

'use client';

import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BookOpen, Brain, CheckSquare, Code, Copy, ExternalLink, Loader2, Send, Star, Video, X } from 'lucide-react';
import { marked } from 'marked';
import toast from 'react-hot-toast';
import { togglePracticeProblemSolved } from '@/app/_lib/actions/bootcamp-actions';
import { MarkdownDesc, parsePracticeProblems } from './learning-shared';

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


export { PracticeProblemsCockpit };

/**
 * @file Lesson viewer panel (video, content blocks, exams) and its skeleton.
 * @module LessonPanel
 */

'use client';

import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Award, BookOpen, CheckCircle2, CheckSquare, ChevronLeft, ChevronRight, Circle, Clock, Download, FileText, GraduationCap, Loader2, Play, RefreshCw, Send, Trophy, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getExamSubmission, recordLearningActivity, submitExamSubmission, updateWatchTimeDelta, uploadTaskAttachmentAction } from '@/app/_lib/actions/bootcamp-actions';
import VideoPlayer from '@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/VideoPlayer';
import { AttachmentList } from './MemberTasksPanel';
import { NotesPanel } from './NotesPanel';
import { PracticeProblemsCockpit } from './PracticeProblemsCockpit';
import { TableOfContents } from './TableOfContents';
import { ChunkFallback, MarkdownDesc, MultiBlockEditor, TaskDescriptionRenderer, formatDurationFull, parseExamQuestions, parsePracticeProblems } from './learning-shared';

const LessonContentRenderer = lazy(
  () =>
    import('@/app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer')
);
import LessonComments from '@/app/_components/ui/LessonComments';
import { getLessonCommentsAction } from '@/app/_lib/actions/member-lesson-comments-actions';

// Native History API cache to bypass Next.js monkey-patched router and prevent reloads
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

export { LessonPanel, LessonSkeleton };

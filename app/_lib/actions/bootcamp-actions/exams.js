'use server';

/**
 * @file Bootcamp exams server actions (split from bootcamp-actions).
 */

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { auth } from '@/app/_lib/auth/auth';
import { uploadToDrive } from '@/app/_lib/integrations/gdrive';
import { extractDriveFileId } from '@/app/_lib/utils/utils';
import {
  getFileMetadata,
  canAccessFile,
} from '@/app/_lib/services/bootcamp-video';
import {
  cleanRichText,
  cleanPlainText,
  cleanLessonContent,
  cleanExamQuestions,
  cleanPracticeProblems,
  cleanAttachments,
} from '@/app/_lib/services/bootcamp-sanitize';

import {
  callAI,
  getCurrentUserId,
  normaliseCorrectOption,
  normaliseOptions,
  preprocessRawInput,
  requireAdmin,
  requireAdminOrBootcampMentor,
  requireLessonAccess,
  robustJsonParse,
} from './_helpers';
import { markLessonComplete } from './lessons';

// ─────────────────────────────────────────────────────────────────────────────
// EXAM SUBMISSION & ASSESSMENT ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit an exam answer (called by student).
 */
export async function submitExamSubmission(
  lessonId,
  _ignoredBootcampId,
  answers,
  score,
  status = 'submitted'
) {
  // bootcampId from caller is ignored — derived from lesson and verified.
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  // Sanitize any HTML the student may have pasted into answer fields.
  // Answers are stored as a JSON blob — walk it and clean strings.
  const cleanAnswers = (a) => {
    if (typeof a === 'string') return cleanRichText(a, 20000);
    if (Array.isArray(a)) return a.map(cleanAnswers);
    if (a && typeof a === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(a)) out[k] = cleanAnswers(v);
      return out;
    }
    return a;
  };

  const { data, error } = await supabaseAdmin
    .from('exam_submissions')
    .upsert(
      {
        lesson_id: lessonId,
        user_id: userId,
        bootcamp_id: bootcampId,
        submitted_answers: cleanAnswers(answers),
        score: score,
        status: status,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'lesson_id,user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error submitting exam:', error);
    throw error;
  }

  // Also mark the lesson as complete
  await markLessonComplete(lessonId, bootcampId);

  // For auto-graded MCQ exams (status='reviewed'), recalculate enrollment score
  // so that the exam points are immediately reflected in the member's dashboard.
  if (status === 'reviewed') {
    try {
      await supabaseAdmin.rpc('calculate_enrollment_progress', {
        p_user_id: userId,
        p_bootcamp_id: bootcampId,
      });
    } catch (rpcErr) {
      console.error(
        '[submitExamSubmission] calculate_enrollment_progress RPC failed:',
        rpcErr
      );
    }
    revalidatePath('/account/member/bootcamps');
    revalidatePath(`/account/member/bootcamps/${bootcampId}`);
    revalidatePath('/account/mentor/tasks');
  } else {
    // CQ / hybrid pending_review — just bust member cache so latest submission shows
    revalidatePath(`/account/member/bootcamps/${bootcampId}`);
    revalidatePath('/account/mentor/tasks');
  }

  return data;
}

/**
 * Get an exam submission (called by student or mentor).
 */
export async function getExamSubmission(lessonId, studentUserId = null) {
  let userId = studentUserId;
  if (!userId) {
    userId = await getCurrentUserId();
  }
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from('exam_submissions')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching exam submission:', error);
    return null;
  }
  return data;
}

/**
 * Get all exam submissions for mentor grading.
 * Dual-path: primary by bootcamp_id column, fallback via lesson IDs of the bootcamp.
 */
export async function getExamSubmissionsForMentor(bootcampId) {
  await requireAdminOrBootcampMentor(bootcampId);

  const SELECT_FRAGMENT = `
    *,
    users!user_id (
      id,
      full_name,
      email,
      avatar_url,
      member_profiles!user_id (
        student_id,
        academic_session
      )
    ),
    lessons (
      id,
      title,
      exam_type,
      exam_questions,
      description,
      content
    )
  `;

  // ── Primary path: filter by bootcamp_id ───────────────────────────────────
  const { data: byBootcamp, error: err1 } = await supabaseAdmin
    .from('exam_submissions')
    .select(SELECT_FRAGMENT)
    .eq('bootcamp_id', bootcampId)
    .order('created_at', { ascending: false });

  if (!err1 && Array.isArray(byBootcamp) && byBootcamp.length > 0) {
    console.log(
      `[getExamSubmissionsForMentor] bootcamp_id path: ${byBootcamp.length} rows for ${bootcampId}`
    );
    return byBootcamp;
  }

  if (err1) {
    console.warn(
      '[getExamSubmissionsForMentor] bootcamp_id query failed:',
      err1.message,
      '— trying lesson-id fallback'
    );
  } else {
    console.log(
      `[getExamSubmissionsForMentor] bootcamp_id returned 0 rows for ${bootcampId}, trying lesson-id fallback`
    );
  }

  // ── Fallback path: collect lesson IDs belonging to this bootcamp ──────────
  const { data: lessonRows, error: lessonsErr } = await supabaseAdmin
    .from('lessons')
    .select('id, modules!inner(courses!inner(bootcamp_id))')
    .eq('modules.courses.bootcamp_id', bootcampId);

  if (lessonsErr || !lessonRows?.length) {
    console.warn(
      '[getExamSubmissionsForMentor] lesson fallback found no lessons for bootcamp',
      bootcampId
    );
    return [];
  }

  const lessonIds = lessonRows.map((l) => l.id);

  const { data: byLesson, error: err2 } = await supabaseAdmin
    .from('exam_submissions')
    .select(SELECT_FRAGMENT)
    .in('lesson_id', lessonIds)
    .order('created_at', { ascending: false });

  if (err2) {
    console.error(
      '[getExamSubmissionsForMentor] lesson-id fallback failed:',
      err2.message
    );
    throw new Error(err2.message);
  }

  console.log(
    `[getExamSubmissionsForMentor] lesson-id path: ${byLesson?.length ?? 0} rows for bootcamp ${bootcampId}`
  );
  return byLesson ?? [];
}

/**
 * Review/assess a CQ exam submission.
 */
export async function reviewExamSubmission(
  submissionId,
  score,
  feedback,
  status
) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const { data: mentor } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();
  if (!mentor) throw new Error('Mentor not found');

  // Verify mentor is authorized for this bootcamp
  // Also fetch submitted_answers (for mcq_score) and exam_type (to detect hybrid)
  const { data: subCheck } = await supabaseAdmin
    .from('exam_submissions')
    .select('bootcamp_id, submitted_answers, lessons!inner(exam_type)')
    .eq('id', submissionId)
    .single();

  if (!subCheck) throw new Error('Submission not found');
  await requireAdminOrBootcampMentor(subCheck.bootcamp_id);

  // For hybrid exams: total score = MCQ auto-grade + CQ mentor score
  // The mentor's input (score) is the CQ portion only
  const isHybrid = subCheck.lessons?.exam_type === 'hybrid';
  const storedMcqScore = subCheck.submitted_answers?.mcq_score || 0;
  const finalScore =
    isHybrid && storedMcqScore > 0 ? storedMcqScore + score : score;

  const { data, error } = await supabaseAdmin
    .from('exam_submissions')
    .update({
      score: finalScore,
      mentor_feedback: cleanRichText(feedback, 20000),
      status: status,
      graded_by: mentor.id,
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    console.error('Error reviewing exam submission:', error);
    throw error;
  }

  // Trigger recalculation of enrollment progress and score
  try {
    await supabaseAdmin.rpc('calculate_enrollment_progress', {
      p_user_id: data.user_id,
      p_bootcamp_id: subCheck.bootcamp_id,
    });
  } catch (rpcErr) {
    console.error(
      'Error executing calculate_enrollment_progress RPC on grading:',
      rpcErr
    );
  }

  // Invalidate member and mentor page caches so the updated score is immediately visible
  revalidatePath('/account/member/bootcamps');
  revalidatePath(`/account/member/bootcamps/${subCheck.bootcamp_id}`);
  revalidatePath('/account/mentor/tasks');
  revalidatePath('/account/admin/bootcamps');

  return data;
}

/**
 * AI server action to parse raw unstructured text into structured MCQ questions.
 * Handles: numbered/lettered options, Bengali text, embedded code/math, 2-3 option questions,
 * "Ans: B" answer markers, missing answers (defaults to 0), mixed whitespace, and more.
 */
export async function generateExamQuestionsAction(
  rawText,
  guidelines = '',
  difficulty = 'medium'
) {
  await requireAdmin();

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 5) {
    return { error: 'Please provide some exam text to parse.' };
  }

  const input = preprocessRawInput(rawText);

  const systemPrompt = `You are an expert exam content parser and developer. Convert the raw input into a JSON array of MCQ objects.

ADDITIONAL PARAMETERS:
- Target Difficulty: ${difficulty} (Ensure questions, coding logic, and conceptual depth reflect this level)
- Custom/Formatting Guidelines: ${guidelines || 'None specified'}

RULES:
1. Each object must have exactly these keys:
   - "id": unique string like "q-1", "q-2"
   - "question": A highly clear, professional, and beautiful problem description.
     - You MUST format any programming code inside markdown code blocks (e.g. \`\`\`javascript ... \`\`\`).
     - You MUST format any mathematical formulas or equations beautifully using standard Markdown/LaTeX (e.g., $E = mc^2$ or $$ ... $$).
     - Make descriptions rich, structured, and realistic (with scenarios, input/output structures, logic challenges, etc. where appropriate) instead of a simple single-line.
     - No limit on the length or complexity of the descriptions.
   - "options": array of EXACTLY 4 strings. If the source has fewer, generate plausible distractors. Strip leading "A." / "1." prefixes from option text.
   - "correct_option": integer 0-3 (0=A, 1=B, 2=C, 3=D). Parse "Ans: B", "Answer: C", "*B*", "(B)" etc. Default 0 if not found.
   - "points": integer, default 5

2. If the user input is a brief topic or prompt, dynamically expand it to generate highly detailed, professional, and clear MCQ questions with complete multi-line problem descriptions.
3. Do NOT include any text outside the JSON array.
4. Do NOT wrap in markdown code fences.
5. Escape all newlines inside string values as \\n.
6. If text has multiple questions, return ALL of them as separate objects.
7. If a question has more than 4 options keep the first 4.

OUTPUT FORMAT (return exactly this, no prose):
[{"id":"q-1","question":"...","options":["...","...","...","..."],"correct_option":0,"points":5}]`;

  try {
    const generatedText = await callAI(systemPrompt, input, {
      maxTokens: 8192,
      temperature: 0.15,
      jsonMode: true,
    });
    const parsed = robustJsonParse(generatedText);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(
        'AI did not return a valid array of questions. Check your input format.'
      );
    }

    const normalized = parsed.map((q, idx) => ({
      id: crypto.randomUUID(),
      question:
        typeof q.question === 'string' && q.question.trim()
          ? q.question.trim()
          : 'Untitled Question',
      options: normaliseOptions(q.options),
      correct_option: normaliseCorrectOption(q.correct_option, 0),
      points:
        typeof q.points === 'number' && q.points > 0 ? Math.round(q.points) : 5,
    }));

    return { success: true, questions: normalized };
  } catch (err) {
    console.error('[generateExamQuestionsAction] error:', err);
    return {
      error: err.message || 'Failed to parse exam text into MCQ questions.',
    };
  }
}

'use server';

/**
 * @file Bootcamp practice server actions (split from bootcamp-actions).
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
  preprocessRawInput,
  requireAdmin,
  requireLessonAccess,
  robustJsonParse,
} from './_helpers';

/**
 * Toggle a practice problem's solved status for a user.
 * Automatically marks the entire lesson as completed when all problems are solved.
 */
export async function togglePracticeProblemSolved(
  lessonId,
  problemIndex,
  solved /* , _ignoredBootcampId */
) {
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  // Get current user progress
  const { data: progress } = await supabaseAdmin
    .from('user_progress')
    .select('id, solved_problems, is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  // Get total practice problems configured
  const { data: lessonData } = await supabaseAdmin
    .from('lessons')
    .select('practice_problems')
    .eq('id', lessonId)
    .single();

  const totalProblems = lessonData?.practice_problems || [];
  let currentSolved = progress?.solved_problems || [];

  if (solved) {
    if (!currentSolved.includes(problemIndex)) {
      currentSolved = [...currentSolved, problemIndex];
    }
  } else {
    currentSolved = currentSolved.filter((idx) => idx !== problemIndex);
  }

  // Determine if all practice problems are solved
  // If no practice problems are configured, or all of them are solved
  const isAllSolved =
    totalProblems.length > 0 &&
    totalProblems.every((_, idx) => currentSolved.includes(idx));

  const patch = {
    solved_problems: currentSolved,
    // If all are solved, auto mark lesson as completed
    is_completed: isAllSolved,
    completed_at: isAllSolved ? new Date().toISOString() : null,
  };

  let result;
  if (progress) {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .update(patch)
      .eq('id', progress.id)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        bootcamp_id: bootcampId,
        watch_time: 0,
        last_position: 0,
        ...patch,
      })
      .select()
      .single();
    if (error) throw error;
    result = data;
  }

  // Revalidate to show updated completion in progress calculations
  revalidatePath(`/account/member/bootcamps/${bootcampId}`);
  revalidatePath(`/account/member/bootcamps/${bootcampId}/${lessonId}`);

  return result;
}

/**
 * AI server action to parse raw practice problem data into structured problems.
 * Handles: problem links, editorials, solution code, YouTube links, star ratings, difficulty.
 */
export async function generatePracticeProblemsAction(
  rawText,
  guidelines = '',
  difficulty = 'medium'
) {
  await requireAdmin();

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 5) {
    return { error: 'Please provide some practice problems text to parse.' };
  }

  const input = preprocessRawInput(rawText);

  const systemPrompt = `You are an expert competitive programming content parser and developer. Convert raw input into a JSON array of practice problem objects.

ADDITIONAL PARAMETERS:
- Target Difficulty: ${difficulty} (Ensure the explanation complexity and editorial depth reflect this level)
- Custom/Formatting Guidelines: ${guidelines || 'None specified'}

RULES:
1. Each object must have exactly these keys:
   - "id": unique string like "p-1", "p-2"
   - "name": problem name (e.g. "Watermelon", "Two Sum", "A+B Problem")
   - "source": platform name (e.g. "Codeforces", "LeetCode", "VJudge", "AtCoder", "HackerRank")
   - "url": direct problem URL (http/https). Empty string if not found.
   - "video_url": YouTube/solution video URL. Empty string if not found.
   - "editorial": A highly clear, professional, and beautiful explanation in markdown. Ensure any formulas are in LaTeX/Markdown and formatting is completely clean. Use \\n for newlines.
   - "solution_code": clean and beautifully structured solution code (C++/Python/Java). Use \\n for newlines inside code. Empty string if not found.

2. Detect platform from URL patterns:
   - codeforces.com → "Codeforces"
   - leetcode.com → "LeetCode"
   - vjudge.net → "VJudge"
   - atcoder.jp → "AtCoder"
   - spoj.com → "SPOJ"
   - youtube.com / youtu.be → put in video_url, NOT url

3. Do NOT include any text outside the JSON array.
4. Do NOT wrap in markdown code fences.
5. Escape all newlines inside string values as \\n.
6. Parse ALL problems from the input — do not skip any.

OUTPUT FORMAT (return exactly this, no prose):
[{"id":"p-1","name":"Watermelon","source":"Codeforces","url":"https://...","video_url":"","editorial":"","solution_code":""}]`;

  try {
    const generatedText = await callAI(systemPrompt, input, {
      maxTokens: 8192,
      temperature: 0.15,
      jsonMode: true,
    });
    const parsed = robustJsonParse(generatedText);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(
        'AI did not return a valid array of problems. Check your input format.'
      );
    }

    const normalized = parsed.map((p) => ({
      id: crypto.randomUUID(),
      name:
        typeof p.name === 'string' && p.name.trim()
          ? p.name.trim()
          : 'Untitled Problem',
      source:
        typeof p.source === 'string' && p.source.trim()
          ? p.source.trim()
          : 'Unknown',
      url: typeof p.url === 'string' ? p.url.trim() : '',
      video_url: typeof p.video_url === 'string' ? p.video_url.trim() : '',
      editorial: typeof p.editorial === 'string' ? p.editorial : '',
      solution_code: typeof p.solution_code === 'string' ? p.solution_code : '',
    }));

    return { success: true, problems: normalized };
  } catch (err) {
    console.error('[generatePracticeProblemsAction] error:', err);
    return { error: err.message || 'Failed to parse practice problems text.' };
  }
}

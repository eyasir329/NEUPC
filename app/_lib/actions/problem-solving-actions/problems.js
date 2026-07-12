/**
 * @file Per-problem actions: details, submissions, notes, AI chat.
 * @module problem-solving-actions/problems
 */

'use server';

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { V2_TABLES, getPlatformId, isV2SchemaAvailable } from '@/app/_lib/services/problem-solving-v2-helpers';

export async function getUserAllProblems() {
  const { user } = await requireRole('member');
  const useV2 = await isV2SchemaAvailable();

  const isAC = (v) => {
    const u = String(v || '').toUpperCase().trim();
    return u === 'AC' || u === 'OK' || u === 'ACCEPTED';
  };

  if (useV2) {
    // 1. Solved problems from user_solves (one row per unique problem solved)
    const { data: solves, error: solvesError } = await supabaseAdmin
      .from(V2_TABLES.USER_SOLVES)
      .select(
        `first_solved_at,
         problems!user_solves_problem_id_fkey(
           id, external_id, name, url, difficulty_rating,
           platforms!problems_platform_id_fkey(code, name)
         )`
      )
      .eq('user_id', user.id)
      .limit(10000);

    if (solvesError) {
      console.error('[getUserAllProblems] solves query error:', solvesError.message);
    }

    const solvedByProblemId = new Map();
    for (const row of solves || []) {
      const p = row.problems;
      if (!p) continue;
      const platform = p.platforms?.code || '';
      const key = `${platform}:${p.external_id}`;
      solvedByProblemId.set(key, {
        problem_id: p.external_id,
        problem_name: p.name,
        problem_url: p.url,
        platform,
        difficulty_rating: p.difficulty_rating ?? null,
        submitted_at: row.first_solved_at,
        verdict: 'AC',
        solved: true,
      });
    }

    // 2. All submissions to catch unsolved attempts not in user_solves
    const { data: subs, error: subsError } = await supabaseAdmin
      .from(V2_TABLES.SUBMISSIONS)
      .select(
        `external_problem_id, problem_name, verdict, submitted_at,
         platforms!submissions_platform_id_fkey(code)`
      )
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(10000);

    if (subsError) {
      console.error('[getUserAllProblems] subs query error:', subsError.message);
    }

    const attemptMap = new Map();
    for (const sub of subs || []) {
      if (!sub.external_problem_id) continue;
      const platform = sub.platforms?.code || '';
      const key = `${platform}:${sub.external_problem_id}`;
      // Already have it as solved — skip
      if (solvedByProblemId.has(key)) continue;
      // Keep the best (AC) or most recent entry
      const existing = attemptMap.get(key);
      if (!existing || (!isAC(existing.verdict) && isAC(sub.verdict))) {
        attemptMap.set(key, {
          problem_id: sub.external_problem_id,
          problem_name: sub.problem_name || sub.external_problem_id,
          problem_url: null,
          platform,
          difficulty_rating: null,
          submitted_at: sub.submitted_at,
          verdict: sub.verdict,
          solved: isAC(sub.verdict),
        });
      }
    }

    const all = [
      ...Array.from(solvedByProblemId.values()),
      ...Array.from(attemptMap.values()),
    ];
    all.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    return { problems: all };
  }

  // Legacy schema
  const { data: subs } = await supabaseAdmin
    .from('problem_submissions')
    .select(
      'problem_id, platform, problem_name, problem_url, verdict, submitted_at, difficulty_rating'
    )
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false });

  const seen = new Map();
  for (const sub of subs || []) {
    if (!sub.problem_id) continue;
    const key = `${sub.platform}:${sub.problem_id}`;
    const existing = seen.get(key);
    if (!existing || (!isAC(existing.verdict) && isAC(sub.verdict))) {
      seen.set(key, {
        problem_id: sub.problem_id,
        problem_name: sub.problem_name || sub.problem_id,
        problem_url: sub.problem_url,
        platform: sub.platform,
        difficulty_rating: sub.difficulty_rating ?? null,
        submitted_at: sub.submitted_at,
        verdict: sub.verdict,
        solved: isAC(sub.verdict),
      });
    }
  }

  const all = Array.from(seen.values());
  all.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  return { problems: all };
}

// ============================================
// PROBLEM DETAIL ACTIONS
// ============================================

/**
 * Fetch full problem details from DB (description, examples, analysis, editorial)
 */
export async function getProblemDetailsAction(platform, externalId) {
  try {
    await requireRole('member');

    const v2 = await isV2SchemaAvailable();
    if (!v2) return { success: false, data: null };

    const platformId = await getPlatformId(platform);
    if (!platformId) return { success: false, data: null };

    const { data: problem, error } = await supabaseAdmin
      .from(V2_TABLES.PROBLEMS)
      .select(
        `
        id, name, description, input_format, output_format, constraints, examples, notes, url,
        problem_analysis(summary, key_concepts, hints, common_mistakes, time_complexity, space_complexity),
        problem_editorials(tutorial_url, tutorial_content, tutorial_solutions)
      `
      )
      .eq('platform_id', platformId)
      .eq('external_id', externalId)
      .maybeSingle();

    if (error) {
      console.error('[getProblemDetailsAction] Error:', error.message);
      return { success: false, data: null };
    }

    if (!problem) return { success: true, data: null };

    const analysis = Array.isArray(problem.problem_analysis)
      ? problem.problem_analysis[0]
      : problem.problem_analysis;
    const editorial = Array.isArray(problem.problem_editorials)
      ? problem.problem_editorials[0]
      : problem.problem_editorials;

    return {
      success: true,
      data: {
        description: problem.description || null,
        input_format: problem.input_format || null,
        output_format: problem.output_format || null,
        constraints: problem.constraints || [],
        examples: problem.examples || [],
        notes: problem.notes || null,
        url: problem.url || null,
        analysis: analysis
          ? {
              summary: analysis.summary || null,
              key_concepts: analysis.key_concepts || [],
              hints: analysis.hints || [],
              common_mistakes: analysis.common_mistakes || [],
              time_complexity: analysis.time_complexity || null,
              space_complexity: analysis.space_complexity || null,
            }
          : null,
        editorial: editorial
          ? {
              tutorial_url: editorial.tutorial_url || null,
              tutorial_content: editorial.tutorial_content || null,
              tutorial_solutions: editorial.tutorial_solutions || [],
            }
          : null,
      },
    };
  } catch (err) {
    console.error('[getProblemDetailsAction] Exception:', err.message);
    return { success: false, data: null };
  }
}

/**
 * Fetch ALL user submissions for a specific problem
 */
export async function getProblemSubmissionsAction(platform, externalId) {
  try {
    const user = await requireRole('member');

    const v2 = await isV2SchemaAvailable();
    if (!v2) return { success: false, submissions: [] };

    const platformId = await getPlatformId(platform);
    if (!platformId) return { success: false, submissions: [] };

    const { data: subs, error } = await supabaseAdmin
      .from(V2_TABLES.SUBMISSIONS)
      .select(
        `
        id, verdict, execution_time_ms, memory_kb, submitted_at, language_id, external_problem_id,
        solutions(id, source_code, is_primary, languages(name))
      `
      )
      .eq('user_id', user.id)
      .eq('platform_id', platformId)
      .eq('external_problem_id', externalId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('[getProblemSubmissionsAction] Error:', error.message);
      return { success: false, submissions: [] };
    }

    const submissions = (subs || []).map((sub) => {
      const primarySol = (sub.solutions || []).find((s) => s.is_primary) || sub.solutions?.[0];
      return {
        id: sub.id,
        verdict: sub.verdict,
        execution_time_ms: sub.execution_time_ms,
        memory_kb: sub.memory_kb,
        submitted_at: sub.submitted_at,
        language: primarySol?.languages?.name || null,
        source_code: primarySol?.source_code || null,
        problem_id: sub.external_problem_id,
        platform,
      };
    });

    return { success: true, submissions };
  } catch (err) {
    console.error('[getProblemSubmissionsAction] Exception:', err.message);
    return { success: false, submissions: [] };
  }
}

/**
 * Fetch user's personal note for a problem
 */
export async function getProblemNoteAction(platform, externalId) {
  try {
    const user = await requireRole('member');

    const v2 = await isV2SchemaAvailable();
    if (!v2) return { success: false, note: '' };

    const platformId = await getPlatformId(platform);
    if (!platformId) return { success: false, note: '' };

    const { data: problem } = await supabaseAdmin
      .from(V2_TABLES.PROBLEMS)
      .select('id')
      .eq('platform_id', platformId)
      .eq('external_id', externalId)
      .maybeSingle();

    if (!problem) return { success: true, note: '' };

    const { data: solve } = await supabaseAdmin
      .from(V2_TABLES.USER_SOLVES)
      .select('notes')
      .eq('user_id', user.id)
      .eq('problem_id', problem.id)
      .maybeSingle();

    return { success: true, note: solve?.notes || '' };
  } catch (err) {
    console.error('[getProblemNoteAction] Exception:', err.message);
    return { success: false, note: '' };
  }
}

/**
 * Save user's personal note for a problem
 */
export async function saveProblemNoteAction(platform, externalId, note) {
  try {
    const user = await requireRole('member');

    const v2 = await isV2SchemaAvailable();
    if (!v2) return { success: false };

    const platformId = await getPlatformId(platform);
    if (!platformId) return { success: false };

    const { data: problem } = await supabaseAdmin
      .from(V2_TABLES.PROBLEMS)
      .select('id')
      .eq('platform_id', platformId)
      .eq('external_id', externalId)
      .maybeSingle();

    if (!problem) return { success: false, error: 'Problem not found in DB' };

    const { error } = await supabaseAdmin
      .from(V2_TABLES.USER_SOLVES)
      .update({ notes: note, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('problem_id', problem.id);

    if (error) {
      console.error('[saveProblemNoteAction] Error:', error.message);
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error('[saveProblemNoteAction] Exception:', err.message);
    return { success: false };
  }
}

/**
 * Chat about a problem using available LLM providers
 */
export async function chatAboutProblemAction(platform, externalId, problemName, userMessages) {
  try {
    await requireRole('member');

    const { generateCompletion } = await import('@/app/_lib/integrations/llm');

    const systemPrompt = `You are an expert competitive programmer helping a user understand a problem.
Problem: ${problemName || externalId} (${platform})
Be concise and focused. Answer only what is asked. Do not spoil the full solution unless asked.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...userMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const { content, provider } = await generateCompletion(messages, {
      temperature: 0.4,
      maxTokens: 800,
    });

    return { success: true, content, provider };
  } catch (err) {
    console.error('[chatAboutProblemAction] Exception:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * @file Shared helpers + constants for the bootcamp actions (split out
 *   so each domain module can reuse them).
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

export const ALLOWED_BOOTCAMP_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_BOOTCAMP_IMAGE_SIZE = 5 * 1024 * 1024;

export /**
 * Member: submit (or resubmit) a task.
 */
/**
 * Upload a file (image, pdf, doc, archive) as an attachment for a member's
 * task submission. Returns { url, name, size, type } on success.
 */
const MAX_TASK_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB

export // ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve session → { userId, roleNames }. Returns nulls when unauthenticated.
 * Single source of truth for the auth/lookup dance these actions share.
 */
async function getSessionUserAndRoles() {
  const session = await auth();
  if (!session?.user?.email) return { userId: null, roleNames: [] };

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (!user) return { userId: null, roleNames: [] };

  const { data: roles } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const roleNames = (roles || []).map((r) => r.roles?.name).filter(Boolean);
  return { userId: user.id, roleNames };
}

export /**
 * Throw if the current user lacks any of the given roles; otherwise return userId.
 */
async function requireAnyRole(allowedRoles, deniedMessage = 'Access denied') {
  const { userId, roleNames } = await getSessionUserAndRoles();
  if (!userId) throw new Error('Unauthorized');
  if (!allowedRoles.some((r) => roleNames.includes(r))) {
    throw new Error(deniedMessage);
  }
  return userId;
}

export /**
 * Check if current user is admin or executive.
 */
async function requireAdmin() {
  return requireAnyRole(
    ['admin', 'executive'],
    'Admin or Executive access required'
  );
}

export /**
 * Check if current user is admin, executive, or any mentor.
 */
async function requireAdminOrMentor() {
  return requireAnyRole(['admin', 'executive', 'mentor']);
}

export /**
 * Check if current user is admin, executive, or a mentor assigned to this specific bootcamp.
 */
async function requireAdminOrBootcampMentor(bootcampId) {
  const { userId, roleNames } = await getSessionUserAndRoles();
  if (!userId) throw new Error('Unauthorized');
  if (roleNames.includes('admin') || roleNames.includes('executive'))
    return userId;
  if (bootcampId) {
    const { data: mentorRow } = await supabaseAdmin
      .from('bootcamp_mentors')
      .select('id')
      .eq('bootcamp_id', bootcampId)
      .eq('user_id', userId)
      .single();
    if (mentorRow) return userId;
  }
  throw new Error('Access denied');
}

export /**
 * Get current user ID.
 */
async function getCurrentUserId() {
  const { userId } = await getSessionUserAndRoles();
  return userId;
}

export /**
 * Resolve the bootcamp owning a lesson and assert the current user is
 * enrolled (active status) in it. Free-preview lessons skip enrollment.
 * Centralized so progress/notes/practice actions can't be called for a
 * bootcamp the caller isn't a member of (closes IDOR).
 *
 * @returns {Promise<{ userId: string, bootcampId: string, lessonId: string, isFreePreview: boolean }>}
 * @throws if unauthenticated, lesson missing, or user not enrolled.
 */
async function requireLessonAccess(lessonId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('id, is_free_preview, modules(courses(bootcamp_id))')
    .eq('id', lessonId)
    .single();
  const bootcampId = lesson?.modules?.courses?.bootcamp_id;
  if (!bootcampId) throw new Error('Lesson not found');

  if (lesson.is_free_preview) {
    return { userId, bootcampId, lessonId, isFreePreview: true };
  }

  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('status')
    .eq('user_id', userId)
    .eq('bootcamp_id', bootcampId)
    .single();
  if (!enrollment || enrollment.status !== 'active') {
    throw new Error('Not enrolled in this bootcamp');
  }

  return { userId, bootcampId, lessonId, isFreePreview: false };
}

export /**
 * Generate a URL-friendly slug from a string.
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export /**
 * Recompute and persist total_lessons / total_duration on a bootcamp
 * by aggregating across its courses → modules → lessons.
 */
async function recomputeBootcampTotals(bootcampId) {
  if (!bootcampId) return;
  try {
    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('duration, modules!inner(course_id, courses!inner(bootcamp_id))')
      .eq('modules.courses.bootcamp_id', bootcampId);

    const total_lessons = lessons?.length || 0;
    const total_duration = (lessons || []).reduce(
      (sum, l) => sum + (parseInt(l.duration) || 0),
      0
    );

    await supabaseAdmin
      .from('bootcamps')
      .update({ total_lessons, total_duration })
      .eq('id', bootcampId);
  } catch {
    // Non-fatal: stale totals are cosmetic, don't break the parent op
  }
}

export /**
 * Robust JSON parser for AI outputs.
 * Strategy (in order):
 *   1. Strip markdown code-fence wrappers
 *   2. Extract the outermost [...] via bracket-balanced scan
 *   3. Standard JSON.parse on the extracted slice
 *   4. Sanitise raw control chars inside strings (char-by-char), then retry
 *   5. Bracket-balanced per-object extractor (handles nested arrays e.g. options:[...])
 *   6. Strip trailing commas then retry
 */
function robustJsonParse(raw) {
  // Step 1: strip markdown fences
  let s = raw.trim();
  // Remove leading ```lang and trailing ```
  s = s
    .replace(/^```[a-zA-Z]*/, '')
    .replace(/```\s*$/, '')
    .trim();

  // Step 2: bracket-balanced outermost [...] extraction
  function extractOutermostArray(text) {
    const start = text.indexOf('[');
    if (start === -1) return null;
    let depth = 0,
      inStr = false,
      esc = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === '\\' && inStr) {
        esc = true;
        continue;
      }
      if (ch === '"') {
        inStr = !inStr;
        continue;
      }
      if (inStr) continue;
      if (ch === '[') depth++;
      else if (ch === ']') {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
    return depth > 0 ? text.slice(start) + ']' : null;
  }

  // Step 3: try standard parse
  const arraySlice = extractOutermostArray(s) || s;
  try {
    return JSON.parse(arraySlice);
  } catch (e) {
    console.warn('[robustJsonParse] pass-1 failed:', e.message);
  }

  // Step 4: sanitise raw control chars inside JSON strings using char-by-char walk
  function sanitise(text) {
    let out = '',
      inStr = false,
      esc = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (esc) {
        out += ch;
        esc = false;
        continue;
      }
      if (ch === '\\' && inStr) {
        out += ch;
        esc = true;
        continue;
      }
      if (ch === '"') {
        inStr = !inStr;
        out += ch;
        continue;
      }
      if (inStr) {
        if (ch === '\n') {
          out += '\\n';
          continue;
        }
        if (ch === '\r') {
          out += '\\r';
          continue;
        }
        if (ch === '\t') {
          out += '\\t';
          continue;
        }
      }
      out += ch;
    }
    return out;
  }

  try {
    return JSON.parse(sanitise(arraySlice));
  } catch (e) {
    console.warn('[robustJsonParse] pass-2 (sanitised) failed:', e.message);
  }

  // Step 5: bracket-balanced per-object extraction (correctly handles nested arrays)
  function extractObjects(text) {
    const items = [];
    let i = 0;
    while (i < text.length) {
      if (text[i] !== '{') {
        i++;
        continue;
      }
      let depth = 0,
        inStr = false,
        esc = false;
      const start = i;
      for (; i < text.length; i++) {
        const ch = text[i];
        if (esc) {
          esc = false;
          continue;
        }
        if (ch === '\\' && inStr) {
          esc = true;
          continue;
        }
        if (ch === '"') {
          inStr = !inStr;
          continue;
        }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            try {
              const obj = JSON.parse(sanitise(text.slice(start, i + 1)));
              if (obj && typeof obj === 'object') items.push(obj);
            } catch {}
            i++;
            break;
          }
        }
      }
    }
    return items;
  }

  const objects = extractObjects(arraySlice);
  if (objects.length > 0) {
    console.log(
      '[robustJsonParse] pass-3: extracted ' +
        objects.length +
        ' objects via bracket balancing'
    );
    return objects;
  }

  // Step 6: strip trailing commas then retry
  try {
    const fixed = sanitise(arraySlice).replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(fixed);
  } catch (e) {
    console.warn(
      '[robustJsonParse] pass-4 (trailing-comma) failed:',
      e.message
    );
  }

  throw new Error(
    'AI returned an unparseable response. Try with shorter or simpler input, or rephrase your questions.'
  );
}

export /**
 * Shared AI call helper — supports Gemini (POST) and Pollinations (POST fallback).
 * Automatically retries once with a reduced token limit if the first call fails.
 */
async function callAI(
  systemPrompt,
  userText,
  { maxTokens = 8192, temperature = 0.2, jsonMode = true } = {}
) {
  const hasGemini = !!process.env.GEMINI_API_KEY;

  async function tryGemini(tokens) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const body = {
      contents: [
        {
          parts: [{ text: `${systemPrompt}\n\n---\nRAW INPUT:\n${userText}` }],
        },
      ],
      generationConfig: {
        maxOutputTokens: tokens,
        temperature,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(
        `Gemini API error ${res.status}: ${errBody.slice(0, 200)}`
      );
    }
    const data = await res.json();
    // Gemini can return multiple candidates/parts — join all text parts
    return (
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('') ?? ''
    );
  }

  async function tryPollinations(tokens) {
    // Use POST to avoid 8KB URL limit
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ],
        model: 'openai',
        max_tokens: Math.min(tokens, 4000),
        temperature,
        jsonMode: jsonMode,
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(
        `Pollinations API error ${res.status}: ${errBody.slice(0, 200)}`
      );
    }
    const data = await res.json().catch(() => null);
    // Pollinations returns OpenAI-compatible shape
    return (
      data?.choices?.[0]?.message?.content ?? (await res.text().catch(() => ''))
    );
  }

  const caller = hasGemini ? tryGemini : tryPollinations;

  // First attempt
  try {
    const text = await caller(maxTokens);
    if (text && text.trim().length > 2) return text;
    throw new Error('Empty response from AI');
  } catch (firstErr) {
    console.warn(
      '[callAI] first attempt failed, retrying with smaller token limit:',
      firstErr.message
    );
  }

  // Retry with smaller limit
  const text = await caller(Math.min(maxTokens, 4096));
  if (!text || text.trim().length < 2)
    throw new Error('AI returned empty response on retry');
  return text;
}

export /**
 * Pre-processes raw admin input before sending to AI.
 * Normalises whitespace, removes invisible chars, and strips BOM.
 */
function preprocessRawInput(raw) {
  return raw
    .replace(/^\uFEFF/, '') // strip BOM
    .replace(/\u00A0/g, ' ') // nbsp → space
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
    .replace(/\r\n/g, '\n') // normalise line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ') // tabs → 2 spaces
    .replace(/[ \t]+$/gm, '') // trailing whitespace per line
    .replace(/\n{4,}/g, '\n\n\n') // max 3 consecutive blank lines
    .trim();
}

export /**
 * Converts a correct-option value to a 0-based integer index.
 * Handles: 0-3 (number), "0"-"3" (string number), "A"-"D" (letter), "a"-"d".
 */
function normaliseCorrectOption(raw, fallback = 0) {
  if (typeof raw === 'number' && raw >= 0 && raw <= 3) return raw;
  if (typeof raw === 'string') {
    const upper = raw.trim().toUpperCase();
    const letterMap = { A: 0, B: 1, C: 2, D: 3 };
    if (upper in letterMap) return letterMap[upper];
    const n = parseInt(upper, 10);
    if (!isNaN(n) && n >= 0 && n <= 3) return n;
  }
  return fallback;
}

export /**
 * Pads or trims an options array to exactly 4 entries.
 */
function normaliseOptions(opts) {
  const labels = ['Option A', 'Option B', 'Option C', 'Option D'];
  if (!Array.isArray(opts)) return labels;
  const trimmed = opts
    .slice(0, 4)
    .map((o, i) => (typeof o === 'string' && o.trim() ? o.trim() : labels[i]));
  while (trimmed.length < 4) trimmed.push(labels[trimmed.length]);
  return trimmed;
}

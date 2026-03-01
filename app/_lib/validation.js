/**
 * @file Input validation and sanitization utilities.
 * Provides reusable validators and sanitizers for server actions
 * and API routes to prevent XSS, injection, and bad input.
 *
 * @module validation
 */

// ── Sanitisation ────────────────────────────────────────────────────────────

/**
 * Strip HTML tags from a string to prevent stored XSS.
 * Preserves the text content, strips all `<...>` tags.
 * @param {string} input
 * @returns {string}
 */
export function stripHtml(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Escape HTML special characters for safe display.
 * @param {string} input
 * @returns {string}
 */
export function escapeHtml(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitise a plain-text field: trim, strip HTML, enforce max length.
 * @param {string|null|undefined} input
 * @param {number} [maxLength=500]
 * @returns {string}
 */
export function sanitizeText(input, maxLength = 500) {
  if (!input || typeof input !== 'string') return '';
  return stripHtml(input).slice(0, maxLength).trim();
}

/**
 * Sanitise rich content (blog posts, descriptions) — strips dangerous tags
 * but preserves basic formatting. For maximum safety, use a whitelist-based
 * approach in a future iteration with DOMPurify / sanitize-html.
 * @param {string|null|undefined} input
 * @param {number} [maxLength=50000]
 * @returns {string}
 */
export function sanitizeRichText(input, maxLength = 50000) {
  if (!input || typeof input !== 'string') return '';
  // Remove script/style tags and their contents
  let cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '') // on-event without quotes
    .replace(/javascript\s*:/gi, '') // javascript: URLs
    .replace(/data\s*:[^;]*;base64/gi, '') // data: URIs
    .replace(/vbscript\s*:/gi, ''); // vbscript: URLs
  return cleaned.slice(0, maxLength).trim();
}

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate an email address format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplified
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate a URL format.
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate a UUID v4 format.
 * @param {string} id
 * @returns {boolean}
 */
export function isValidUUID(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

/**
 * Validate that a string is non-empty after trimming.
 * @param {string} value
 * @param {string} fieldName — For error message.
 * @param {object} [options]
 * @param {number} [options.minLength=1]
 * @param {number} [options.maxLength=500]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateString(
  value,
  fieldName,
  { minLength = 1, maxLength = 500 } = {}
) {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName} is required.` };
  }
  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters.`,
    };
  }
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${maxLength} characters.`,
    };
  }
  return { valid: true };
}

/**
 * Validate an integer ID (Supabase bigint IDs).
 * @param {*} id
 * @returns {boolean}
 */
export function isValidId(id) {
  if (id === null || id === undefined) return false;
  const num = Number(id);
  return Number.isInteger(num) && num > 0;
}

/**
 * Whitelist object keys — only keep allowed fields.
 * Prevents mass-assignment attacks.
 * @param {object} obj — Input object.
 * @param {string[]} allowedKeys — List of allowed keys.
 * @returns {object}
 */
export function pickAllowedFields(obj, allowedKeys) {
  if (!obj || typeof obj !== 'object') return {};
  const result = {};
  for (const key of allowedKeys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

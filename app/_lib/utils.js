/**
 * @file utils
 * @module utils
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Combines clsx (conditional class joining) + tailwind-merge (deduplication).
 *
 * @param  {...(string|boolean|null|undefined|Record<string,boolean>)} inputs
 * @returns {string} Merged class string
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary-500', 'px-6')
 * // → 'py-2 bg-primary-500 px-6'
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a human-readable format.
 *
 * @param {string} dateStr - ISO date string
 * @param {Intl.DateTimeFormatOptions} [options] - Intl format options
 * @returns {string} Formatted date or empty string
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  try {
    const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', {
      ...defaults,
      ...options,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Estimate reading time based on word count.
 *
 * @param {string} content - Text content
 * @param {number} [wpm=200] - Words per minute
 * @returns {string} Reading time string (e.g. "5 min")
 */
export function estimateReadTime(content, wpm = 200) {
  if (!content) return '5 min';
  const words = content.split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / wpm))} min`;
}

/**
 * Extract initials from a full name.
 *
 * @param {string} name - Full name
 * @returns {string} 1-2 letter initials
 */
export function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

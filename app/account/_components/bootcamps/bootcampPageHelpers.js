/**
 * @file Shared helpers for bootcamp list/detail role pages.
 * Eliminates the try/catch + error-state boilerplate duplicated across
 * admin/executive (and mentor detail) bootcamp pages.
 * @module bootcampPageHelpers
 */

/**
 * Run an async fetch, returning `{ data, error }` where `error` is a string.
 * Mirrors the pattern previously inlined in every role page.
 */
export async function safeFetch(fn) {
  try {
    return { data: await fn(), error: null };
  } catch (err) {
    const error =
      err?.message ||
      (typeof err === 'string' ? err : 'An unexpected error occurred');
    return { data: null, error };
  }
}

/**
 * @file Server Actions for client-driven, server-side paginated public lists.
 * @module public-list-actions
 *
 * These are the client → server entry points for paginated/filtered public
 * pages. They simply await the cached read helpers in `public-actions.js`
 * (which stays directive-free for direct SSR use during the initial render).
 */

'use server';

import { getPublicEventsPage } from './public-actions';

// Fetch a page of public events for the events list (filters/sort/search).
export async function fetchEventsPage(params) {
  return getPublicEventsPage(params);
}

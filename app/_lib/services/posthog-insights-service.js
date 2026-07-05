/**
 * @file PostHog insights service (server-only).
 *
 * Fetches saved insights (and their computed results) from the PostHog
 * Query API so the admin panel can render every insight in the project.
 * Uses a **personal API key** (`phx_...`) — read-scoped, server-side only.
 * NEVER expose the personal key or these functions to the client.
 *
 * Required env:
 *   POSTHOG_PERSONAL_API_KEY   phx_... personal API key (read insights)
 *   POSTHOG_PROJECT_ID         numeric project id (e.g. 496622)
 *   POSTHOG_API_HOST           optional, defaults to https://us.posthog.com
 *
 * @module posthog-insights-service
 * @access admin
 */

import 'server-only';

const API_HOST = process.env.POSTHOG_API_HOST || 'https://us.posthog.com';
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;

/**
 * Whether the service is configured to talk to PostHog.
 * The dashboard degrades gracefully to a setup notice when false.
 */
export function isPostHogConfigured() {
  return Boolean(API_KEY && PROJECT_ID);
}

/**
 * Base URL for this project's app (for "open in PostHog" links).
 */
export function postHogProjectUrl() {
  if (!PROJECT_ID) return API_HOST;
  return `${API_HOST}/project/${PROJECT_ID}`;
}

async function phFetch(path, params = {}) {
  const url = new URL(`${API_HOST}/api/projects/${PROJECT_ID}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    // Insight results change slowly; cache for 5 min to stay well under
    // PostHog's rate limits and keep the admin page fast.
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `PostHog API ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 300)}`
    );
  }
  return res.json();
}

/**
 * Normalize a PostHog insight's raw `result` into a shape the client can
 * render without knowing PostHog internals. Detects the common insight
 * kinds (trends, funnels, single-number) and falls back to `unknown`.
 *
 * @returns {{ kind: 'trend'|'funnel'|'number'|'empty'|'unknown',
 *             series?: Array, steps?: Array, value?: number, raw?: any }}
 */
function normalizeResult(result) {
  if (result == null || (Array.isArray(result) && result.length === 0)) {
    return { kind: 'empty' };
  }

  // Trend: array of series each carrying a numeric `data` array + labels.
  // NOTE: trend series ALSO include `count`/`order`, so this must be checked
  // BEFORE the funnel case (a funnel step has no `data` array).
  if (Array.isArray(result) && result.every((r) => Array.isArray(r?.data))) {
    const labels = result[0]?.labels || result[0]?.days || [];
    const points = labels.map((label, i) => {
      const row = { label: String(label) };
      result.forEach((series, si) => {
        const key = series.label || series.name || `series_${si}`;
        row[key] = series.data[i] ?? 0;
      });
      return row;
    });
    const seriesKeys = result.map(
      (series, si) => series.label || series.name || `series_${si}`
    );
    return { kind: 'trend', points, seriesKeys };
  }

  // Funnel: array of steps each with { name, count, order } and NO `data` array.
  if (
    Array.isArray(result) &&
    result.every(
      (r) => r && typeof r.count === 'number' && 'order' in r && !Array.isArray(r.data)
    )
  ) {
    const steps = result.map((s) => ({
      name: s.custom_name || s.name || `Step ${s.order + 1}`,
      count: s.count,
    }));
    return { kind: 'funnel', steps };
  }

  // Single aggregated number
  if (Array.isArray(result) && result.length === 1 && result[0]?.aggregated_value != null) {
    return { kind: 'number', value: result[0].aggregated_value };
  }

  return { kind: 'unknown', raw: result };
}

/**
 * Fetch every saved insight in the project, with computed results.
 *
 * @returns {Promise<Array<{
 *   id: number, shortId: string, name: string, description: string,
 *   url: string, lastRefresh: string|null, normalized: object,
 * }>>}
 */
export async function getAllInsights() {
  if (!isPostHogConfigured()) return [];

  // `refresh=blocking` asks PostHog to (re)compute results before returning.
  // Paginate defensively in case the project has many insights.
  const insights = [];
  let path = '/insights/';
  let params = { limit: 100, refresh: 'blocking', saved: 'true' };

  // Follow `next` cursors until exhausted (cap at 5 pages for safety).
  for (let page = 0; page < 5 && path; page++) {
    const data = await phFetch(path, page === 0 ? params : {});
    for (const it of data.results || []) {
      // Skip insights that aren't meant to be shown standalone.
      if (it.deleted) continue;
      insights.push({
        id: it.id,
        shortId: it.short_id,
        name: it.name || it.derived_name || 'Untitled insight',
        description: it.description || '',
        favorited: Boolean(it.favorited),
        url: `${postHogProjectUrl()}/insights/${it.short_id}`,
        lastRefresh: it.last_refresh || null,
        normalized: normalizeResult(it.result),
      });
    }
    // `next` is an absolute URL; strip to a project-relative path for phFetch.
    if (data.next) {
      const u = new URL(data.next);
      path = u.pathname.replace(`/api/projects/${PROJECT_ID}`, '') + u.search;
      params = {};
    } else {
      path = null;
    }
  }

  // Favorited first, then alphabetical — stable, useful ordering.
  insights.sort((a, b) => {
    if (a.favorited !== b.favorited) return a.favorited ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return insights;
}

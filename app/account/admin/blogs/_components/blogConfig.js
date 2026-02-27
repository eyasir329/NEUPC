// ─── Status config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    badge: 'bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/30',
    dot: 'bg-gray-400',
    cardBorder: 'border-gray-700/50',
    gradient: 'from-gray-900/80 to-gray-800/40',
    tabActive: 'bg-gray-800 text-gray-100',
  },
  published: {
    label: 'Published',
    badge: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
    dot: 'bg-emerald-400',
    cardBorder: 'border-emerald-700/30',
    gradient: 'from-emerald-950/80 to-emerald-900/20',
    tabActive: 'bg-emerald-900/50 text-emerald-100',
  },
  archived: {
    label: 'Archived',
    badge: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
    dot: 'bg-amber-400',
    cardBorder: 'border-amber-700/30',
    gradient: 'from-amber-950/80 to-amber-900/20',
    tabActive: 'bg-amber-900/40 text-amber-100',
  },
};

export const STATUSES = ['draft', 'published', 'archived'];

// ─── Category config ──────────────────────────────────────────────────────────

export const CATEGORY_CONFIG = {
  CP: {
    label: 'Competitive Programming',
    short: 'CP',
    color: 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30',
    emoji: '🏆',
  },
  WebDev: {
    label: 'Web Dev',
    short: 'WebDev',
    color: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
    emoji: '🌐',
  },
  'AI-ML': {
    label: 'AI / ML',
    short: 'AI-ML',
    color: 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30',
    emoji: '🤖',
  },
  Career: {
    label: 'Career',
    short: 'Career',
    color: 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/30',
    emoji: '💼',
  },
  News: {
    label: 'News',
    short: 'News',
    color: 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30',
    emoji: '📰',
  },
  Tutorial: {
    label: 'Tutorial',
    short: 'Tutorial',
    color: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30',
    emoji: '📚',
  },
  Other: {
    label: 'Other',
    short: 'Other',
    color: 'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30',
    emoji: '📄',
  },
};

export const CATEGORIES = Object.keys(CATEGORY_CONFIG);

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
}

export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.Other;
}

export function formatBlogDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatBlogDate(dateStr);
}

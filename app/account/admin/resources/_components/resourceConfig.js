// =============================================================================
// resourceConfig.js — Shared colour / label config for Resource Management
// =============================================================================

// ─── Resource Types ───────────────────────────────────────────────────────────

export const TYPE_CONFIG = {
  article: {
    label: 'Article',
    emoji: '📄',
    badge: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/25',
    placeholder: 'from-blue-900/60 to-blue-800/30',
  },
  video: {
    label: 'Video',
    emoji: '🎥',
    badge: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/25',
    placeholder: 'from-red-900/60 to-red-800/30',
  },
  course: {
    label: 'Course',
    emoji: '🎓',
    badge: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25',
    placeholder: 'from-violet-900/60 to-violet-800/30',
  },
  book: {
    label: 'Book',
    emoji: '📚',
    badge: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25',
    placeholder: 'from-amber-900/60 to-amber-800/30',
  },
  tool: {
    label: 'Tool',
    emoji: '🔧',
    badge: 'bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/25',
    placeholder: 'from-teal-900/60 to-teal-800/30',
  },
  documentation: {
    label: 'Documentation',
    emoji: '📖',
    badge: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25',
    placeholder: 'from-sky-900/60 to-sky-800/30',
  },
  other: {
    label: 'Other',
    emoji: '🔗',
    badge: 'bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/25',
    placeholder: 'from-gray-900/60 to-gray-800/30',
  },
};

export const RESOURCE_TYPES = Object.keys(TYPE_CONFIG);

// ─── Difficulty ───────────────────────────────────────────────────────────────

export const DIFFICULTY_CONFIG = {
  beginner: {
    label: 'Beginner',
    badge: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  intermediate: {
    label: 'Intermediate',
    badge: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25',
    dot: 'bg-amber-400',
  },
  advanced: {
    label: 'Advanced',
    badge: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/25',
    dot: 'bg-red-400',
  },
};

export const DIFFICULTIES = Object.keys(DIFFICULTY_CONFIG);

// ─── Categories (common programming club values) ──────────────────────────────

export const CATEGORIES = [
  'Competitive Programming',
  'Web Development',
  'Data Structures & Algorithms',
  'AI / ML',
  'System Design',
  'Interview Prep',
  'Open Source',
  'Career',
  'Club Internal',
  'Other',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTypeConfig(type) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.other;
}

export function getDifficultyConfig(difficulty) {
  return DIFFICULTY_CONFIG[difficulty] ?? null;
}

export function formatDate(dateStr) {
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
  return formatDate(dateStr);
}

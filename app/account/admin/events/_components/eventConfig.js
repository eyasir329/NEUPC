/**
 * @file Event configuration constants — category options, status labels,
 *   venue types, and colour mappings used across admin event components.
 * @module adminEventConfig
 */

// =============================================================================
// eventConfig.js — Shared colour / label config for Event Management
// =============================================================================

export const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    badge: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    dot: 'bg-gray-400',
    cardBorder: 'border-gray-700/50',
    cardBg: 'bg-gray-500/5',
    gradient: 'from-gray-500 to-gray-600',
    text: 'text-gray-400',
    statBg: 'bg-gray-500/15 text-gray-300',
  },
  upcoming: {
    label: 'Upcoming',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
    cardBorder: 'border-blue-700/40',
    cardBg: 'bg-blue-500/5',
    gradient: 'from-blue-500 to-blue-600',
    text: 'text-blue-400',
    statBg: 'bg-blue-500/15 text-blue-300',
  },
  ongoing: {
    label: 'Ongoing',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
    cardBorder: 'border-emerald-700/40',
    cardBg: 'bg-emerald-500/5',
    gradient: 'from-emerald-500 to-green-500',
    text: 'text-emerald-400',
    statBg: 'bg-emerald-500/15 text-emerald-300',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400',
    cardBorder: 'border-purple-700/40',
    cardBg: 'bg-purple-500/5',
    gradient: 'from-purple-500 to-violet-500',
    text: 'text-purple-400',
    statBg: 'bg-purple-500/15 text-purple-300',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
    dot: 'bg-red-400',
    cardBorder: 'border-red-700/40',
    cardBg: 'bg-red-500/5',
    gradient: 'from-red-500 to-rose-500',
    text: 'text-red-400',
    statBg: 'bg-red-500/15 text-red-300',
  },
};

export const CATEGORY_CONFIG = {
  Workshop: {
    icon: '🔧',
    badge: 'bg-sky-500/20 text-sky-300',
    color: 'sky',
    placeholder: 'from-sky-600/30 to-sky-800/30',
  },
  Contest: {
    icon: '🏆',
    badge: 'bg-amber-500/20 text-amber-300',
    color: 'amber',
    placeholder: 'from-amber-600/30 to-amber-800/30',
  },
  Seminar: {
    icon: '🎙️',
    badge: 'bg-teal-500/20 text-teal-300',
    color: 'teal',
    placeholder: 'from-teal-600/30 to-teal-800/30',
  },
  Bootcamp: {
    icon: '⚡',
    badge: 'bg-orange-500/20 text-orange-300',
    color: 'orange',
    placeholder: 'from-orange-600/30 to-orange-800/30',
  },
  Hackathon: {
    icon: '💻',
    badge: 'bg-violet-500/20 text-violet-300',
    color: 'violet',
    placeholder: 'from-violet-600/30 to-violet-800/30',
  },
  Meetup: {
    icon: '🤝',
    badge: 'bg-green-500/20 text-green-300',
    color: 'green',
    placeholder: 'from-green-600/30 to-green-800/30',
  },
  Other: {
    icon: '📅',
    badge: 'bg-gray-500/20 text-gray-300',
    color: 'gray',
    placeholder: 'from-gray-600/30 to-gray-800/30',
  },
};

export const VENUE_CONFIG = {
  online: {
    label: 'Online',
    icon: '🌐',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  offline: {
    label: 'In-Person',
    icon: '📍',
    badge: 'bg-rose-500/20 text-rose-300',
  },
  hybrid: {
    label: 'Hybrid',
    icon: '🔀',
    badge: 'bg-violet-500/20 text-violet-300',
  },
};

export const STATUSES = [
  'draft',
  'upcoming',
  'ongoing',
  'completed',
  'cancelled',
];
export const CATEGORIES = [
  'Workshop',
  'Contest',
  'Seminar',
  'Bootcamp',
  'Hackathon',
  'Meetup',
  'Other',
];
export const VENUE_TYPES = ['online', 'offline', 'hybrid'];

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
}

export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.Other;
}

export function getVenueConfig(venue) {
  return VENUE_CONFIG[venue] ?? VENUE_CONFIG.offline;
}

export function formatEventDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toLocalDateTimeInput(dateStr) {
  if (!dateStr) return '';
  // Convert to "YYYY-MM-DDTHH:mm" format for datetime-local input
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

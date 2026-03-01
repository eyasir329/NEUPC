/**
 * @file Notice configuration constants — notice types, priority levels,
 *   audience options, and colour mappings for admin notice components.
 * @module adminNoticeConfig
 */

// ─── Notice Types ─────────────────────────────────────────────────────────────

export const NOTICE_TYPES = [
  'general',
  'urgent',
  'event',
  'deadline',
  'achievement',
];

export const TYPE_CONFIG = {
  general: {
    label: 'General',
    emoji: '📢',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
  urgent: {
    label: 'Urgent',
    emoji: '🚨',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  event: {
    label: 'Event',
    emoji: '📅',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  deadline: {
    label: 'Deadline',
    emoji: '⏰',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  achievement: {
    label: 'Achievement',
    emoji: '🏆',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
};

export function getTypeConfig(type) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.general;
}

// ─── Priority ─────────────────────────────────────────────────────────────────

export const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    emoji: '🟢',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ring: 'border-slate-700/50',
  },
  medium: {
    label: 'Medium',
    emoji: '🔵',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ring: 'border-slate-700/50',
  },
  high: {
    label: 'High',
    emoji: '🟡',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ring: 'border-yellow-500/20',
  },
  critical: {
    label: 'Critical',
    emoji: '🔴',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    ring: 'border-red-500/30',
  },
};

export function getPriorityConfig(priority) {
  return PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

export function getStatCards(stats) {
  return [
    {
      label: 'Total',
      value: stats.total,
      icon: '📋',
      color: 'from-slate-500/20 to-slate-600/20 border-slate-500/20',
      text: 'text-slate-300',
    },
    {
      label: 'Pinned',
      value: stats.pinned,
      icon: '📌',
      color: 'from-violet-500/20 to-purple-500/20 border-violet-500/20',
      text: 'text-violet-400',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: '✅',
      color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/20',
      text: 'text-emerald-400',
    },
    {
      label: 'Expired',
      value: stats.expired,
      icon: '⏳',
      color: 'from-slate-500/20 to-zinc-500/20 border-slate-500/20',
      text: 'text-slate-400',
    },
    {
      label: 'Critical',
      value: stats.critical,
      icon: '🔴',
      color: 'from-red-500/20 to-rose-500/20 border-red-500/20',
      text: 'text-red-400',
    },
    {
      label: 'Urgent Type',
      value: stats.urgent,
      icon: '🚨',
      color: 'from-orange-500/20 to-amber-500/20 border-orange-500/20',
      text: 'text-orange-400',
    },
  ];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

export function isExpiringSoon(expiresAt, daysThreshold = 3) {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt);
  const now = new Date();
  if (exp <= now) return false;
  return (exp - now) / (1000 * 60 * 60 * 24) <= daysThreshold;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: '✅ Active' },
  { id: 'pinned', label: '📌 Pinned' },
  { id: 'critical', label: '🔴 Critical' },
  { id: 'expired', label: '⏳ Expired' },
];

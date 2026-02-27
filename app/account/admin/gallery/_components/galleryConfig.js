// ─── Type Configuration ───────────────────────────────────────────────────────

export const TYPE_CONFIG = {
  image: {
    label: 'Image',
    emoji: '🖼️',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    gradient: 'from-blue-900/40 to-slate-900/40',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8"
      >
        <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18a.75.75 0 00.75-.75V6.75A.75.75 0 0021 6H3a.75.75 0 00-.75.75v12.75c0 .414.336.75.75.75z" />
      </svg>
    ),
  },
  video: {
    label: 'Video',
    emoji: '🎬',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    gradient: 'from-red-900/40 to-slate-900/40',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8"
      >
        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
  },
};

export function getTypeConfig(type) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.image;
}

// ─── Gallery Categories ────────────────────────────────────────────────────────

export const GALLERY_CATEGORIES = [
  'Event Photos',
  'Workshop',
  'Contest',
  'Certificate',
  'Achievement',
  'Club Memory',
  'Team',
  'Inauguration',
  'Other',
];

// ─── Date Helpers ─────────────────────────────────────────────────────────────

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
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

// ─── Stat Cards Config ────────────────────────────────────────────────────────

export function getStatCards(stats) {
  return [
    {
      label: 'Total Items',
      value: stats.total,
      icon: '📁',
      color: 'from-violet-500/20 to-purple-500/20 border-violet-500/20',
      text: 'text-violet-400',
    },
    {
      label: 'Images',
      value: stats.images,
      icon: '🖼️',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20',
      text: 'text-blue-400',
    },
    {
      label: 'Videos',
      value: stats.videos,
      icon: '🎬',
      color: 'from-red-500/20 to-rose-500/20 border-red-500/20',
      text: 'text-red-400',
    },
    {
      label: 'Featured',
      value: stats.featured,
      icon: '⭐',
      color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/20',
      text: 'text-amber-400',
    },
    {
      label: 'Categories',
      value: stats.categories,
      icon: '🏷️',
      color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/20',
      text: 'text-emerald-400',
    },
    {
      label: 'Linked Events',
      value: stats.linkedEvents,
      icon: '📅',
      color: 'from-sky-500/20 to-indigo-500/20 border-sky-500/20',
      text: 'text-sky-400',
    },
  ];
}

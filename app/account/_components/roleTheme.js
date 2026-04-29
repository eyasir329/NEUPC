/**
 * @file Role theme tokens — single source of truth for role-based accents.
 * Consumed by sidebar, topbar, buttons, badges so all surfaces stay in sync.
 *
 * @module roleTheme
 */

export const ROLE_THEMES = {
  guest: {
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    dot: 'bg-sky-400',
    gradient: 'from-sky-500 to-blue-600',
    active: 'bg-sky-500/12 text-sky-400 shadow-sky-500/10',
    accent: 'bg-sky-400',
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-500/30',
    ring: 'focus-visible:ring-sky-500/50',
    hover: 'hover:bg-sky-500/8',
  },
  member: {
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    dot: 'bg-violet-400',
    gradient: 'from-violet-500 to-purple-600',
    active: 'bg-violet-500/12 text-violet-400 shadow-violet-500/10',
    accent: 'bg-violet-400',
    accentText: 'text-violet-400',
    accentBorder: 'border-violet-500/30',
    ring: 'focus-visible:ring-violet-500/50',
    hover: 'hover:bg-violet-500/8',
  },
  executive: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    dot: 'bg-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    active: 'bg-amber-500/12 text-amber-400 shadow-amber-500/10',
    accent: 'bg-amber-400',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/30',
    ring: 'focus-visible:ring-amber-500/50',
    hover: 'hover:bg-amber-500/8',
  },
  admin: {
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    dot: 'bg-rose-400',
    gradient: 'from-rose-500 to-red-600',
    active: 'bg-rose-500/12 text-rose-400 shadow-rose-500/10',
    accent: 'bg-rose-400',
    accentText: 'text-rose-400',
    accentBorder: 'border-rose-500/30',
    ring: 'focus-visible:ring-rose-500/50',
    hover: 'hover:bg-rose-500/8',
  },
  mentor: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-400',
    gradient: 'from-emerald-500 to-green-600',
    active: 'bg-emerald-500/12 text-emerald-400 shadow-emerald-500/10',
    accent: 'bg-emerald-400',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/30',
    ring: 'focus-visible:ring-emerald-500/50',
    hover: 'hover:bg-emerald-500/8',
  },
  advisor: {
    badge: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
    dot: 'bg-teal-400',
    gradient: 'from-teal-500 to-cyan-600',
    active: 'bg-teal-500/12 text-teal-400 shadow-teal-500/10',
    accent: 'bg-teal-400',
    accentText: 'text-teal-400',
    accentBorder: 'border-teal-500/30',
    ring: 'focus-visible:ring-teal-500/50',
    hover: 'hover:bg-teal-500/8',
  },
};

export const ROLE_LABELS = {
  guest: 'Guest',
  member: 'Member',
  executive: 'Executive',
  admin: 'Admin',
  mentor: 'Mentor',
  advisor: 'Advisor',
};

export function getRoleTheme(role) {
  return ROLE_THEMES[role] || ROLE_THEMES.guest;
}

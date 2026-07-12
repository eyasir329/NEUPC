/**
 * @file Accent color class maps for the shared inbox (notices) client.
 *
 * Each dashboard role renders the inbox in its own accent hue. Tailwind cannot
 * see runtime-interpolated class names, so every accent maps to fully-static
 * class strings here. The `medium` priority notice uses the page accent (unlike
 * the other priorities, which are fixed semantic colors), so its classes live
 * here too. Add a role accent by adding a key — never concatenate class names.
 *
 * @module inbox/accent
 */

/** @typedef {'sky' | 'violet' | 'blue' | 'amber'} InboxAccent */

export const INBOX_ACCENTS = {
  sky: {
    selection: 'selection:bg-sky-500/30',
    pinnedBadge: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
    searchFocus: 'focus:border-sky-500/40',
    rowActive: 'bg-sky-500/3 hover:bg-sky-500/6',
    pinDot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]',
    tag: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
    tabActive: 'border border-sky-500/30 bg-sky-500/20 text-sky-300',
    mediumColor: 'text-sky-400',
    mediumBg: 'bg-sky-500/10',
    mediumBadge: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  },
  violet: {
    selection: 'selection:bg-violet-500/30',
    pinnedBadge: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    searchFocus: 'focus:border-violet-500/40',
    rowActive: 'bg-violet-500/3 hover:bg-violet-500/6',
    pinDot: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]',
    tag: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    tabActive: 'border border-violet-500/30 bg-violet-500/20 text-violet-300',
    mediumColor: 'text-violet-400',
    mediumBg: 'bg-violet-500/10',
    mediumBadge: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  },
  blue: {
    selection: 'selection:bg-blue-500/30',
    pinnedBadge: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    searchFocus: 'focus:border-blue-500/40',
    rowActive: 'bg-blue-500/3 hover:bg-blue-500/6',
    pinDot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
    tag: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    tabActive: 'border border-blue-500/30 bg-blue-500/20 text-blue-300',
    mediumColor: 'text-blue-400',
    mediumBg: 'bg-blue-500/10',
    mediumBadge: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  },
  amber: {
    selection: 'selection:bg-amber-500/30',
    pinnedBadge: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    searchFocus: 'focus:border-amber-500/40',
    rowActive: 'bg-amber-500/3 hover:bg-amber-500/6',
    pinDot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    tag: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    tabActive: 'border border-amber-500/30 bg-amber-500/20 text-amber-300',
    mediumColor: 'text-amber-400',
    mediumBg: 'bg-amber-500/10',
    mediumBadge: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  },
};

/**
 * Resolve an inbox accent's class map, defaulting to sky for unknown values.
 * @param {InboxAccent} [accent]
 */
export const inboxAccent = (accent) => INBOX_ACCENTS[accent] ?? INBOX_ACCENTS.sky;

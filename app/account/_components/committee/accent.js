/**
 * @file Accent color class maps for the shared committee components.
 *
 * Tailwind cannot see runtime-interpolated class names (e.g. `text-${c}-400`),
 * so each accent maps to fully-static class strings the JIT compiler can find.
 * Add a new role accent by adding a key here — never build class names by
 * string concatenation in the components.
 *
 * @module committee/accent
 */

/** @typedef {'indigo' | 'violet'} CommitteeAccent */

export const COMMITTEE_ACCENTS = {
  indigo: {
    hoverText: 'group-hover:text-indigo-400',
    hoverText300: 'hover:text-indigo-300',
    iconButton:
      'hover:border-indigo-500/20 hover:bg-indigo-500/10 hover:text-indigo-400',
    inputFocus: 'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20',
    selectFocus: 'focus:border-indigo-500/50',
    submitButton:
      'bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]',
    solidButton: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700',
    selectedButton: 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20',
    progressBar: 'bg-indigo-500/70',
    monoText: 'text-indigo-400',
    canvasStroke: 'rgba(99, 102, 241, 0.6)',
  },
  violet: {
    hoverText: 'group-hover:text-violet-400',
    hoverText300: 'hover:text-violet-300',
    iconButton:
      'hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-400',
    inputFocus: 'focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20',
    selectFocus: 'focus:border-violet-500/50',
    submitButton:
      'bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.35)]',
    solidButton: 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700',
    selectedButton: 'bg-violet-600 text-white shadow-md shadow-violet-900/20',
    progressBar: 'bg-violet-500/70',
    monoText: 'text-violet-400',
    canvasStroke: 'rgba(139, 92, 246, 0.6)',
  },
};

/**
 * Resolve an accent's class map, defaulting to indigo for unknown values.
 * @param {CommitteeAccent} [accent]
 */
export const committeeAccent = (accent) =>
  COMMITTEE_ACCENTS[accent] ?? COMMITTEE_ACCENTS.indigo;

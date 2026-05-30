/**
 * @file "Scroll" cue shown at the bottom-centre of public-page heroes (lg+ only).
 * Shared across page heroes (previously duplicated inline).
 *
 * @module ScrollCue
 */

export default function ScrollCue() {
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 lg:flex">
      <span className="font-mono text-[9px] tracking-[0.4em] text-zinc-700 uppercase">
        Scroll
      </span>
      <div className="h-7 w-px bg-linear-to-b from-zinc-600 to-transparent" />
    </div>
  );
}

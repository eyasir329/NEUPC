/**
 * @file Ambient hero background — grid overlay, two gradient blobs and a bottom
 * fade. Shared by every public-page hero (previously duplicated inline in each).
 *
 * @module HeroAmbient
 */

export default function HeroAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="grid-overlay absolute inset-0 opacity-25" />
      <div className="bg-neon-violet/12 absolute -top-24 left-1/4 h-100 w-100 -translate-x-1/2 rounded-full blur-[120px] sm:h-125 sm:w-125" />
      <div className="bg-neon-lime/8 absolute top-1/3 right-0 h-75 w-75 rounded-full blur-[120px] sm:h-100 sm:w-100" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-[#05060b] to-transparent" />
    </div>
  );
}

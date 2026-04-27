'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../_lib/utils';

const USER_PAUSE_MS = 8000;
const SCROLL_IDLE_MS = 180;

export default function FeaturedCarousel({
  items,
  renderItem,
  getKey,
  ariaLabel = 'Featured',
  autoPlay = true,
  interval = 6000,
}) {
  const trackRef = useRef(null);
  const rootRef = useRef(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(true);
  const [reduced, setReduced] = useState(false);
  const userPauseUntil = useRef(0);
  const isScrolling = useRef(false);
  const scrollIdleTimer = useRef(null);
  const count = items.length;

  // prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(m.matches);
    update();
    m.addEventListener('change', update);
    return () => m.removeEventListener('change', update);
  }, []);

  const scrollToIndex = useCallback((idx, opts = {}) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[idx];
    if (!child) return;
    track.scrollTo({
      left: child.offsetLeft,
      behavior: opts.instant || reduced ? 'auto' : 'smooth',
    });
  }, [reduced]);

  const bumpUserPause = useCallback(() => {
    userPauseUntil.current = Date.now() + USER_PAUSE_MS;
  }, []);

  const next = useCallback(() => {
    bumpUserPause();
    scrollToIndex((active + 1) % count);
  }, [active, count, scrollToIndex, bumpUserPause]);

  const prev = useCallback(() => {
    bumpUserPause();
    scrollToIndex((active - 1 + count) % count);
  }, [active, count, scrollToIndex, bumpUserPause]);

  const goTo = useCallback((idx) => {
    bumpUserPause();
    scrollToIndex(idx);
  }, [scrollToIndex, bumpUserPause]);

  // Track which slide is centered + scroll-idle flag
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      isScrolling.current = true;
      if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current);
      scrollIdleTimer.current = setTimeout(() => { isScrolling.current = false; }, SCROLL_IDLE_MS);

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < track.children.length; i++) {
          const c = track.children[i];
          const ccenter = c.offsetLeft + c.clientWidth / 2;
          const d = Math.abs(ccenter - center);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        setActive(bestIdx);
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current);
    };
  }, []);

  // Pause autoplay when off-screen
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Pause when tab hidden (covered by inView indirectly, but explicit is fine)
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) userPauseUntil.current = Infinity;
      else userPauseUntil.current = 0;
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Autoplay
  useEffect(() => {
    if (!autoPlay || count < 2 || reduced || hovered || !inView) return;
    const id = setInterval(() => {
      if (Date.now() < userPauseUntil.current) return;
      if (isScrolling.current) return;
      const track = trackRef.current;
      if (!track) return;
      const nextIdx = (active + 1) % count;
      // If we're wrapping back to 0 from the last slide, jump instantly
      // to avoid a long jarring reverse-smooth-scroll across the whole track.
      const instant = active === count - 1 && nextIdx === 0;
      scrollToIndex(nextIdx, { instant });
    }, interval);
    return () => clearInterval(id);
  }, [autoPlay, count, reduced, hovered, inView, active, interval, scrollToIndex]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  if (count === 0) return null;

  return (
    <div
      ref={rootRef}
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onPointerDown={(e) => { if (e.pointerType !== 'mouse') bumpUserPause(); }}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div
            key={getKey ? getKey(item, i) : i}
            className="w-full shrink-0 snap-center px-px"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== active}
          >
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition-all',
              'hover:border-neon-lime/40 hover:text-neon-lime hover:scale-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090f]',
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition-all',
              'hover:border-neon-lime/40 hover:text-neon-lime hover:scale-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090f]',
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="mt-5 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-lime focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060b]',
                  i === active ? 'w-6 bg-neon-lime' : 'w-1.5 bg-white/20 hover:bg-white/40',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

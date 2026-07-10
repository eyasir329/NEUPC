/**
 * @file App shell component
 * @module AppShell
 */

'use client';

import { useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';

// Kept as a no-op export so the <ReadySignal /> sentinels rendered inside the
// header/footer Suspense boundaries stay valid. The reveal no longer depends on
// them — see AppShell below — because a missed or out-of-order signal used to
// leave the whole page stuck invisible.
export function ReadySignal() {
  return null;
}

// Wraps the whole page — shows a brief loading veil, then fades the content in
// once this shell has mounted on the client (one animation frame after paint).
// The reveal is self-contained: it never waits on other components' signals, so
// it cannot deadlock and hide already-rendered content.
export default function AppShell({ children }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {/* Loading overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-[#05060B] transition-opacity duration-500"
        style={{
          opacity: shown ? 0 : 1,
          pointerEvents: shown ? 'none' : 'all',
        }}
      >
        <div className="relative h-14 w-14">
          <div className="border-t-neon-lime absolute inset-0 animate-spin rounded-full border-2 border-transparent" />
          <div className="border-b-neon-lime/40 absolute inset-2 animate-spin rounded-full border-2 border-transparent [animation-direction:reverse] [animation-duration:1.4s]" />
          <div className="bg-neon-lime/60 absolute inset-0 m-auto h-2 w-2 animate-pulse rounded-full" />
        </div>
        <span className="text-neon-lime/60 animate-pulse font-mono text-[10px] font-bold tracking-[0.4em] uppercase">
          Loading...
        </span>
      </div>

      {/* Page content — invisible until ready, then fades in */}
      <div
        className="contents transition-opacity duration-500"
        style={{ opacity: shown ? 1 : 0 }}
      >
        {children}
      </div>
    </MotionConfig>
  );
}

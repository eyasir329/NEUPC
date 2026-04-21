'use client';

import { useEffect, useState } from 'react';

export default function HydrationLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide after first paint — gives browser one frame to render content
    const id = requestAnimationFrame(() => setVisible(false));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-[#05060b]"
      aria-hidden="true"
    >
      {/* Spinner */}
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-neon-lime" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-neon-lime/40 [animation-direction:reverse] [animation-duration:1.4s]" />
        <div className="absolute inset-0 m-auto h-2 w-2 animate-pulse rounded-full bg-neon-lime/60" />
      </div>
      <span className="animate-pulse font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-neon-lime/60">
        Loading...
      </span>
    </div>
  );
}

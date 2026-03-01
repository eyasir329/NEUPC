/**
 * @file Top Progress Bar
 * Enhanced with smooth cubic-bezier animation, glow pulse, and gradient shimmer.
 *
 * @module TopProgressBar
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function TopProgressBar() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Reset & start
    setIsComplete(false);
    setIsLoading(true);
    setProgress(15);

    // Smooth incremental progress with slowing curve
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Slow down as we approach 90%
        const increment = Math.max(1, (90 - prev) * 0.1);
        return Math.min(prev + increment, 90);
      });
    }, 150);

    // Complete after page has likely loaded
    const timeout = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setIsComplete(true);

      // Fade out after completion animation
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        setIsComplete(false);
      }, 400);
    }, 600);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(timeout);
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-9999 h-0.75">
      {/* Track background */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Progress bar */}
      <div
        className="from-primary-500 via-secondary-400 to-primary-500 relative h-full origin-left bg-linear-to-r"
        style={{
          width: `${progress}%`,
          transition: isComplete
            ? 'width 200ms ease-out, opacity 300ms ease-out 100ms'
            : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isComplete ? 0 : 1,
        }}
      >
        {/* Shimmer highlight */}
        <div className="absolute inset-0 animate-[shimmer_1.5s_ease-in-out_infinite] bg-linear-to-r from-transparent via-white/30 to-transparent" />

        {/* Leading glow dot */}
        <div className="absolute top-1/2 right-0 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_2px_rgba(99,102,241,0.7)]" />
      </div>
    </div>
  );
}

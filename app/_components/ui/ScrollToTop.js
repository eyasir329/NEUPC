/**
 * @file Scroll To Top
 * @module ScrollToTop
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * ScrollToTop — Floating button that appears after scrolling down.
 * Drop into any client page — fully self-contained.
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="from-primary-500 to-secondary-500 fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

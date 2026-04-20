'use client';

import { useState, useEffect } from 'react';

export default function ScrollHeader({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b backdrop-blur-2xl transition-all duration-300 ${
        scrolled
          ? 'border-slate-200/80 bg-white/80 py-3 dark:border-white/5 dark:bg-[#05060b]/80'
          : 'border-transparent bg-transparent py-5'
      }`}
    >
      {children}
    </header>
  );
}

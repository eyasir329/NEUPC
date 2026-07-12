/**
 * @file Lesson content table-of-contents rail.
 * @module TableOfContents
 */

'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

function TableOfContents({ contentRef }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const container = contentRef?.current;
    if (!container) return;
    const timer = setTimeout(() => {
      const els = container.querySelectorAll('h2, h3, h4');
      const items = [];
      els.forEach((el, i) => {
        if (!el.id)
          el.id = `h-${i}-${el.textContent
            .slice(0, 20)
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase()}`;
        items.push({
          id: el.id,
          text: el.textContent,
          level: parseInt(el.tagName.charAt(1)),
        });
      });
      setHeadings(items);
    }, 400);
    return () => clearTimeout(timer);
  }, [contentRef]);

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const v = entries.filter((e) => e.isIntersecting);
        if (v.length) setActiveId(v[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <div className="sticky top-6">
      <div className="mb-3 flex items-center gap-2 px-1">
        <List className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">
          On this page
        </span>
      </div>
      <nav>
        <ul className="space-y-0.5 border-l border-white/10">
          {headings.map((h) => {
            const isActive = activeId === h.id;
            const indent =
              h.level === 2 ? 'pl-3' : h.level === 3 ? 'pl-5' : 'pl-7';
            return (
              <li key={h.id}>
                <button
                  onClick={() => {
                    document
                      .getElementById(h.id)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveId(h.id);
                  }}
                  className={`w-full py-1.5 text-left ${indent} -ml-px truncate border-l-2 text-[11px] leading-snug transition-all ${
                    isActive
                      ? 'border-violet-500 font-semibold text-violet-300'
                      : 'border-transparent text-gray-600 hover:border-gray-600 hover:text-gray-400'
                  }`}
                >
                  {h.text}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

// ─── Overview tabs: Tasks, Sessions, Help Desk ────────────────────────────────


export { TableOfContents };

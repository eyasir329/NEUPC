/**
 * @file Custom sort dropdown (pattern from events' CategorySelect) used in the
 * filter panels of public listing pages (blogs / roadmaps).
 *
 * @module SortSelect
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/app/_lib/utils/utils';

/**
 * SortSelect — listbox-style dropdown styled to match the public filter panels.
 * Highlights lime when a non-default option is active.
 *
 * @param {{
 *   options: Array<{ key: string, label: string }>,
 *   value: string,
 *   onChange: (key: string) => void,
 *   ariaLabel?: string,
 * }} props
 */
export default function SortSelect({
  options,
  value,
  onChange,
  ariaLabel = 'Sort',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const current = options.find((o) => o.key === value)?.label ?? '';
  const isFiltered = value !== options[0]?.key;

  return (
    <div ref={ref} className="relative shrink-0 sm:min-w-44">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all',
          isFiltered
            ? 'border-neon-lime/30 bg-neon-lime/8 text-neon-lime'
            : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white'
        )}
      >
        <span className="truncate font-mono text-[10px] tracking-wider uppercase">
          {current}
        </span>
        <svg
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0e1018] shadow-xl shadow-black/50 sm:right-0 sm:left-auto"
        >
          {options.map((o) => {
            const active = value === o.key;
            return (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={cn(
                  'flex min-h-[38px] w-full items-center justify-between gap-8 px-4 py-2.5 text-left font-mono text-[10px] tracking-wider uppercase transition-colors',
                  active
                    ? 'bg-neon-lime/10 text-neon-lime'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}
              >
                {o.label}
                {active && (
                  <svg
                    className="h-3 w-3 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

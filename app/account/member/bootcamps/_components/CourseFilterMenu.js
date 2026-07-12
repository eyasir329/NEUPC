/**
 * @file Course filter dropdown shared by the learning calendar and watch-time chart.
 * @module CourseFilterMenu
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Layers } from 'lucide-react';
import { cn } from './bootcamps-shared';

function CourseFilterMenu({ courses, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const selected = courses.find((c) => c.id === value);
  const label = selected ? selected.title : 'All courses';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'inline-flex max-w-[160px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
          open
            ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
            : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/10 hover:text-white'
        )}
      >
        <Layers className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-1.5 max-h-64 max-w-[260px] min-w-[200px] overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl"
        >
          <button
            role="menuitemradio"
            aria-checked={value === 'all'}
            onClick={() => {
              onChange('all');
              setOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs font-medium transition-colors',
              value === 'all'
                ? 'text-violet-300'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <span className="truncate">All courses</span>
            {value === 'all' && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
          {courses.map((c) => {
            const active = value === c.id;
            return (
              <button
                key={c.id}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs font-medium transition-colors',
                  active
                    ? 'text-violet-300'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <span className="truncate">{c.title}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


export { CourseFilterMenu };

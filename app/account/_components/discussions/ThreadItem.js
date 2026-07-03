/**
 * @file Thread list-row card for the Help Desk discussion list.
 * @module ThreadItem
 */

'use client';

import { MessageSquare, ChevronRight, Eye } from 'lucide-react';

export default function ThreadItem({
  avatarText,
  avatarColor,
  tags,
  title,
  author,
  time,
  replies = 0,
  views = 0,
  onClick,
}) {
  const isSolved = tags.some((t) => t.text === 'Solved');

  const getTagColor = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-600/30';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group border bg-white/[0.03] hover:bg-white/[0.04] ${isSolved ? 'border-emerald-900/30' : 'border-white/[0.08] hover:border-white/[0.14]'} relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:flex-row`}
    >
      {isSolved && (
        <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500/50"></div>
      )}

      <div
        className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full font-bold text-white shadow-inner ${avatarColor}`}
      >
        <span className="px-1 text-center text-xs leading-none tracking-wide">
          {avatarText.length > 3 ? avatarText.substring(0, 2) : avatarText}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {tags.map((tag, idx) => {
            const Icon = tag.icon;
            return (
              <span
                key={idx}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors ${getTagColor(tag.color)}`}
              >
                {Icon && <Icon size={10} className="opacity-80" />}
                {tag.text}
              </span>
            );
          })}
        </div>
        <h3 className="mb-1 line-clamp-2 text-base leading-snug font-semibold text-gray-200 transition-colors group-hover:text-violet-400">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="text-gray-400 transition-colors hover:text-gray-300">
            {author}
          </span>
          <span className="h-1 w-1 rounded-full bg-gray-700"></span>
          <span>{time}</span>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center justify-between gap-4 border-t border-white/[0.06] pt-3 text-xs font-medium text-gray-500 sm:ml-4 sm:w-auto sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
        <div className="flex items-center gap-5 sm:flex-col sm:items-end sm:gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400 tabular-nums">
              {replies}
            </span>
            <MessageSquare size={14} className="opacity-60" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400 tabular-nums">{views}</span>
            <Eye size={14} className="opacity-60" />
          </div>
        </div>
        <div className="flex items-center font-bold text-violet-400 opacity-0 transition-opacity group-hover:opacity-100 sm:hidden">
          Reply &rarr;
        </div>
      </div>

      {/* Desktop hover action */}
      <div className="absolute top-1/2 right-6 hidden translate-x-4 -translate-y-1/2 items-center justify-center opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:flex">
        <button className="rounded-full bg-violet-600 p-2 text-white shadow-lg transition-colors hover:bg-violet-500">
          <ChevronRight size={16} />
        </button>
      </div>
      {/* Fade right edge when not hovering to hide the hidden button area slightly */}
      <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-16 rounded-r-2xl bg-linear-to-l from-gray-950/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:block"></div>
    </div>
  );
}

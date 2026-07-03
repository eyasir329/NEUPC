/**
 * @file Single row in the Help Desk "Top contributors" sidebar list.
 * @module ContributorRow
 */

'use client';

export default function ContributorRow({ rank, name, score, avatar, color }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-4 text-center text-xs font-bold ${rank <= 3 ? 'text-amber-400' : 'text-gray-500'}`}
      >
        {rank}
      </span>
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${color}`}
      >
        {avatar}
      </div>
      <span className="flex-1 cursor-pointer truncate text-gray-300 transition-colors hover:text-violet-400">
        {name}
      </span>
      <span className="font-medium text-gray-500">{score}</span>
    </div>
  );
}

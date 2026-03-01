/**
 * @file Achievement card — displays a single achievement badge with
 *   icon, name, criteria, earned-count, and edit / delete actions.
 * @module AdminAchievementCard
 */

'use client';

import { useState, useTransition } from 'react';
import {
  getCategoryConfig,
  TYPE_CONFIG,
  formatDate,
} from './achievementConfig';
import { deleteAchievementAction } from '@/app/_lib/achievement-actions';

export default function AchievementCard({
  achievement,
  onEdit,
  onManageMembers,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  const catConf = getCategoryConfig(achievement.category);
  const typeConf = achievement.is_team
    ? TYPE_CONFIG.team
    : TYPE_CONFIG.individual;
  const memberCount = achievement.member_achievements?.length ?? 0;
  const creatorName = achievement.users?.full_name ?? 'Admin';

  async function handleDelete(e) {
    e.stopPropagation();
    setDeleting(true);
    const fd = new FormData();
    fd.set('id', achievement.id);
    startTransition(async () => {
      await deleteAchievementAction(fd);
      setDeleting(false);
    });
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/60 transition-all duration-200 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-900/10">
      {/* Top accent bar */}
      <div className="h-1 bg-linear-to-r from-amber-500/60 via-yellow-500/40 to-transparent" />

      <div className="space-y-3 p-4">
        {/* ── Header row ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-white">
              {achievement.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {achievement.contest_name}
            </p>
          </div>

          {/* Year badge */}
          <span className="shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-400">
            {achievement.year}
          </span>
        </div>

        {/* ── Result pill ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
            🏅 {achievement.result}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${typeConf.badge}`}
          >
            {typeConf.emoji} {typeConf.label}
          </span>
        </div>

        {/* ── Category ────────────────────────────────────────────────── */}
        {achievement.category && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${catConf.color}`}
          >
            {catConf.emoji} {achievement.category}
          </span>
        )}

        {/* ── Team name (if team) ─────────────────────────────────────── */}
        {achievement.is_team && achievement.team_name && (
          <p className="text-xs text-slate-400">
            <span className="text-slate-500">Team:</span>{' '}
            {achievement.team_name}
          </p>
        )}

        {/* ── Description ─────────────────────────────────────────────── */}
        {achievement.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
            {achievement.description}
          </p>
        )}

        {/* ── Participants (plain text list) ──────────────────────────── */}
        {achievement.participants?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {achievement.participants.slice(0, 4).map((p) => (
              <span
                key={p}
                className="rounded-full border border-slate-600/30 bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300"
              >
                {p}
              </span>
            ))}
            {achievement.participants.length > 4 && (
              <span className="text-xs text-slate-500">
                +{achievement.participants.length - 4}
              </span>
            )}
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-slate-700/40 pt-2">
          <div className="space-y-0.5">
            <p className="max-w-32 truncate text-xs text-slate-500">
              By {creatorName}
            </p>
            {achievement.achievement_date && (
              <p className="text-xs text-slate-600">
                {formatDate(achievement.achievement_date)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Members button */}
            <button
              onClick={() => onManageMembers(achievement)}
              title="Manage linked members"
              className="flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-400"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
              </svg>
              {memberCount > 0 && <span>{memberCount}</span>}
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(achievement)}
              title="Edit"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
            </button>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded bg-red-600 px-2 py-1 text-xs text-white transition-colors hover:bg-red-700"
                >
                  {deleting ? '…' : 'Yes'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-600"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                title="Delete"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Contest URL link */}
        {achievement.contest_url && (
          <a
            href={achievement.contest_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-sky-400"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path
                fillRule="evenodd"
                d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                clipRule="evenodd"
              />
            </svg>
            View contest page
          </a>
        )}
      </div>
    </div>
  );
}

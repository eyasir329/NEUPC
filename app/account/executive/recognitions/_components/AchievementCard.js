/**
 * @file Achievement card — displays a single achievement badge with
 *   icon, name, criteria, earned-count, and edit / delete actions.
 * @module ExecutiveAchievementCard
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  getCategoryConfig,
  TYPE_CONFIG,
  formatDate,
} from './achievementConfig';
import {
  deleteAchievementAction,
  toggleAchievementFeaturedAction,
} from '@/app/_lib/achievement-actions';
import {
  Star,
  Users,
  Image as ImageIcon,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { GlassCard, Pill } from '../../_components/_ui';

export function getPlatformBadge(platform) {
  const p = platform?.toLowerCase() ?? '';
  if (p.includes('codeforces')) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
        <span className="flex items-end gap-0.5 w-3 h-3 mb-[1px]">
          <span className="w-0.5 h-1.5 bg-blue-400 rounded-2xs" />
          <span className="w-0.5 h-3 bg-red-400 rounded-2xs" />
          <span className="w-0.5 h-2 bg-yellow-400 rounded-2xs" />
        </span>
        Codeforces
      </span>
    );
  }
  if (p.includes('leetcode')) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
        <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.483 0a1.374 1.374 0 0 0-.961.414l-11.75 11.75a1.37 1.37 0 0 0 0 1.94l1.94 1.94a1.37 1.37 0 0 0 1.94 0l11.75-11.75a1.37 1.37 0 0 0 0-1.94L14.444.414A1.374 1.374 0 0 0 13.483 0zm4.27 4.27a1.37 1.37 0 0 0-.97.414l-11.75 11.75a1.37 1.37 0 0 0 0 1.94l1.94 1.94a1.37 1.37 0 0 0 1.94 0l11.75-11.75a1.37 1.37 0 0 0 0-1.94l-1.94-1.94a1.37 1.37 0 0 0-.97-.414z" />
        </svg>
        LeetCode
      </span>
    );
  }
  if (p.includes('vjudge')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
        🏁 VJudge
      </span>
    );
  }
  if (p.includes('atcoder')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400">
        🔴 AtCoder
      </span>
    );
  }
  if (p.includes('codechef')) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-yellow-600/20 bg-yellow-600/10 px-2.5 py-0.5 text-[10px] font-semibold text-yellow-500">
        👨‍🍳 CodeChef
      </span>
    );
  }
  if (p.includes('hackerrank')) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
        <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.5 17h-7v-2h7v2zm0-4h-7v-2h7v2zm0-4h-7V7h7v2z"/>
        </svg>
        HackerRank
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-sky-400">
      🖥️ {platform}
    </span>
  );
}

export default function AchievementCard({
  achievement,
  onEdit,
  onManageMembers,
  onManageGallery,
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isFeatured, setIsFeatured] = useState(
    achievement?.is_featured ?? false
  );
  const [featuredPending, setFeaturedPending] = useState(false);
  const [, startTransition] = useTransition();

  const cats = achievement.category
    ? achievement.category
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const typeConf = achievement.is_team
    ? TYPE_CONFIG.team
    : TYPE_CONFIG.individual;
  const memberCount = achievement.member_achievements?.length ?? 0;
  const creatorName = achievement.users?.full_name ?? 'Executive';

  async function handleToggleFeatured(e) {
    e.stopPropagation();
    setFeaturedPending(true);
    const fd = new FormData();
    fd.set('id', achievement.id);
    fd.set('featured', String(!isFeatured));
    const res = await toggleAchievementFeaturedAction(fd);
    setFeaturedPending(false);
    if (!res?.error) setIsFeatured((f) => !f);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    setDeleting(true);
    const fd = new FormData();
    fd.set('id', achievement.id);
    startTransition(async () => {
      const res = await deleteAchievementAction(fd);
      if (!res?.error) {
        router.refresh();
      }
      setDeleting(false);
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="h-full"
    >
      <GlassCard
        padding="p-0"
        className={`group relative overflow-hidden flex flex-col h-full bg-slate-950/40 border transition-all duration-300 backdrop-blur-md ${
          isFeatured
            ? 'border-amber-500/40 shadow-lg shadow-amber-950/15 hover:border-amber-500/80 hover:shadow-amber-500/10'
            : 'border-white/[0.06] hover:border-amber-500/30 hover:shadow-slate-950/20'
        }`}
      >
        {/* Glow backdrop effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-purple-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
        
        {/* Card border shine light */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Top accent bar */}
        <div
          className={`h-1 bg-gradient-to-r transition-all duration-300 ${
            isFeatured
              ? 'from-amber-500 via-yellow-400 to-amber-500'
              : 'from-amber-600/30 via-amber-500/10 to-transparent'
          }`}
        />

        {/* Featured star button */}
        <button
          onClick={handleToggleFeatured}
          disabled={featuredPending}
          title={isFeatured ? 'Remove from featured' : 'Mark as featured'}
          className={`absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg border transition-all backdrop-blur-sm ${
            isFeatured
              ? 'border-amber-500/30 bg-amber-500/20 text-amber-400 shadow-md shadow-amber-900/20'
              : 'border-white/10 bg-slate-900/60 text-gray-500 opacity-0 group-hover:opacity-100 hover:border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-400'
          }`}
        >
          {featuredPending ? (
            <svg
              className="h-3.5 w-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          ) : (
            <Star className={`h-3.5 w-3.5 ${isFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
          )}
        </button>

        <div className="flex flex-col flex-1 p-5 space-y-4">
          {/* ── Header row ──────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm leading-snug font-bold text-white group-hover:text-amber-400 transition-colors">
                {achievement.title}
              </h3>
              <p className="mt-0.5 truncate text-xs text-gray-400 font-medium">
                {achievement.contest_name}
              </p>
            </div>

            {/* Year badge */}
            <span className="mr-6 shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              {achievement.year}
            </span>
          </div>

          {/* ── Result pills ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="emerald" className="text-[10px] font-bold px-2.5 py-0.5 border border-emerald-500/10 bg-emerald-500/5">
              🏆 {achievement.result}
            </Pill>
            <Pill
              tone={achievement.is_team ? 'violet' : 'blue'}
              className="text-[10px] font-semibold px-2.5 py-0.5 border border-white/5"
            >
              {typeConf.emoji} {typeConf.label}
            </Pill>
          </div>

          {/* ── Categories ─────────────────────────────────────────────── */}
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cats.map((cat) => {
                const conf = getCategoryConfig(cat);
                return (
                  <span
                    key={cat}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-md transition-all ${conf.color}`}
                  >
                    {conf.emoji} {cat}
                  </span>
                );
              })}
            </div>
          )}

          {/* ── Team name (if team) ─────────────────────────────────────── */}
          {achievement.is_team && achievement.team_name && (
            <div className="text-xs rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-gray-400 flex items-center gap-1.5">
              <span className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Team:</span>{' '}
              <span className="font-semibold text-gray-300">{achievement.team_name}</span>
            </div>
          )}

          {/* ── Description ─────────────────────────────────────────────── */}
          {achievement.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-gray-400">
              {achievement.description}
            </p>
          )}

          {/* ── Participants (plain text list) ──────────────────────────── */}
          {achievement.participants?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {achievement.participants.slice(0, 4).map((p) => (
                <Pill
                  key={p}
                  tone="gray"
                  className="text-[10px] px-2 py-0.5 text-gray-300 border border-white/5 bg-white/5"
                >
                  {p}
                </Pill>
              ))}
              {achievement.participants.length > 4 && (
                <span className="text-[10px] text-gray-500 font-semibold ml-1">
                  +{achievement.participants.length - 4}
                </span>
              )}
            </div>
          )}

          {/* ── Platform + Links ────────────────────────────────────────── */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Platform badge */}
            {achievement.platform && (
              <div className="flex items-center gap-2">
                {getPlatformBadge(achievement.platform)}
                {achievement.profile_url && (
                  <a
                    href={achievement.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-semibold text-gray-400 hover:text-sky-400 underline underline-offset-2 transition-all"
                  >
                    Profile ↗
                  </a>
                )}
              </div>
            )}

            {/* Contest URL link */}
            {achievement.contest_url && (
              <a
                href={achievement.contest_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-amber-400 transition-all w-fit"
              >
                <ExternalLink className="h-3 w-3" />
                View contest page
              </a>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-t border-white/[0.05] pt-3 mt-auto">
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate text-[10px] font-medium text-gray-400">
                By {creatorName}
              </p>
              {achievement.achievement_date && (
                <p className="text-[10px] text-gray-500 font-semibold" suppressHydrationWarning>
                  {formatDate(achievement.achievement_date)}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {/* Gallery button */}
              <button
                onClick={() => onManageGallery(achievement)}
                title="Manage gallery photos"
                className="relative flex items-center gap-1 rounded-lg border border-transparent p-1.5 text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {achievement.gallery_images?.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-sky-400 shadow-sm" />
                )}
              </button>

              {/* Members button */}
              <button
                onClick={() => onManageMembers(achievement)}
                title="Manage linked members"
                className="flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <Users className="h-3.5 w-3.5" />
                {memberCount > 0 && (
                  <span className="ml-1 text-[10px] font-bold text-gray-400 group-hover:text-white">
                    {memberCount}
                  </span>
                )}
              </button>

              {/* Edit */}
              <button
                onClick={() => onEdit(achievement)}
                title="Edit"
                className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>

              {/* Delete */}
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded bg-red-500/20 border border-red-500/30 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/30 transition-all"
                  >
                    {deleting ? '…' : 'Yes'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(false);
                    }}
                    className="rounded bg-white/5 border border-white/10 px-2 py-1 text-[10px] font-semibold text-gray-300 hover:bg-white/10 transition-all"
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
                  className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

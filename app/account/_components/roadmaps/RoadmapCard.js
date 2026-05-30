/**
 * @file Roadmap card component
 * @module RoadmapCard
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Star,
  Edit3,
  Trash2,
  Eye,
  ChevronDown,
  Loader2,
  ExternalLink,
  Tag,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import {
  getStatusConfig,
  getDifficultyConfig,
  getCategoryConfig,
  formatRoadmapDate,
} from './roadmapConfig';
import {
  updateRoadmapStatusAction,
  toggleRoadmapFeaturedAction,
  deleteRoadmapAction,
} from '@/app/_lib/actions/roadmap-actions';
import toast from 'react-hot-toast';

const ORDERED_STATUSES = ['draft', 'published', 'archived'];

export default function RoadmapCard({ roadmap, onEdit }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [featuredPending, setFeaturedPending] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const sc = getStatusConfig(roadmap.status);
  const dc = getDifficultyConfig(roadmap.difficulty);
  const cc = getCategoryConfig(roadmap.category);

  async function handleStatusChange(newStatus) {
    setStatusOpen(false);
    if (newStatus === roadmap.status) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', roadmap.id);
      fd.set('status', newStatus);
      const result = await updateRoadmapStatusAction(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Status updated to ${newStatus}`);
        router.refresh();
      }
    });
  }

  async function handleToggleFeatured(e) {
    e.preventDefault();
    e.stopPropagation();
    setFeaturedPending(true);
    const fd = new FormData();
    fd.set('id', roadmap.id);
    fd.set('featured', String(!roadmap.is_featured));
    const result = await toggleRoadmapFeaturedAction(fd);
    setFeaturedPending(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(
        roadmap.is_featured ? 'Removed from featured' : 'Marked as featured'
      );
      router.refresh();
    }
  }

  async function handleDelete() {
    setDeletePending(true);
    const fd = new FormData();
    fd.set('id', roadmap.id);
    const result = await deleteRoadmapAction(fd);
    setDeletePending(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Roadmap deleted successfully');
      router.refresh();
    }
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0c0e16] shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-[0_8px_40px_rgba(59,130,246,0.15)]">
      {/* Thumbnail / Cover */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#090b12]">
        {roadmap.thumbnail ? (
          <img
            src={roadmap.thumbnail}
            alt={roadmap.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-900/30 via-[#0a0c14] to-indigo-900/20">
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <Compass className="relative h-12 w-12 text-blue-500/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-[#0c0e16] via-transparent to-transparent opacity-80" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-lg backdrop-blur-md ${sc.badge}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${roadmap.status === 'published' ? 'animate-pulse' : ''}`}
            />
            {sc.label}
          </span>
        </div>

        {/* Featured badge */}
        {roadmap.is_featured && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300 shadow-lg ring-1 ring-amber-500/30 backdrop-blur-md">
              <Star className="h-2.5 w-2.5 fill-current" />
              Featured
            </span>
          </div>
        )}

        {/* Duration tag */}
        {roadmap.estimated_duration && (
          <div className="absolute right-3 bottom-3">
            <span className="flex items-center gap-1 rounded-lg bg-black/70 px-2 py-0.5 text-xs font-bold text-white ring-1 ring-white/10 backdrop-blur-sm">
              <Clock className="h-3 w-3 text-amber-400" />
              {roadmap.estimated_duration}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-bold text-white/95 transition-colors group-hover:text-white">
          {roadmap.title}
        </h3>

        {/* Category + Level */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${cc.badge}`}
          >
            <span>{cc.icon}</span>
            {roadmap.category}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${dc.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dc.dot}`} />
            {dc.label}
          </span>
        </div>

        {roadmap.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {roadmap.description}
          </p>
        )}

        {/* Stats pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-md bg-blue-500/8 px-2 py-1 text-[11px] text-blue-300/70"
            title="Views"
          >
            <Eye className="h-3 w-3" />
            <span className="font-medium tabular-nums">
              {(roadmap.views ?? 0).toLocaleString()}
            </span>
          </div>
          {roadmap.prerequisites?.length > 0 ||
          (roadmap.prerequisites && roadmap.prerequisites.length > 0) ? (
            <div
              className="flex items-center gap-1 rounded-md bg-emerald-500/8 px-2 py-1 text-[11px] text-emerald-300/70"
              title="Prerequisites"
            >
              <Tag className="h-3 w-3" />
              <span className="font-medium">
                {Array.isArray(roadmap.prerequisites)
                  ? roadmap.prerequisites.length
                  : roadmap.prerequisites.split(',').filter(Boolean)
                      .length}{' '}
                prereq
              </span>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-white/6 pt-3">
            <span className="font-mono text-[10px] text-gray-700">
              {formatRoadmapDate(roadmap.created_at)}
            </span>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Status Selector */}
              <div className="relative">
                <button
                  onClick={() => setStatusOpen((v) => !v)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2 py-1 text-[10px] font-medium text-gray-400 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                  )}
                  {sc.label}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${statusOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {statusOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setStatusOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 z-30 mb-1.5 min-w-32.5 overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-xl shadow-black/50">
                      {ORDERED_STATUSES.map((s) => {
                        const cfg = getStatusConfig(s);
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5 ${
                              s === roadmap.status
                                ? 'font-semibold text-white'
                                : 'text-gray-400'
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${cfg.dot}`}
                            />
                            {cfg.label}
                            {s === roadmap.status && (
                              <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Toggle Featured */}
              <button
                onClick={handleToggleFeatured}
                disabled={featuredPending}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                  roadmap.is_featured
                    ? 'text-amber-400 hover:bg-amber-500/15'
                    : 'text-gray-600 hover:bg-amber-500/15 hover:text-amber-400'
                }`}
                title={roadmap.is_featured ? 'Unfeature' : 'Feature'}
              >
                {featuredPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Star
                    className={`h-3.5 w-3.5 ${roadmap.is_featured ? 'fill-current' : ''}`}
                  />
                )}
              </button>

              {/* Public Preview */}
              {roadmap.status === 'published' && (
                <Link
                  href={`/roadmaps/${roadmap.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition-all hover:bg-emerald-500/15 hover:text-emerald-400"
                  title="Preview"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}

              {/* Delete */}
              {deleteConfirm ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={deletePending}
                    className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-[10px] font-semibold text-red-300 transition-all hover:bg-red-500/30"
                  >
                    {deletePending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Confirm'
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="rounded-lg px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition-all hover:bg-red-500/15 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Edit Trigger */}
              <button
                onClick={() => onEdit(roadmap)}
                className="group/edit ml-1 flex h-7 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium text-gray-500 transition-all hover:bg-blue-500/15 hover:text-blue-400"
                title="Edit & Stages"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden group-hover/edit:inline">Edit</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

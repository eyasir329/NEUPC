/**
 * @file Roadmap table row component
 * @module RoadmapTableRow
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Star,
  Eye,
  Clock,
  Tag,
  Edit3,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  getStatusConfig,
  getDifficultyConfig,
  getCategoryConfig,
  formatRoadmapDate,
} from './roadmapConfig';
import {
  toggleRoadmapFeaturedAction,
  deleteRoadmapAction,
} from '@/app/_lib/actions/roadmap-actions';
import toast from 'react-hot-toast';

export default function RoadmapTableRow({ roadmap, onEdit }) {
  const router = useRouter();
  const [featuredPending, setFeaturedPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const sc = getStatusConfig(roadmap.status);
  const dc = getDifficultyConfig(roadmap.difficulty);
  const cc = getCategoryConfig(roadmap.category);

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

  async function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
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
    <tr className="group cursor-pointer transition-colors hover:bg-white/[0.025]">
      {/* Roadmap Info */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-500/20 bg-blue-500/10 transition-colors group-hover:border-blue-500/40">
            {roadmap.thumbnail ? (
              <img
                src={roadmap.thumbnail}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Compass className="h-4 w-4 text-blue-400/50" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white transition-colors group-hover:text-blue-300">
              {roadmap.title}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-gray-500">
                {cc.icon} {roadmap.category}
              </span>
              <span className="text-gray-700 select-none">•</span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase ${dc.badge}`}
              >
                <span className={`h-1 w-1 rounded-full ${dc.dot}`} />
                {dc.label}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${sc.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </span>
      </td>

      {/* Featured */}
      <td className="px-5 py-3.5 text-center">
        <div className="flex items-center justify-center">
          {roadmap.is_featured ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              <Star className="h-2.5 w-2.5 fill-current" />
              Featured
            </span>
          ) : (
            <span className="text-xs text-gray-600">—</span>
          )}
        </div>
      </td>

      {/* Views */}
      <td className="px-5 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-blue-400/60" />
          <span className="text-sm font-medium text-white tabular-nums">
            {(roadmap.views ?? 0).toLocaleString()}
          </span>
        </div>
      </td>

      {/* Duration */}
      <td className="px-5 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-amber-400/60" />
          <span className="text-sm font-medium text-white">
            {roadmap.estimated_duration || '—'}
          </span>
        </div>
      </td>

      {/* Updated / Date */}
      <td className="px-5 py-3.5">
        <span className="font-mono text-xs text-gray-500">
          {formatRoadmapDate(roadmap.created_at)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(roadmap);
            }}
            className="rounded-lg border border-transparent p-1.5 text-gray-500 transition-all hover:border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400"
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleToggleFeatured}
            disabled={featuredPending}
            className={`rounded-lg border border-transparent p-1.5 transition-all ${
              roadmap.is_featured
                ? 'text-amber-400 hover:border-amber-500/20 hover:bg-amber-500/10'
                : 'text-gray-500 hover:border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-400'
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

          {roadmap.status === 'published' && (
            <Link
              href={`/roadmaps/${roadmap.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg border border-transparent p-1.5 text-gray-500 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400"
              title="Preview"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}

          {deleteConfirm ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDelete}
                disabled={deletePending}
                className="rounded bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-300 transition-all hover:bg-red-500/30"
              >
                Confirm
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteConfirm(false);
                }}
                className="px-1 text-[10px] text-gray-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteConfirm(true);
              }}
              className="rounded-lg border border-transparent p-1.5 text-gray-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

'use client';

import { useState, useTransition } from 'react';
import {
  ExternalLink,
  Star,
  Edit3,
  Trash2,
  Loader2,
  ThumbsUp,
  User,
  Lock,
  Unlock,
  Tag,
} from 'lucide-react';
import {
  getTypeConfig,
  getDifficultyConfig,
  formatRelativeDate,
  formatDate,
} from './resourceConfig';
import {
  toggleResourceFeaturedAction,
  toggleResourceFreeAction,
  deleteResourceAction,
} from '@/app/_lib/resource-actions';

export default function ResourceCard({ resource, onEdit }) {
  const [featuredPending, setFeaturedPending] = useState(false);
  const [freePending, setFreePending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [flash, setFlash] = useState(null);

  const tc = getTypeConfig(resource.resource_type);
  const dc = getDifficultyConfig(resource.difficulty);
  const creator = resource.users;

  function showFlash(type) {
    setFlash(type);
    setTimeout(() => setFlash(null), 1600);
  }

  async function handleToggleFeatured() {
    setFeaturedPending(true);
    const fd = new FormData();
    fd.set('id', resource.id);
    fd.set('featured', String(!resource.is_featured));
    await toggleResourceFeaturedAction(fd);
    setFeaturedPending(false);
    showFlash('featured');
  }

  async function handleToggleFree() {
    setFreePending(true);
    const fd = new FormData();
    fd.set('id', resource.id);
    fd.set('is_free', String(!resource.is_free));
    await toggleResourceFreeAction(fd);
    setFreePending(false);
    showFlash('free');
  }

  async function handleDelete() {
    setDeletePending(true);
    const fd = new FormData();
    fd.set('id', resource.id);
    await deleteResourceAction(fd);
    setDeletePending(false);
  }

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-gray-900 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40 ${
        resource.is_featured ? 'border-amber-500/30' : 'border-white/8'
      }`}
    >
      {/* Flash ring */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 z-20 animate-pulse rounded-2xl ring-2 ring-white/20" />
      )}

      {/* Thumbnail / Placeholder */}
      <div className="relative h-36 w-full shrink-0 overflow-hidden">
        {resource.thumbnail ? (
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-linear-to-br ${tc.placeholder}`}
          >
            <span className="text-4xl opacity-60">{tc.emoji}</span>
          </div>
        )}

        {/* Featured toggle */}
        <button
          onClick={handleToggleFeatured}
          disabled={featuredPending}
          className={`absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-xl border transition-all ${
            resource.is_featured
              ? 'border-amber-400/60 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
              : 'border-white/10 bg-black/30 text-gray-500 opacity-0 group-hover:opacity-100 hover:border-amber-400/40 hover:text-amber-400'
          }`}
          title={
            resource.is_featured
              ? 'Remove from featured'
              : 'Feature this resource'
          }
        >
          {featuredPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Star
              className={`h-3 w-3 ${resource.is_featured ? 'fill-current' : ''}`}
            />
          )}
        </button>

        {/* Type badge */}
        <span
          className={`absolute top-2 right-2 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${tc.badge}`}
        >
          {tc.emoji} {tc.label}
        </span>

        {/* Free / Paid overlay */}
        <button
          onClick={handleToggleFree}
          disabled={freePending}
          className={`absolute right-2 bottom-2 flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition-all ${
            resource.is_free
              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
              : 'border-orange-500/30 bg-orange-500/15 text-orange-300 hover:bg-orange-500/25'
          }`}
          title="Toggle free / paid"
        >
          {freePending ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : resource.is_free ? (
            <Unlock className="h-2.5 w-2.5" />
          ) : (
            <Lock className="h-2.5 w-2.5" />
          )}
          {resource.is_free ? 'Free' : 'Paid'}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Title & external link */}
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-2 flex-1 text-sm leading-snug font-semibold text-white">
            {resource.title}
          </h3>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 shrink-0 text-gray-600 transition-colors hover:text-blue-400"
            title="Open resource"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Description */}
        {resource.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
            {resource.description}
          </p>
        )}

        {/* Category */}
        <p className="text-[11px] text-gray-600">
          <span className="text-gray-500">{resource.category}</span>
        </p>

        {/* Difficulty + upvotes */}
        <div className="flex items-center gap-2">
          {dc && (
            <span
              className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${dc.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dc.dot}`} />
              {dc.label}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-500">
            <ThumbsUp className="h-3 w-3" />
            {resource.upvotes ?? 0}
          </span>
        </div>

        {/* Tags */}
        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-600"
              >
                #{tag}
              </span>
            ))}
            {resource.tags.length > 4 && (
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-700">
                +{resource.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Creator + date */}
        <div className="mt-auto flex items-center gap-2 border-t border-white/6 pt-2">
          {creator?.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.full_name}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800">
              <User className="h-3 w-3 text-gray-500" />
            </div>
          )}
          <span className="flex-1 truncate text-[11px] text-gray-500">
            {creator?.full_name ?? 'Unknown'}
          </span>
          <span
            className="shrink-0 text-[10px] text-gray-700"
            title={formatDate(resource.created_at)}
          >
            {formatRelativeDate(resource.created_at)}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-1 border-t border-white/6 bg-white/2 px-3 py-2">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-gray-500 transition-colors hover:bg-white/6 hover:text-blue-400"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </a>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(resource)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 transition-colors hover:bg-white/6 hover:text-blue-400"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </button>

          {deleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deletePending}
                className="rounded-lg px-2 py-1.5 text-[11px] text-red-400 transition-colors hover:bg-red-500/10"
              >
                {deletePending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-lg px-2 py-1.5 text-[11px] text-gray-600 transition-colors hover:bg-white/6"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-gray-500 transition-colors hover:bg-red-500/8 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

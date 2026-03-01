/**
 * @file Blog card — displays a single post’s thumbnail, title, author,
 *   status badge, view / like counts, and edit / delete actions.
 * @module AdminBlogCard
 */

'use client';

import { useState, useTransition } from 'react';
import {
  Eye,
  Heart,
  MessageSquare,
  Star,
  Edit3,
  Trash2,
  ChevronDown,
  Loader2,
  Clock,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  getStatusConfig,
  getCategoryConfig,
  formatBlogDate,
  formatRelativeDate,
  STATUSES,
} from './blogConfig';
import {
  updateBlogStatusAction,
  toggleBlogFeaturedAction,
  deleteBlogAction,
} from '@/app/_lib/blog-actions';

export default function BlogCard({
  post,
  onEdit,
  onViewComments,
  onPostChange,
  onPostDelete,
}) {
  const [isPending, startTransition] = useTransition();
  const [featuredPending, setFeaturedPending] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [flash, setFlash] = useState(null);

  const sc = getStatusConfig(post.status);
  const cc = getCategoryConfig(post.category);

  function showFlash(type) {
    setFlash(type);
    setTimeout(() => setFlash(null), 1800);
  }

  async function handleStatusChange(newStatus) {
    setStatusOpen(false);
    if (newStatus === post.status) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', post.id);
      fd.set('status', newStatus);
      const result = await updateBlogStatusAction(fd);
      if (!result?.error) {
        onPostChange?.(post.id, {
          status: newStatus,
          published_at:
            newStatus === 'published' && !post.published_at
              ? new Date().toISOString()
              : post.published_at,
        });
        showFlash('status');
      }
    });
  }

  async function handleToggleFeatured() {
    setFeaturedPending(true);
    const fd = new FormData();
    fd.set('id', post.id);
    fd.set('featured', String(!post.is_featured));
    const result = await toggleBlogFeaturedAction(fd);
    setFeaturedPending(false);
    if (!result?.error) {
      onPostChange?.(post.id, { is_featured: !post.is_featured });
      showFlash('featured');
    }
  }

  async function handleDelete() {
    setDeletePending(true);
    const fd = new FormData();
    fd.set('id', post.id);
    const result = await deleteBlogAction(fd);
    setDeletePending(false);
    if (!result?.error) {
      onPostDelete?.(post.id);
    }
  }

  const author = post.users;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-gray-900 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40 ${sc.cardBorder}`}
    >
      {/* Flash overlay */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 z-20 animate-pulse rounded-2xl ring-2 ring-white/30" />
      )}

      {/* Thumbnail / Placeholder */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-linear-to-br from-gray-800 to-gray-900">
        {post.thumbnail ? (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-linear-to-br ${sc.gradient}`}
          >
            <span className="text-5xl opacity-50">{cc.emoji}</span>
          </div>
        )}

        {/* Featured star */}
        <button
          onClick={handleToggleFeatured}
          disabled={featuredPending}
          className={`absolute top-2.5 left-2.5 flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
            post.is_featured
              ? 'border-amber-400/60 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
              : 'border-white/10 bg-black/30 text-gray-500 opacity-0 group-hover:opacity-100 hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-400'
          }`}
          title={post.is_featured ? 'Remove from featured' : 'Mark as featured'}
        >
          {featuredPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star
              className={`h-3.5 w-3.5 ${post.is_featured ? 'fill-current' : ''}`}
            />
          )}
        </button>

        {/* Category badge */}
        {post.category && (
          <span
            className={`absolute top-2.5 right-2.5 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${cc.color}`}
          >
            {cc.short}
          </span>
        )}

        {/* Status overlay (mini) */}
        <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/70 to-transparent px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
            <span className="text-[10px] font-medium text-white/80">
              {sc.label}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-white">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-500"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 4 && (
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-600">
                +{post.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="mt-auto flex items-center gap-3 pt-2 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {(post.views ?? 0).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {post.likes ?? 0}
          </span>
          <button
            onClick={() => onViewComments(post)}
            className="flex items-center gap-1 transition-colors hover:text-blue-400"
          >
            <MessageSquare className="h-3 w-3" />
            {post.commentCount ?? 0}
            {post.pendingComments > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1 text-[9px] text-amber-400">
                {post.pendingComments} pending
              </span>
            )}
          </button>
          {post.read_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.read_time}m
            </span>
          )}
        </div>

        {/* Author + date */}
        <div className="flex items-center gap-2 border-t border-white/6 pt-2">
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.full_name}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-700">
              <User className="h-3 w-3 text-gray-400" />
            </div>
          )}
          <span className="flex-1 truncate text-[11px] text-gray-500">
            {author?.full_name ?? 'Unknown'}
          </span>
          <span
            className="shrink-0 text-[10px] text-gray-600"
            title={formatBlogDate(post.created_at)}
          >
            {formatRelativeDate(post.created_at)}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-1 border-t border-white/6 bg-white/2 px-3 py-2">
        {/* Status change dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setStatusOpen((o) => !o)}
            disabled={isPending}
            aria-label={`Change status — currently ${sc.label}`}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:bg-white/6 hover:text-white"
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
                className="fixed inset-0 z-10"
                onClick={() => setStatusOpen(false)}
              />
              <div className="absolute bottom-full left-0 z-20 mb-1 w-36 overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-2xl">
                {STATUSES.map((s) => {
                  const c = getStatusConfig(s);
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-white/6 ${
                        s === post.status ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <span className="h-4 w-px bg-white/8" />

        {/* View live (published only) */}
        {post.status === 'published' && (
          <a
            href={`/blogs/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 transition-colors hover:bg-white/6 hover:text-emerald-400"
            title="View live post"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Edit */}
        <button
          onClick={() => onEdit(post)}
          aria-label="Edit post"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 transition-colors hover:bg-white/6 hover:text-blue-400"
        >
          <Edit3 className="h-3 w-3" />
          Edit
        </button>

        {/* Delete */}
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
              className="rounded-lg px-2 py-1.5 text-[11px] text-gray-500 transition-colors hover:bg-white/6"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            aria-label="Delete post"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-gray-500 transition-colors hover:bg-red-500/8 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

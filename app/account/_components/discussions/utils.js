/**
 * @file Shared helpers, constants and DB→UI mappers for the Help Desk.
 *   The Help Desk UI is tag-driven; the mappers reshape DB discussion rows
 *   onto the shape the views expect so the layout/styling stays identical.
 *
 * @module account/member/discussions/utils
 */

import { formatRelativeTime } from '@/app/_lib/utils/utils';
import {
  MessageSquare,
  Heart,
  MessageCircle,
  Flame,
  FileText,
  Star,
  CheckCircle2,
  Pin,
} from 'lucide-react';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const TABS = [
  { id: 'All', label: 'All Posts', icon: MessageSquare },
  { id: 'Help', label: 'Help & Support', icon: Heart },
  { id: 'Discussion', label: 'Discussions', icon: MessageCircle },
  { id: 'Announcements', label: 'Announcements', icon: Flame },
  { id: 'Release Log', label: 'Release Log', icon: FileText },
  { id: 'Feature Requests', label: 'Feature Requests', icon: Star },
];

export const TYPE_TO_TAG = {
  general_question: { text: 'Help', color: 'blue' },
  course_problem: { text: 'Discussion', color: 'purple' },
  assignment_issue: { text: 'Discussion', color: 'purple' },
  bug_report: { text: 'Help', color: 'blue' },
  ui_issue: { text: 'Help', color: 'blue' },
  feature_request: { text: 'Feature Request', color: 'teal' },
  announcement: { text: 'Announce', color: 'rose' },
};

// Category options in the New Thread form → DB discussion types.
export const CATEGORY_TO_TYPE = {
  Help: 'general_question',
  Discussion: 'course_problem',
  'Feature Request': 'feature_request',
  Announce: 'announcement',
  'Release Log': 'announcement',
};

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-violet-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-fuchsia-600',
  'bg-sky-600',
  'bg-purple-600',
];

export function avatarColorFor(key) {
  const s = String(key ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
}

export function mapThreadToUi(d) {
  const author = d.author || d.user || {};
  const name = author.full_name || author.name || 'Unknown User';
  let typeTag = TYPE_TO_TAG[d.type] || { text: 'Discussion', color: 'purple' };

  if (d.type === 'announcement' && d.tags && d.tags.includes('Release Log')) {
    typeTag = { text: 'Release Log', color: 'indigo' };
  }

  const tags = [{ ...typeTag }];
  const solved =
    d.is_solved || d.status === 'resolved' || d.status === 'closed';
  if (solved)
    tags.push({ text: 'Solved', icon: CheckCircle2, color: 'emerald' });
  if (d.is_pinned) tags.push({ text: 'Pinned', icon: Pin, color: 'slate' });

  return {
    id: d.id,
    avatarText: initials(name),
    avatarColor: avatarColorFor(author.id || d.author_id || d.id),
    tags,
    title: d.title,
    author: name,
    time: d.created_at ? formatRelativeTime(d.created_at) : '',
    replies: d.reply_count || 0,
    views: d.views || 0,
    content: d.content || '',
    comments: null,
    type: d.type,
    bootcamp_id: d.bootcamp_id,
    status: d.status,
  };
}

export function mapReplyToComment(r) {
  const name = r.author?.full_name || 'Unknown User';
  return {
    id: r.id,
    author: name,
    avatarText: initials(name),
    avatarColor: avatarColorFor(r.author?.id || r.author_id || r.id),
    time: r.created_at ? formatRelativeTime(r.created_at) : '',
    content: r.content,
    likes: r.upvotes || 0,
  };
}

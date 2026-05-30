/**
 * @file Bootcamp table row component
 * @module BootcampTableRow
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Terminal,
  Edit3,
  Trash2,
  Loader2,
  Star,
  Users,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import {
  getStatusConfig,
  formatRelativeDate,
} from '@/app/account/_components/bootcamps/bootcampConfig';

export default function BootcampTableRow({
  bootcamp,
  onToggleFeatured,
  onDelete,
  deleteLoading,
}) {
  const pathname = usePathname();
  const isExecutive = pathname?.includes('/account/executive');
  const editUrl = isExecutive
    ? `/account/executive/bootcamps/${bootcamp.id}`
    : `/account/admin/bootcamps/${bootcamp.id}`;

  const sc = getStatusConfig(bootcamp.status);

  return (
    <tr className="group cursor-pointer transition-colors hover:bg-white/[0.025]">
      {/* Track */}
      <td className="px-5 py-3.5">
        <Link href={editUrl} className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-500/20 bg-violet-500/10 transition-colors group-hover:border-violet-500/40">
            {bootcamp.thumbnail ? (
              <img
                src={bootcamp.thumbnail}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Terminal className="h-4 w-4 text-violet-400/50" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white transition-colors group-hover:text-violet-300">
              {bootcamp.title}
            </div>
            {bootcamp.batch_info && (
              <div className="mt-0.5 font-mono text-[11px] text-violet-400/60">
                {bootcamp.batch_info}
              </div>
            )}
            {bootcamp.is_featured && (
              <div className="mt-0.5 flex items-center gap-1">
                <Star className="h-2.5 w-2.5 fill-current text-amber-400" />
                <span className="text-[10px] font-medium text-amber-400/70">
                  Featured
                </span>
              </div>
            )}
          </div>
        </Link>
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

      {/* Students */}
      <td className="px-5 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-blue-400/60" />
          <span className="text-sm font-medium text-white tabular-nums">
            {bootcamp.enrollment_count ?? 0}
          </span>
        </div>
      </td>

      {/* Lessons */}
      <td className="px-5 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-emerald-400/60" />
          <span className="text-sm font-medium text-white tabular-nums">
            {bootcamp.total_lessons ?? 0}
          </span>
        </div>
      </td>

      {/* Updated */}
      <td className="px-5 py-3.5">
        <span className="font-mono text-xs text-gray-500">
          {bootcamp.updated_at ? formatRelativeDate(bootcamp.updated_at) : '—'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Link
            href={editUrl}
            className="rounded-lg border border-transparent p-1.5 text-gray-500 transition-all hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-400"
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => onToggleFeatured(bootcamp.id)}
            className={`rounded-lg border border-transparent p-1.5 transition-all ${
              bootcamp.is_featured
                ? 'text-amber-400 hover:border-amber-500/20 hover:bg-amber-500/10'
                : 'text-gray-500 hover:border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-400'
            }`}
            title={bootcamp.is_featured ? 'Unfeature' : 'Feature'}
          >
            <Star
              className={`h-3.5 w-3.5 ${bootcamp.is_featured ? 'fill-current' : ''}`}
            />
          </button>
          {bootcamp.status === 'published' && (
            <Link
              href={`/account/member/bootcamps/${bootcamp.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-transparent p-1.5 text-gray-500 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400"
              title="Preview"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
          <button
            onClick={() => onDelete(bootcamp.id)}
            disabled={deleteLoading}
            className="rounded-lg border border-transparent p-1.5 text-gray-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
            title="Delete"
          >
            {deleteLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

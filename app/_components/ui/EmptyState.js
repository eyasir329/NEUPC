/**
 * @file Empty State
 * @module EmptyState
 */

import Link from 'next/link';

/**
 * EmptyState — Consistent empty-state placeholder for lists.
 *
 * @param {string} icon        – Emoji icon
 * @param {string} title       – Heading text
 * @param {string} description – Body text
 * @param {object} [action]    – Optional { label, href } for a CTA link
 */
export default function EmptyState({
  icon = '📭',
  title = 'Nothing Here Yet',
  description = 'Check back soon!',
  action,
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-12 text-center backdrop-blur-md">
      <div className="mb-4 text-6xl">{icon}</div>
      <h3 className="mb-2 text-2xl font-bold text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="from-primary-500 to-secondary-500 mt-6 inline-flex items-center gap-2 rounded-lg bg-linear-to-r px-6 py-2.5 font-semibold text-white transition-all hover:scale-105"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/**
 * @file Pagination
 * @module Pagination
 */

'use client';

/**
 * Pagination — Reusable pagination with smart page number display.
 *
 * @param {number}   currentPage – Current active page (1-based)
 * @param {number}   totalPages  – Total number of pages
 * @param {function} onPageChange – Callback with new page number
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const paginate = (page) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build page numbers: show first, last, current ± 1, with ellipsis
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push({ type: 'page', value: i });
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push({ type: 'ellipsis', value: i });
    }
  }

  return (
    <div className="mt-12 flex flex-col items-center gap-6">
      {/* Page Info */}
      <div className="text-center text-sm text-gray-400">
        Page {currentPage} of {totalPages}
      </div>

      {/* Pagination Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Previous */}
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Page Numbers */}
        {pages.map((p) =>
          p.type === 'ellipsis' ? (
            <span key={`e-${p.value}`} className="px-2 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={p.value}
              onClick={() => paginate(p.value)}
              className={`h-10 w-10 rounded-lg font-semibold backdrop-blur-md transition-all ${
                currentPage === p.value
                  ? 'from-primary-500 to-secondary-500 bg-linear-to-r text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {p.value}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

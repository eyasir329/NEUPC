/**
 * @file Course catalog tab.
 * @module CatalogTab
 */

'use client';

import { Search } from 'lucide-react';
import { CatalogCard, EmptyState, SearchInput } from './bootcamps-shared';

function CatalogTab({
  availableBootcamps,
  filteredAvailable,
  search,
  setSearch,
  handleEnroll,
  enrollingId,
  enrollmentMap,
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Catalog
          </h1>
          <p className="mt-1 text-[13.5px] text-gray-500">
            {availableBootcamps.length} bootcamp
            {availableBootcamps.length === 1 ? '' : 's'} available to enroll
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search catalog…"
        />
      </div>

      {availableBootcamps.length === 0 ? (
        <EmptyState
          title="You're enrolled in everything"
          description="Check back later for new bootcamps."
        />
      ) : filteredAvailable.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No matches for "${search}"`}
          action={
            <button
              onClick={() => setSearch('')}
              className="text-[12px] text-violet-400 hover:text-violet-300"
            >
              Clear search
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAvailable.map((b) => (
            <CatalogCard
              key={b.id}
              bootcamp={b}
              onEnroll={handleEnroll}
              isEnrolling={enrollingId === b.id}
              pendingEnrollment={enrollmentMap?.[b.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────


export { CatalogTab };

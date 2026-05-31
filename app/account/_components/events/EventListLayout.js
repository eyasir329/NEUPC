/**
 * @file Event list layout component
 * @module EventListLayout
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarX, Filter, X, Search } from 'lucide-react';
import { PageShell, PageHeader, TabBar } from '@/app/account/_components/ui';
import EventRow from './EventRow';
import EventDetail from './EventDetail';
import { VENUE_TYPES } from './eventConstants';

const PAGE_MOTION = { duration: 0.18, ease: [0.22, 1, 0.36, 1] };

/**
 * Full-page event layout shared by all 6 role views.
 *
 * Props:
 *   pageHeader   — { icon, title, subtitle, accent, actions? }
 *   tabs         — array of { value, label, icon, count }
 *   events       — enriched event array (from enrichEvent())
 *   filterFn     — (event, activeTab) => boolean — how to filter per tab
 *   stats        — computed stat array (from computeStats())
 *   sidebarCta   — React node: role-specific card in sidebar
 *   rowProps     — extra props forwarded to EventRow (showStatus, showCover, showRegs, onEdit, onDelete)
 *   getDetailProps — (event) => { detailRows, ctaSlot?, sidebarSlot? }
 *   flashSlot    — React node: flash/toast (member only)
 *   aboveList    — React node: rendered above the event list (e.g. toolbar for manage roles)
 *   listHeader   — React node: rendered inside the list column, above the count row
 *   initialEventId — optional event id to open directly on mount (deep link)
 */
export default function EventListLayout({
  pageHeader,
  tabs,
  events,
  filterFn,
  stats,
  sidebarCta,
  rowProps = {},
  getDetailProps,
  renderDetail,
  flashSlot,
  aboveList,
  listHeader,
  initialEventId = null,
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.value ?? 'All');
  // `undefined` = untouched (fall back to the deep-linked id); `null` = the
  // user explicitly closed the detail. This keeps the server/client first
  // render identical (no hydration mismatch) without a sync effect.
  const [selectedEventId, setSelectedEventId] = useState(undefined);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterVenue, setFilterVenue] = useState('');
  const [search, setSearch] = useState('');

  const effectiveEventId =
    selectedEventId === undefined ? initialEventId : selectedEventId;
  const selectedEvent = effectiveEventId
    ? events.find((e) => e.id === effectiveEventId)
    : null;

  const dynamicCategories = useMemo(
    () => [...new Set(events.map((e) => e.category).filter(Boolean))].sort(),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (!filterFn(e, activeTab)) return false;
      if (filterCategory && (e.category || '') !== filterCategory) return false;
      if (filterVenue && (e.venue_type || '') !== filterVenue) return false;
      if (
        q &&
        !e.title.toLowerCase().includes(q) &&
        !(e.description || '').toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [events, activeTab, filterCategory, filterVenue, search, filterFn]);

  const hasFilter = filterCategory || filterVenue || search;

  const detailProps =
    selectedEvent && getDetailProps ? getDetailProps(selectedEvent) : null;

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      {flashSlot}

      <AnimatePresence mode="popLayout">
        {selectedEvent ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={PAGE_MOTION}
          >
            {renderDetail ? (
              renderDetail(selectedEvent, () => setSelectedEventId(null))
            ) : (
              <EventDetail
                event={selectedEvent}
                onBack={() => setSelectedEventId(null)}
                {...detailProps}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={PAGE_MOTION}
          >
            <PageHeader {...pageHeader} />
            <TabBar
              tabs={tabs}
              value={activeTab}
              onChange={(id) => {
                setActiveTab(id);
                setSelectedEventId(null);
              }}
            />

            {aboveList}

            <div className="grid grid-cols-1 items-start gap-8 pt-6 lg:grid-cols-3">
              {/* Event list */}
              <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
                {listHeader}
                {/* Search + filters */}
                <div className="flex flex-col gap-2 border-b border-white/6 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative min-w-[160px] flex-1">
                      <Search
                        size={12}
                        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-600"
                      />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search events…"
                        className="w-full rounded-lg border border-white/8 bg-white/4 py-1.5 pr-3 pl-7 text-[11px] text-gray-300 placeholder-gray-600 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40 focus:outline-none"
                      />
                    </div>
                    {/* Category */}
                    {dynamicCategories.length > 0 && (
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className={`cursor-pointer appearance-none rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors focus:ring-1 focus:ring-violet-500/40 focus:outline-none ${
                          filterCategory
                            ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                            : 'border-white/8 bg-white/4 text-gray-400 hover:border-white/14 hover:text-gray-300'
                        }`}
                      >
                        <option value="">All Categories</option>
                        {dynamicCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    )}
                    {/* Venue */}
                    <select
                      value={filterVenue}
                      onChange={(e) => setFilterVenue(e.target.value)}
                      className={`cursor-pointer appearance-none rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors focus:ring-1 focus:ring-violet-500/40 focus:outline-none ${
                        filterVenue
                          ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                          : 'border-white/8 bg-white/4 text-gray-400 hover:border-white/14 hover:text-gray-300'
                      }`}
                    >
                      <option value="">All Venues</option>
                      {VENUE_TYPES.map((v) => (
                        <option key={v} value={v}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </option>
                      ))}
                    </select>
                    {hasFilter && (
                      <button
                        onClick={() => {
                          setFilterCategory('');
                          setFilterVenue('');
                          setSearch('');
                        }}
                        className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/8 px-2.5 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/15"
                      >
                        <X size={10} /> Clear
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600">
                    {filteredEvents.length === 0
                      ? 'No matching events'
                      : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}${hasFilter ? ' found' : ''}`}
                  </p>
                </div>

                <AnimatePresence mode="popLayout">
                  {filteredEvents.length > 0 ? (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-3"
                    >
                      {filteredEvents.map((event, index) => (
                        <EventRow
                          key={event.id}
                          event={event}
                          index={index}
                          onClick={() => setSelectedEventId(event.id)}
                          {...rowProps}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/2 p-12 text-center"
                    >
                      <CalendarX size={48} className="mb-4 text-gray-700" />
                      <h3 className="mb-1 text-lg font-medium text-gray-300">
                        No {activeTab} events
                      </h3>
                      <p className="max-w-sm text-sm text-gray-500">
                        There are currently no events in this category. Check
                        back later!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sidebar */}
              <div className="sticky top-14 hidden flex-col gap-6 lg:flex">
                {/* Stats overview */}
                <div className="rounded-xl border border-white/6 bg-gray-900 p-5 transition-all hover:border-white/10">
                  <h3 className="mb-4 text-sm font-semibold text-gray-200">
                    Overview
                  </h3>
                  <div className="flex flex-col gap-4 text-sm">
                    {stats.map((stat) => (
                      <div
                        key={stat.id}
                        className="group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-md ${stat.bg}`}
                          >
                            <stat.icon size={12} className={stat.color} />
                          </div>
                          <span className="font-medium text-gray-400 transition-colors group-hover:text-gray-300">
                            {stat.title}
                          </span>
                        </div>
                        <span className="font-semibold text-white tabular-nums">
                          {stat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role-specific CTA card */}
                {sidebarCta}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

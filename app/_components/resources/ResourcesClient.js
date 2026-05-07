'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Search,
  Bookmark,
  CheckCircle,
  BookOpen,
  Map,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import ResourceGrid from '@/app/_components/resources/ResourceGrid';
import { toggleResourceBookmarkAction } from '@/app/_lib/member-resources-actions';
import ResourceViewer from '@/app/_components/resources/ResourceViewer';
import ViewTracker from '@/app/_components/resources/ViewTracker';
import MemberResourceSubmitModal from '@/app/_components/resources/MemberResourceSubmitModal';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Image' },
  { value: 'file', label: 'File / PDF' },
  { value: 'external_link', label: 'External Link' },
  { value: 'rich_text', label: 'Article' },
  { value: 'facebook_post', label: 'Facebook' },
  { value: 'linkedin_post', label: 'LinkedIn' },
];

export default function ResourcesClient({
  resources,
  categories,
  page,
  total,
  pageSize,
  bookmarkedIds = [],
  canBookmark = false,
  basePath,
  blogCount = 0,
  roadmapCount = 0,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saved, setSaved] = useState(bookmarkedIds);
  const [activeResource, setActiveResource] = useState(null);
  const [pending, start] = useTransition();
  const [searchDraft, setSearchDraft] = useState(searchParams.get('q') || '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const gridRef = useRef(null);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const searchTimer = useRef(null);

  const effectiveBasePath = basePath || pathname || '/account';
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const filterState = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      type: searchParams.get('type') || '',
      categoryId: searchParams.get('categoryId') || '',
    }),
    [searchParams]
  );

  // Keep search draft in sync when URL changes (e.g. browser back)
  useEffect(() => {
    setSearchDraft(filterState.q);
  }, [filterState.q]);

  const updateFilters = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams.toString());
      const setOrDelete = (key, val) => {
        if (val) params.set(key, val);
        else params.delete(key);
      };
      setOrDelete('q', next.q);
      setOrDelete('type', next.type);
      setOrDelete('categoryId', next.categoryId);
      params.set('page', '1');
      router.push(`${effectiveBasePath}?${params.toString()}`);
    },
    [searchParams, effectiveBasePath, router]
  );

  // Debounced search
  const handleSearchChange = (val) => {
    setSearchDraft(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      updateFilters({ ...filterState, q: val });
    }, 380);
  };
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const goPage = useCallback(
    (targetPage) => {
      const p = Math.max(1, Math.min(totalPages, targetPage));
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(p));
      router.push(`${effectiveBasePath}?${params.toString()}`);
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [totalPages, searchParams, effectiveBasePath, router]
  );

  const onToggleBookmark = useCallback(
    (resourceId) => {
      if (!canBookmark) { router.push('/login'); return; }
      start(async () => {
        const result = await toggleResourceBookmarkAction(resourceId);
        if (result?.error) return;
        setSaved((prev) =>
          result.bookmarked
            ? [...new Set([...prev, resourceId])]
            : prev.filter((id) => id !== resourceId)
        );
      });
    },
    [canBookmark, router]
  );

  const closeModal = useCallback(() => {
    setActiveResource(null);
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  const openModal = useCallback((resource) => {
    if (!resource) return;
    previousFocusRef.current = document.activeElement;
    setActiveResource(resource);
  }, []);

  useEffect(() => {
    if (!activeResource) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea'
        );
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => {
      modalRef.current?.querySelector('[data-close-modal]')?.focus();
    });
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeResource, closeModal]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages]);
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.add(i);
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…' + sorted[i]);
      result.push(sorted[i]);
    }
    return result;
  }, [totalPages, page]);

  const activeCatId = filterState.categoryId || '';
  const activeType = filterState.type || '';
  const hasActiveFilters = filterState.q || filterState.type || filterState.categoryId;

  const handleCatClick = (catId) => updateFilters({ ...filterState, categoryId: catId, type: '' });
  const handleSpecialFilter = (key) => {
    const next = activeType === key ? '' : key;
    updateFilters({ ...filterState, type: next, categoryId: '' });
  };
  const handleTypeSelect = (val) => updateFilters({ ...filterState, type: val, categoryId: filterState.categoryId });
  const clearAll = () => { setSearchDraft(''); updateFilters({ q: '', type: '', categoryId: '' }); };

  const rangeStart = Math.min((page - 1) * pageSize + 1, total);
  const rangeEnd = Math.min(page * pageSize, total);

  // ─── Sidebar content (shared desktop/mobile) ───────────────────────────────

  const SidebarContent = () => (
    <nav aria-label="Resource filters">
      {/* Categories section */}
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">
        Categories
      </p>
      <div className="flex flex-col gap-px">
        <SidebarItem
          active={!activeCatId && !activeType}
          onClick={() => handleCatClick('')}
          count={total}
        >
          All Resources
        </SidebarItem>
        {categories.map((cat) => (
          <SidebarItem
            key={cat.id}
            active={activeCatId === cat.id}
            onClick={() => handleCatClick(cat.id)}
            count={cat.resource_count ?? null}
          >
            {cat.name}
          </SidebarItem>
        ))}
      </div>

      <div className="my-3 h-px bg-white/[0.05]" />

      {/* Filters section */}
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">
        Quick Filters
      </p>
      <div className="flex flex-col gap-px">
        <SidebarItem
          active={activeType === 'bookmarked'}
          onClick={() => handleSpecialFilter('bookmarked')}
          count={saved.length || null}
          icon={<Bookmark className="h-3 w-3 shrink-0" />}
          accent="amber"
        >
          Bookmarked
        </SidebarItem>
        <SidebarItem
          active={activeType === 'completed'}
          onClick={() => handleSpecialFilter('completed')}
          icon={<CheckCircle className="h-3 w-3 shrink-0" />}
          accent="emerald"
        >
          Completed
        </SidebarItem>
      </div>

      <div className="my-3 h-px bg-white/[0.05]" />

      {/* Explore section */}
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">
        Explore
      </p>
      <div className="flex flex-col gap-px">
        <button
          onClick={() => { setSubmitOpen(true); setMobileFiltersOpen(false); }}
          className="flex items-center gap-2 rounded-lg px-2 py-1.75 text-[12.5px] text-white/40 transition-colors hover:bg-white/4 hover:text-white/70"
        >
          <Plus className="h-3 w-3 shrink-0" />
          <span className="flex-1">Submit a Resource</span>
        </button>
        <Link
          href="/blogs"
          target="_blank"
          className="group/link flex items-center gap-2 rounded-lg px-2 py-[7px] text-[12.5px] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70"
        >
          <BookOpen className="h-3 w-3 shrink-0" />
          <span className="flex-1">Blogs</span>
          {blogCount > 0 && <span className="tabular-nums text-[10.5px] text-white/20">{blogCount}</span>}
          <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/link:opacity-40 transition-opacity" />
        </Link>
        <Link
          href="/roadmaps"
          target="_blank"
          className="group/link flex items-center gap-2 rounded-lg px-2 py-[7px] text-[12.5px] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70"
        >
          <Map className="h-3 w-3 shrink-0" />
          <span className="flex-1">Roadmaps</span>
          {roadmapCount > 0 && <span className="tabular-nums text-[10.5px] text-white/20">{roadmapCount}</span>}
          <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover/link:opacity-40 transition-opacity" />
        </Link>
      </div>
    </nav>
  );

  return (
    <div ref={gridRef} className="space-y-3">

      {/* ── Mobile horizontal chip strip ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:hidden [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <ChipBtn active={!activeCatId && !activeType} onClick={() => handleCatClick('')} count={total}>All</ChipBtn>
        {categories.map((cat) => (
          <ChipBtn key={cat.id} active={activeCatId === cat.id} onClick={() => handleCatClick(cat.id)}>
            {cat.name}
          </ChipBtn>
        ))}
        <span className="shrink-0 select-none text-white/[0.12] text-xs">|</span>
        <ChipBtn
          active={activeType === 'bookmarked'}
          onClick={() => handleSpecialFilter('bookmarked')}
          count={saved.length || null}
          accent="amber"
        >
          <Bookmark className="h-2.5 w-2.5" /> Saved
        </ChipBtn>
        <span className="shrink-0 select-none text-white/[0.12] text-xs">|</span>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#0f1117] px-3 py-1.5 text-[11.5px] font-medium text-white/40 transition-colors hover:text-white/70"
        >
          <SlidersHorizontal className="h-2.5 w-2.5" /> Filters
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex items-start gap-4">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:block w-[220px] shrink-0 rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl p-4 sticky top-[90px] shadow-2xl">
          <SidebarContent />
        </aside>

        {/* ── Main area ── */}
        <div className="min-w-0 flex-1 space-y-3">

          {/* Search + type filter row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-white/70" />
              <input
                value={searchDraft}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search resources…"
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md py-3 pr-10 pl-10 text-[13px] font-medium text-white placeholder-white/30 outline-none transition-all focus:border-white/[0.2] focus:bg-white/[0.04] focus:ring-4 focus:ring-white/[0.02] shadow-sm"
              />
              {searchDraft && (
                <button
                  onClick={() => { setSearchDraft(''); updateFilters({ ...filterState, q: '' }); }}
                  className="absolute top-1/2 right-3 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/[0.1] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Type select */}
            <div className="relative hidden sm:block">
              <select
                value={!['bookmarked', 'completed'].includes(activeType) ? activeType : ''}
                onChange={(e) => handleTypeSelect(e.target.value)}
                className="appearance-none rounded-xl border border-white/[0.07] bg-[#0b0d12] py-2 pl-3 pr-7 text-[12.5px] text-white/50 outline-none transition-all focus:border-white/[0.15] cursor-pointer hover:border-white/[0.12] hover:text-white/70"
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            </div>

            {/* Clear filters pill */}
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.07] px-3 py-2 text-[12px] text-white/40 transition-colors hover:border-white/[0.12] hover:text-white/70"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}

            {/* Submit resource button */}
            <button
              onClick={() => setSubmitOpen(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/9 bg-white/4 px-3 py-2 text-[12px] font-medium text-white/55 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white/85"
              title="Suggest a resource for the library"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Submit</span>
            </button>
          </div>

          {/* Result count */}
          {hasActiveFilters && (
            <p className="text-[11.5px] text-white/25" role="status" aria-live="polite">
              {pending ? 'Searching…' : (
                <><span className="font-medium text-white/50">{total}</span> result{total !== 1 ? 's' : ''}</>
              )}
            </p>
          )}

          {/* Loading overlay shimmer on grid */}
          <div className={`transition-opacity duration-200 ${pending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <ResourceGrid
              resources={resources}
              bookmarkedIds={saved}
              onToggleBookmark={canBookmark ? onToggleBookmark : undefined}
              detailBasePath={effectiveBasePath}
              onOpenResource={openModal}
            />
          </div>

          {/* Pagination */}
          {total > 0 && totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0b0d12] px-4 py-3"
            >
              <p className="text-[11.5px] text-white/25">
                <span className="font-medium text-white/50">{rangeStart}–{rangeEnd}</span>
                {' '}of{' '}
                <span className="font-medium text-white/50">{total}</span>
              </p>
              <div className="flex items-center gap-1">
                <PagBtn onClick={() => goPage(page - 1)} disabled={page <= 1 || pending} aria-label="Previous page">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </PagBtn>
                {pageNumbers.map((item, i) =>
                  typeof item === 'string' ? (
                    <span key={item + i} className="flex h-7 w-5 items-center justify-center text-[11px] text-white/15 select-none">…</span>
                  ) : (
                    <PagBtn
                      key={item}
                      onClick={() => goPage(item)}
                      disabled={pending}
                      active={item === page}
                      aria-current={item === page ? 'page' : undefined}
                    >
                      {item}
                    </PagBtn>
                  )
                )}
                <PagBtn onClick={() => goPage(page + 1)} disabled={page >= totalPages || pending} aria-label="Next page">
                  <ChevronRight className="h-3.5 w-3.5" />
                </PagBtn>
              </div>
            </nav>
          )}

          {total > 0 && totalPages <= 1 && !hasActiveFilters && (
            <p className="py-1 text-center text-[11px] text-white/15">
              {total} resource{total !== 1 ? 's' : ''}
            </p>
          )}

          {pending && (
            <div className="flex items-center justify-center gap-2 py-3" role="status">
              <Loader2 className="h-4 w-4 animate-spin text-white/25" />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile filters drawer ── */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-[#0b0d12] border-r border-white/[0.07] p-5 lg:hidden">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-white/70">Filters</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-white/40 hover:text-white/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </>
      )}

      {/* ── Member submit modal ── */}
      {submitOpen && (
        <MemberResourceSubmitModal
          categories={categories}
          onClose={() => setSubmitOpen(false)}
        />
      )}

      {/* ── Resource detail modal ── */}
      {activeResource && (
        <div
          className="fixed inset-0 z-70 flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4 py-0 sm:py-4 backdrop-blur-sm"
          onClick={closeModal}
          role="presentation"
          aria-hidden="true"
        >
          <div
            ref={modalRef}
            className="relative flex w-full sm:max-w-4xl flex-col overflow-hidden rounded-none sm:rounded-2xl border-t sm:border border-white/[0.09] bg-[#0a0b0f] shadow-2xl max-h-[95vh] sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Resource: ${activeResource.title}`}
          >
            {/* Modal header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 sm:px-5 py-3 sm:py-3.5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[13px] font-semibold text-white/90">
                  {activeResource.title}
                </h2>
                {activeResource.category?.name && (
                  <p className="mt-0.5 text-[11px] text-white/30">{activeResource.category.name}</p>
                )}
              </div>
              <button
                type="button"
                data-close-modal
                onClick={closeModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.09] text-white/35 transition-all hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white/70 focus:outline-none"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <ViewTracker resourceId={activeResource.id} source="member_modal" />
              <div className="p-4 sm:p-6">
                <ResourceViewer resource={activeResource} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function SidebarItem({ active, onClick, children, count, icon, accent }) {
  const accentMap = {
    amber: active ? 'bg-amber-500/15 text-amber-300' : 'text-white/50 hover:text-amber-200/80',
    emerald: active ? 'bg-emerald-500/15 text-emerald-300' : 'text-white/50 hover:text-emerald-200/80',
  };
  const colorClass = accent
    ? accentMap[accent] || ''
    : active
      ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
      : 'text-white/50 hover:bg-white/[0.04] hover:text-white/90';

  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${colorClass}`}
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {count != null && (
        <span className="tabular-nums text-[10px] font-medium opacity-60 bg-white/5 px-1.5 py-0.5 rounded-md group-hover:bg-white/10 transition-colors">{count}</span>
      )}
    </button>
  );
}

function ChipBtn({ active, onClick, children, count, accent }) {
  const accentActive = accent === 'amber'
    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
    : 'border-blue-500/40 bg-blue-500/15 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]';
  const base = 'border-white/[0.08] bg-white/[0.03] backdrop-blur-md text-white/60 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06]';

  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 ${active ? accentActive : base}`}
    >
      {children}
      {count != null && count > 0 && (
        <span className="tabular-nums text-[10px] opacity-70 bg-white/10 px-1 rounded-sm">{count}</span>
      )}
    </button>
  );
}

function PagBtn({ children, active, disabled, onClick, ...rest }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg text-[13px] font-medium tabular-nums transition-all
        disabled:pointer-events-none disabled:opacity-25
        ${active
          ? 'bg-white/[0.12] text-white shadow-sm'
          : 'border border-white/[0.08] bg-white/[0.02] backdrop-blur-md text-white/50 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white'
        }`}
    >
      {children}
    </button>
  );
}

'use client';

import { useState, useTransition, useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  FolderOpen,
  Star,
  CheckCircle2,
  Search,
  ArrowUpRight,
  Pin,
  ChevronLeft,
  ChevronRight,
  Youtube,
  Image as ImageIcon,
  Link2,
  FileText,
  Hash,
  Plus,
  List,
  Loader2,
  X,
} from "lucide-react";
import { toggleResourceBookmarkAction } from '@/app/_lib/member-resources-actions';
import ResourceViewer from '@/app/_components/resources/ResourceViewer';
import ViewTracker from '@/app/_components/resources/ViewTracker';
import MemberResourceSubmitModal from '@/app/_components/resources/MemberResourceSubmitModal';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const TYPE_OPTIONS = [
  { value: 'All Types', label: 'All Types' },
  { value: 'Videos', label: 'Videos' },
  { value: 'Images', label: 'Images' },
  { value: 'Links', label: 'Links' },
  { value: 'Files', label: 'Files' },
];

const getTypeStyle = (type) => {
  let mappedType = 'External Link';
  if (type === 'image') mappedType = 'Image';
  else if (type === 'video' || type === 'youtube') mappedType = 'Video';
  else if (type === 'file') mappedType = 'File';
  else mappedType = 'External Link';

  switch (mappedType) {
    case "Image":
      return {
        outline: "outline-violet-500/20",
        bg: "bg-violet-500/10",
        text: "text-violet-400",
        border: "border-violet-500/20",
        borderTop: "bg-violet-500",
        hoverBorder: "hover:border-violet-500/40",
        icon: ImageIcon,
      };
    case "Video":
      return {
        outline: "outline-rose-500/20",
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/20",
        borderTop: "bg-rose-500",
        hoverBorder: "hover:border-rose-500/40",
        icon: Youtube,
      };
    case "File":
      return {
        outline: "outline-amber-500/20",
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
        borderTop: "bg-amber-500",
        hoverBorder: "hover:border-amber-500/40",
        icon: FileText,
      };
    default:
      return {
        outline: "outline-blue-500/20",
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/20",
        borderTop: "bg-blue-500",
        hoverBorder: "hover:border-blue-500/40",
        icon: Link2,
      };
  }
};

const NavItem = ({ icon: Icon, label, badge, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'group/nav relative flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/30',
      active
        ? 'bg-violet-500/12 font-semibold text-violet-400 shadow-violet-500/10'
        : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
    )}
  >
    {active && (
      <div className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-purple-600" />
    )}
    <Icon className="h-[17px] w-[17px] shrink-0" />
    <span className="flex-1 truncate text-left">{label}</span>
    {badge !== undefined && badge !== null && (
      <span className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-medium",
        active ? "bg-violet-500/20 text-violet-400" : "bg-white/[0.04] text-gray-400 group-hover/nav:bg-white/[0.08]"
      )}>
        {badge}
      </span>
    )}
  </button>
);

export default function ResourcesClient({
  resources = [],
  categories = [],
  page = 1,
  total = 0,
  pageSize = 12,
  bookmarkedIds = [],
  canBookmark = false,
  canUpload = true,
  basePath,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saved, setSaved] = useState(bookmarkedIds);
  const [completed, setCompleted] = useState([]);
  const [activeResource, setActiveResource] = useState(null);
  const [pending, start] = useTransition();
  const [searchDraft, setSearchDraft] = useState(searchParams.get('q') || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const searchTimer = useRef(null);

  const effectiveBasePath = basePath || pathname || '/account';
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const activeTab = searchParams.get('tab') || 'all';
  const activeType = searchParams.get('type') || 'All Types';

  const updateFilters = useCallback((next) => {
    const params = new URLSearchParams(searchParams.toString());
    const setOrDelete = (key, val) => {
      if (val && val !== 'all' && val !== 'All Types') params.set(key, val);
      else params.delete(key);
    };
    setOrDelete('q', next.q);
    setOrDelete('type', next.type);
    setOrDelete('tab', next.tab);
    
    if (next.tab && next.tab !== 'all' && next.tab !== 'bookmarks' && next.tab !== 'completed') {
      params.set('categoryId', next.tab);
    } else {
      params.delete('categoryId');
    }

    params.set('page', '1');
    router.push(`${effectiveBasePath}?${params.toString()}`);
  }, [searchParams, effectiveBasePath, router]);

  useEffect(() => {
    setSearchDraft(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchChange = (val) => {
    setSearchDraft(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      updateFilters({ q: val, type: activeType, tab: activeTab });
    }, 380);
  };
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const goPage = useCallback((targetPage) => {
    const p = Math.max(1, Math.min(totalPages, targetPage));
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${effectiveBasePath}?${params.toString()}`);
  }, [totalPages, searchParams, effectiveBasePath, router]);

  const onToggleBookmark = useCallback((resourceId, e) => {
    if (e) e.stopPropagation();
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
  }, [canBookmark, router]);

  const onToggleCompleted = (resourceId, e) => {
    if (e) e.stopPropagation();
    setCompleted(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const resourcesState = resources.map(r => ({
    ...r,
    bookmarked: saved.includes(r.id),
    completed: completed.includes(r.id)
  }));

  const filteredResources = resourcesState.filter(r => {
    if (activeTab === "bookmarks" && !r.bookmarked) return false;
    if (activeTab === "completed" && !r.completed) return false;
    
    if (activeType !== "All Types") {
      const isVideo = r.resource_type === 'video' || r.resource_type === 'youtube';
      const isImage = r.resource_type === 'image';
      const isFile = r.resource_type === 'file';
      const isLink = ['external_link', 'facebook_post', 'linkedin_post'].includes(r.resource_type);
      
      if (activeType === "Videos" && !isVideo) return false;
      if (activeType === "Images" && !isImage) return false;
      if (activeType === "Links" && !isLink) return false;
      if (activeType === "Files" && !isFile) return false;
    }
    
    return true;
  });

  const getTabLabel = () => {
    if (activeTab === 'all') return 'All Resources';
    if (activeTab === 'bookmarks') return 'Bookmarks';
    if (activeTab === 'completed') return 'Completed';
    const cat = categories.find(c => c.id === activeTab);
    return cat ? cat.name : 'Resources';
  };

  return (
    <div className="flex text-gray-300 selection:bg-violet-500/30">
      {/* ── Secondary left nav ───────────────────────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 border-r border-white/[0.06] bg-gray-950 xl:flex xl:flex-col sticky top-0 h-[calc(100vh-56px)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex-1 px-3 py-2">
          <div className="space-y-0.5 mb-6 mt-2">
            <NavItem
              icon={List}
              label="All Resources"
              active={activeTab === "all"}
              badge={activeTab === "all" ? total : null}
              onClick={() => updateFilters({ tab: 'all', type: activeType, q: searchDraft })}
            />
            <NavItem
              icon={Star}
              label="Bookmarks"
              active={activeTab === "bookmarks"}
              badge={saved.length}
              onClick={() => updateFilters({ tab: 'bookmarks', type: activeType, q: searchDraft })}
            />
            <NavItem
              icon={CheckCircle2}
              label="Completed"
              active={activeTab === "completed"}
              badge={completed.length}
              onClick={() => updateFilters({ tab: 'completed', type: activeType, q: searchDraft })}
            />
          </div>

          <div className="px-3 mb-2 flex items-center justify-between">
            <div className="text-[10.5px] font-semibold tracking-widest text-gray-600 uppercase select-none">
              Categories
            </div>
            {canUpload && (
              <button onClick={() => setIsAddModalOpen(true)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-0.5 pb-6">
            {categories.map((cat) => (
              <NavItem
                key={cat.id}
                icon={Hash}
                label={cat.name}
                active={activeTab === cat.id}
                badge={cat.resource_count ?? null}
                onClick={() => updateFilters({ tab: cat.id, type: activeType, q: searchDraft })}
              />
            ))}
          </div>
        </nav>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet horizontal tab bar (visible below xl) */}
        <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-xl xl:hidden">
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6">
            <nav className="scrollbar-none -mb-px flex items-center gap-0.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All', icon: List },
                { id: 'bookmarks', label: 'Bookmarks', icon: Star },
                { id: 'completed', label: 'Completed', icon: CheckCircle2 },
                ...categories.map(c => ({ id: c.id, label: c.name, icon: Hash }))
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => updateFilters({ tab: tab.id, type: activeType, q: searchDraft })}
                    className={cn(
                      'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[13px] font-medium transition-colors',
                      active
                        ? 'border-violet-500 text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-violet-400' : '')} />
                    <span className="truncate max-w-[56px] sm:max-w-none text-[12px] sm:text-[13px]">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            {canUpload && (
              <div className="flex shrink-0 items-center gap-1.5 py-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-400 transition-colors hover:border-white/[0.14] hover:text-gray-200"
                  aria-label="Add Resource"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 p-4 pb-10 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            {activeResource ? (
              <div className="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-160px)]">
                <button
                  onClick={() => setActiveResource(null)}
                  className="mb-8 flex items-center gap-2 self-start text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Resources
                </button>

                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {(() => {
                    const style = getTypeStyle(activeResource.resource_type);
                    return (
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${style.bg} ${style.text} outline outline-1 outline-offset-[-1px] ${style.outline}`}>
                        <style.icon className="w-8 h-8 stroke-[2px]" />
                      </div>
                    );
                  })()}
                  
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="rounded border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        {activeResource.category?.name || 'Uncategorized'}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(activeResource.published_at || activeResource.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <h1 className="mb-4 text-xl sm:text-2xl font-bold text-white">
                      {activeResource.title}
                    </h1>
                    <p className="mb-8 max-w-3xl text-[13px] leading-relaxed text-gray-400">
                      {activeResource.description || `Learning material in the ${activeResource.category?.name || 'Uncategorized'} category. This is a detailed view of the resource.`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <a
                        href={activeResource.embed_url || activeResource.file_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 sm:px-5 sm:py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-violet-600"
                      >
                        <ArrowUpRight className="w-4 h-4 shrink-0" /> Open Resource
                      </a>
                      {canBookmark && (
                        <button
                          onClick={(e) => onToggleBookmark(activeResource.id, e)}
                          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 sm:px-5 sm:py-2.5 text-[13px] font-medium text-gray-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                        >
                          <Star className={`w-4 h-4 shrink-0 ${activeResource.bookmarked ? "fill-amber-500 text-amber-500" : "text-gray-500"}`} />
                          {activeResource.bookmarked ? "Bookmarked" : "Bookmark"}
                        </button>
                      )}
                      <button
                        onClick={(e) => onToggleCompleted(activeResource.id, e)}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 sm:px-5 sm:py-2.5 text-[13px] font-medium text-gray-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                      >
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${activeResource.completed ? "text-emerald-500" : "text-gray-500"}`} />
                        {activeResource.completed ? "Completed" : "Mark as Completed"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex flex-1 flex-col border-t border-white/[0.06] pt-8">
                  <h3 className="mb-6 text-lg font-semibold text-white">
                    Resource Content Preview
                  </h3>
                  <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-gray-950 min-h-[280px] sm:min-h-[400px] p-3 sm:p-6 lg:p-8">
                    <ViewTracker resourceId={activeResource.id} source="inline_view" />
                    <ResourceViewer resource={activeResource} hideHeader={true} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center bg-violet-500/10 text-violet-400 outline outline-1 outline-offset-[-1px] outline-violet-500/20">
                        <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5px]" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                          {getTabLabel()}
                        </h2>
                        <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5 font-medium hidden sm:block">
                          Browse and filter learning materials
                        </p>
                      </div>
                    </div>
                    {canUpload && (
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="hidden xl:flex shrink-0 items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-violet-600"
                      >
                        <Plus className="w-4 h-4" /> Add Resource
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <div className="relative group flex-1 sm:flex-none">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                      <input
                        value={searchDraft}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full sm:w-56 lg:w-64 rounded-lg border border-white/[0.08] bg-white/[0.02] pl-9 pr-4 py-2 text-[13px] text-gray-200 placeholder-gray-500 transition-colors focus:border-violet-500/50 focus:bg-white/[0.04] focus:outline-none"
                        placeholder="Search resources..."
                      />
                    </div>
                    <select
                      value={activeType}
                      onChange={(e) => updateFilters({ tab: activeTab, q: searchDraft, type: e.target.value })}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[13px] font-medium text-gray-200 transition-colors focus:border-violet-500/50 focus:outline-none cursor-pointer bg-gray-950"
                    >
                      {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>

                {pending && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500/50" />
                  </div>
                )}

                {!pending && filteredResources.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-[13px]">No resources found for this filter.</p>
                  </div>
                ) : (
                  <>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 ${pending ? 'opacity-50' : 'opacity-100'}`}>
                      {filteredResources.map((resource) => {
                        const style = getTypeStyle(resource.resource_type);
                        return (
                          <div
                            key={resource.id}
                            onClick={() => setActiveResource(resource)}
                            className={`group flex cursor-pointer flex-col relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all hover:border-white/[0.14] hover:bg-white/[0.04] ${style.hoverBorder}`}
                          >
                            <div className={`absolute top-0 left-0 w-full h-[3px] ${style.borderTop} opacity-80`} />
                            
                            <div className="flex justify-between items-start mb-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.bg} ${style.text} outline outline-1 outline-offset-[-1px] ${style.outline}`}>
                                <style.icon className="w-5 h-5 stroke-[2.5px]" />
                              </div>
                              <div className="flex gap-2 z-10 relative">
                                {resource.is_pinned && <Pin className="w-4 h-4 text-violet-400 fill-violet-500/20" />}
                                <button
                                  onClick={(e) => onToggleBookmark(resource.id, e)}
                                  className="p-1 -m-1 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                  <Star className={`w-4 h-4 ${resource.bookmarked ? "fill-amber-500 text-amber-500 hover:text-amber-400" : ""}`} />
                                </button>
                              </div>
                            </div>

                            <h3 className="mb-1.5 min-h-[40px] pr-2 text-[14px] font-semibold leading-snug text-gray-200 transition-colors group-hover:text-white line-clamp-2">
                              {resource.title}
                            </h3>

                            <p className="mb-5 min-h-[32px] text-xs leading-relaxed text-gray-400 line-clamp-2">
                              {resource.description || `Learning material in the ${resource.category?.name || 'Uncategorized'} category. Click to explore the resource contents.`}
                            </p>

                            <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-4">
                              <div className="flex items-center gap-2">
                                <span className="rounded border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                                  {resource.category?.name || 'Uncategorized'}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-gray-500">
                                {new Date(resource.published_at || resource.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
                        <span className="text-[13px] text-gray-500">
                          Page {page} of {totalPages}
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          <button
                            onClick={() => goPage(page - 1)}
                            disabled={page <= 1 || pending}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-gray-400 transition-colors hover:border-white/[0.14] hover:text-gray-200 disabled:opacity-50"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                              .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                              }, [])
                              .map((p, idx) =>
                                p === '...' ? (
                                  <span key={`ellipsis-${idx}`} className="flex h-8 w-6 items-center justify-center text-[13px] text-gray-600 select-none">…</span>
                                ) : (
                                  <button
                                    key={p}
                                    onClick={() => goPage(p)}
                                    disabled={pending}
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-medium transition-colors
                                      ${page === p ? 'bg-violet-500 text-white' : 'border border-white/[0.08] bg-white/[0.02] text-gray-400 hover:border-white/[0.14] hover:text-gray-200'}`}
                                  >
                                    {p}
                                  </button>
                                )
                              )}
                          </div>
                          <button
                            onClick={() => goPage(page + 1)}
                            disabled={page >= totalPages || pending}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-gray-400 transition-colors hover:border-white/[0.14] hover:text-gray-200 disabled:opacity-50"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Submit Modal */}
      {canUpload && isAddModalOpen && (
        <MemberResourceSubmitModal
          categories={categories}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}

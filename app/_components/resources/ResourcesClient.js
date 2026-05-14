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

const TYPE_OPTIONS = [
  { value: 'All Types', label: 'All Types' },
  { value: 'Videos', label: 'Videos' },
  { value: 'Images', label: 'Images' },
  { value: 'Links', label: 'Links' },
  { value: 'Files', label: 'Files' },
];

const getTypeStyle = (type) => {
  // Map our DB resource_type to the style groups from App.tsx
  let mappedType = 'External Link';
  if (type === 'image') mappedType = 'Image';
  else if (type === 'video' || type === 'youtube') mappedType = 'Video';
  else if (type === 'file') mappedType = 'File';
  else mappedType = 'External Link';

  switch (mappedType) {
    case "Image":
      return {
        outline: "outline-[#A855F7]/20",
        bg: "bg-[#A855F7]/10",
        text: "text-[#A855F7]",
        border: "border-[#A855F7]/20",
        borderTop: "bg-[#A855F7]",
        hoverBorder: "hover:border-[#A855F7]/40",
        icon: ImageIcon,
      };
    case "Video":
      return {
        outline: "outline-rose-500/20",
        bg: "bg-rose-500/10",
        text: "text-rose-500",
        border: "border-rose-500/20",
        borderTop: "bg-rose-500",
        hoverBorder: "hover:border-rose-500/40",
        icon: Youtube,
      };
    case "File":
      return {
        outline: "outline-[#F59E0B]/20",
        bg: "bg-[#F59E0B]/10",
        text: "text-[#F59E0B]",
        border: "border-[#F59E0B]/20",
        borderTop: "bg-[#F59E0B]",
        hoverBorder: "hover:border-[#F59E0B]/40",
        icon: FileText,
      };
    default:
      return {
        outline: "outline-[#3B82F6]/20",
        bg: "bg-[#3B82F6]/10",
        text: "text-[#3B82F6]",
        border: "border-[#3B82F6]/20",
        borderTop: "bg-[#3B82F6]",
        hoverBorder: "hover:border-[#3B82F6]/40",
        icon: Link2,
      };
  }
};

const NavItem = ({ icon: Icon, label, badge, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm
      ${active ? "bg-[#A855F7]/10 text-[#C084FC] font-medium" : "text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#12151C]"}`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${active ? "text-[#C084FC]" : "text-[#64748B]"}`} />
      <span>{label}</span>
    </div>
    {badge !== undefined && badge !== null && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${active ? "bg-[#A855F7]/20 text-[#A855F7]" : "bg-[#1E2330] text-[#94A3B8]"}`}>
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
  basePath,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saved, setSaved] = useState(bookmarkedIds);
  const [completed, setCompleted] = useState([]); // Client-side tracking for completed
  const [activeResource, setActiveResource] = useState(null);
  const [pending, start] = useTransition();
  const [searchDraft, setSearchDraft] = useState(searchParams.get('q') || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const searchTimer = useRef(null);

  const effectiveBasePath = basePath || pathname || '/account';
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const activeTab = searchParams.get('tab') || 'all'; // 'all', 'bookmarks', 'completed', or category id
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
    
    // We map 'tab' to 'categoryId' if it's a UUID (category ID)
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

  // Combine server resources with local state
  const resourcesState = resources.map(r => ({
    ...r,
    bookmarked: saved.includes(r.id),
    completed: completed.includes(r.id)
  }));

  // Client-side filtering for Bookmarks and Completed (since backend doesn't support these via 'type' nicely yet)
  // And for UI Type filtering (Videos, Images, etc)
  const filteredResources = resourcesState.filter(r => {
    if (activeTab === "bookmarks" && !r.bookmarked) return false;
    if (activeTab === "completed" && !r.completed) return false;
    
    // Type filtering logic matching App.tsx
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
    <div className="flex flex-1 min-h-0">
      {/* Secondary Sidebar */}
      <aside className="w-[240px] border-r border-[#1E2330] bg-[#0B0E14] flex flex-col shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="p-4 space-y-1">
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

        <div className="px-5 mt-4 mb-3 flex items-center justify-between">
          <div className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">
            Categories
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="text-[#475569] hover:text-[#F8FAFC]">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-4 space-y-1 pb-6">
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#0B0E14] p-8 relative [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-[1400px] mx-auto space-y-6">
          {activeResource ? (
            <div className="bg-[#12151C] border border-[#1E2330] rounded-xl p-8 shadow-lg shadow-black/20 min-h-[calc(100vh-160px)] flex flex-col">
              <button
                onClick={() => setActiveResource(null)}
                className="self-start flex items-center gap-2 text-sm text-[#64748B] hover:text-[#F8FAFC] transition-colors mb-8"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Resources
              </button>

              <div className="flex items-start gap-6">
                {(() => {
                  const style = getTypeStyle(activeResource.resource_type);
                  return (
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${style.bg} ${style.text} outline outline-1 outline-offset-[-1px] ${style.outline}`}>
                      <style.icon className="w-8 h-8 stroke-[2px]" />
                    </div>
                  );
                })()}
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider bg-[#0B0E14] border border-[#1E2330] px-2 py-1 rounded shadow-sm">
                      {activeResource.category?.name || 'Uncategorized'}
                    </span>
                    <span className="text-xs font-medium text-[#475569]">
                      {new Date(activeResource.published_at || activeResource.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-[#F8FAFC] mb-4">
                    {activeResource.title}
                  </h1>
                  <p className="text-sm text-[#94A3B8] leading-relaxed max-w-3xl mb-8">
                    {activeResource.description || `Learning material in the ${activeResource.category?.name || 'Uncategorized'} category. This is a detailed view of the resource.`}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <a 
                      href={activeResource.embed_url || activeResource.file_url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-[#A855F7] hover:bg-[#9333EA] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                      <ArrowUpRight className="w-4 h-4" /> Open Resource
                    </a>
                    <button
                      onClick={(e) => onToggleBookmark(activeResource.id, e)}
                      className="bg-[#0B0E14] border border-[#1E2330] hover:bg-[#1E2330] text-[#F8FAFC] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Star className={`w-4 h-4 ${activeResource.bookmarked ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#94A3B8]"}`} />
                      {activeResource.bookmarked ? "Bookmarked" : "Bookmark"}
                    </button>
                    <button
                      onClick={(e) => onToggleCompleted(activeResource.id, e)}
                      className="bg-[#0B0E14] border border-[#1E2330] hover:bg-[#1E2330] text-[#F8FAFC] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className={`w-4 h-4 ${activeResource.completed ? "text-[#10B981]" : "text-[#64748B]"}`} />
                      {activeResource.completed ? "Completed" : "Mark as Completed"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-[#1E2330] flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-[#F8FAFC] mb-6">
                  Resource Content Preview
                </h3>
                <div className="bg-[#0B0E14] border border-[#1E2330] rounded-xl flex-1 min-h-[400px] overflow-hidden relative">
                  <ViewTracker resourceId={activeResource.id} source="inline_view" />
                  <ResourceViewer resource={activeResource} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#12151C] border border-[#1E2330] rounded-xl p-6 shadow-lg shadow-black/20 min-h-[calc(100vh-160px)] flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#A855F7]/10 text-[#C084FC] outline outline-1 outline-offset-[-1px] outline-[#A855F7]/20`}>
                    <FolderOpen className="w-6 h-6 stroke-[2.5px]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#F8FAFC] tracking-tight">
                      {getTabLabel()}
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                      Browse and filter learning materials
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] group-focus-within:text-[#A855F7] transition-colors" />
                    <input
                      value={searchDraft}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-48 sm:w-64 bg-[#0B0E14] border border-[#1E2330] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50 transition-all shadow-inner shadow-black/20"
                      placeholder="Search..."
                    />
                  </div>
                  <select
                    value={activeType}
                    onChange={(e) => updateFilters({ tab: activeTab, q: searchDraft, type: e.target.value })}
                    className="bg-[#0B0E14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm font-medium text-[#F8FAFC] focus:outline-none focus:border-[#A855F7]/50 shadow-inner shadow-black/20 cursor-pointer"
                  >
                    {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-[#A855F7] hover:bg-[#9333EA] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-500/20 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" /> Add Resource
                  </button>
                </div>
              </div>

              {pending && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#A855F7]/50" />
                </div>
              )}

              {!pending && filteredResources.length === 0 ? (
                <div className="text-center py-20 text-[#64748B]">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No resources found for this filter.</p>
                </div>
              ) : (
                <>
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 ${pending ? 'opacity-50' : 'opacity-100'}`}>
                    {filteredResources.map((resource) => {
                      const style = getTypeStyle(resource.resource_type);
                      return (
                        <div
                          key={resource.id}
                          onClick={() => setActiveResource(resource)}
                          className={`bg-[#0B0E14] border border-[#1E2330] rounded-xl p-5 ${style.hoverBorder} transition-all cursor-pointer group flex flex-col relative overflow-hidden shadow-md shadow-black/10 hover:shadow-lg hover:-translate-y-0.5 duration-300`}
                        >
                          <div className={`absolute top-0 left-0 w-full h-[3px] ${style.borderTop} opacity-80`} />
                          
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.bg} ${style.text} outline outline-1 outline-offset-[-1px] ${style.outline}`}>
                              <style.icon className="w-5 h-5 stroke-[2.5px]" />
                            </div>
                            <div className="flex gap-2 z-10 relative">
                              {resource.is_pinned && <Pin className="w-4 h-4 text-[#A855F7] fill-[#A855F7]/20" />}
                              <button
                                onClick={(e) => onToggleBookmark(resource.id, e)}
                                className="p-1 -m-1"
                              >
                                <Star className={`w-4 h-4 transition-colors ${resource.bookmarked ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#475569] hover:text-[#94A3B8]"}`} />
                              </button>
                            </div>
                          </div>

                          <h3 className="font-semibold text-[#F8FAFC] text-sm leading-snug mb-1.5 group-hover:text-white transition-colors pr-2 line-clamp-2 min-h-[40px]">
                            {resource.title}
                          </h3>

                          <p className="text-xs text-[#64748B] line-clamp-2 mb-5 leading-relaxed min-h-[32px]">
                            {resource.description || `Learning material in the ${resource.category?.name || 'Uncategorized'} category. Click to explore the resource contents.`}
                          </p>

                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#1E2330]">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] uppercase font-bold text-[#64748B] tracking-wider bg-[#12151C] border border-[#1E2330] px-1.5 py-0.5 rounded shadow-sm shadow-black/10">
                                {resource.category?.name || 'Uncategorized'}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-[#475569]">
                              {new Date(resource.published_at || resource.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination logic */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between border-t border-[#1E2330] pt-6">
                      <span className="text-sm text-[#64748B]">
                        Showing page {page} of {totalPages}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => goPage(page - 1)} 
                          disabled={page <= 1 || pending}
                          className="p-2 rounded-lg bg-[#0B0E14] border border-[#1E2330] text-[#94A3B8] disabled:opacity-50 hover:text-white transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => goPage(p)}
                              disabled={pending}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors
                                ${page === p ? 'bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/20' : 'text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E2330]'}`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={() => goPage(page + 1)} 
                          disabled={page >= totalPages || pending}
                          className="p-2 rounded-lg bg-[#0B0E14] border border-[#1E2330] text-[#94A3B8] disabled:opacity-50 hover:text-white transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
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

      {/* Submit Modal */}
      {isAddModalOpen && (
        <MemberResourceSubmitModal
          categories={categories}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}

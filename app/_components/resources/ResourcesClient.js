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
  ChevronDown,
  Check,
  Youtube,
  Image as ImageIcon,
  Link2,
  FileText,
  Hash,
  Plus,
  List,
  Loader2,
  Edit3,
  Trash2,
  Heart,
  Eye,
} from "lucide-react";
import { toggleResourceBookmarkAction, toggleResourceCompletedAction, toggleResourceLoveAction, getResourceCommentsAction } from '@/app/_lib/member-resources-actions';
import ResourceComments from '@/app/_components/resources/ResourceComments';
import { deleteResourceAction } from '@/app/_lib/resource-actions';
import { deleteMemberResourceAction } from '@/app/_lib/member-resource-submit-action';
import ResourceViewer from '@/app/_components/resources/ResourceViewer';
import ViewTracker from '@/app/_components/resources/ViewTracker';
import toast from 'react-hot-toast';
import ResourceFormPanel from '@/app/account/admin/resources/_components/ResourceFormPanel';
import EventContentRenderer from '@/app/account/_components/events/EventContentRenderer';
import Link from 'next/link';
import { BookOpen, Map as MapIcon } from 'lucide-react';
import { driveImageUrl, getInitials } from '@/app/_lib/utils';
import { safeExternalHref } from '@/app/_lib/resources/embed-utils';


// Shared premium dashboard primitives
import {
  PageShell,
  PageHeader,
  GlassCard,
  Pill,
  TabBar,
  ActionButton,
  StaggerList,
} from '@/app/account/_components/ui/dashboard';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const getTypeGradient = (type) => {
  let color = 'rgba(59, 130, 246, 0.08)'; // Blue default
  if (type === 'image') color = 'rgba(139, 92, 246, 0.08)'; // Violet
  else if (type === 'video' || type === 'youtube') color = 'rgba(244, 63, 94, 0.08)'; // Rose
  else if (type === 'file') color = 'rgba(245, 158, 11, 0.08)'; // Amber

  return {
    backgroundImage: `linear-gradient(to bottom, rgba(8, 11, 17, 0.85), rgba(8, 11, 17, 0.98)), radial-gradient(circle at top right, ${color}, transparent 50%)`,
  };
};

const getFallbackThumbnailStyle = (resource) => {
  // If thumbnail exists, use it
  if (resource.thumbnail) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(8, 11, 17, 0.65), rgba(8, 11, 17, 0.95)), url(${driveImageUrl(resource.thumbnail)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  const url = resource.embed_url || resource.file_url;
  
  // If no URL at all, return default gradient based on type
  if (!url) {
    return getTypeGradient(resource.resource_type);
  }

  // 1. YouTube
  const ytId = getYoutubeId(url);
  if (ytId) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(8, 11, 17, 0.65), rgba(8, 11, 17, 0.95)), url(https://img.youtube.com/vi/${ytId}/mqdefault.jpg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  // 2. Direct Images / Google Drive images
  if (resource.resource_type === 'image' || /\.(jpeg|jpg|gif|png|webp|svg)/i.test(url)) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(8, 11, 17, 0.65), rgba(8, 11, 17, 0.95)), url(${driveImageUrl(url)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  // 3. GitHub / Code sources
  if (url.includes('github.com') || url.includes('gitlab.com') || url.includes('codesandbox.io')) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(8, 11, 17, 0.85), rgba(8, 11, 17, 0.98)), radial-gradient(circle at top right, rgba(99, 102, 241, 0.12), transparent 60%)`,
      backgroundSize: 'cover',
    };
  }

  // 4. Figma / Design sources
  if (url.includes('figma.com') || url.includes('dribbble.com') || url.includes('behance.net')) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(8, 11, 17, 0.85), rgba(8, 11, 17, 0.98)), radial-gradient(circle at top right, rgba(236, 72, 153, 0.12), transparent 60%)`,
      backgroundSize: 'cover',
    };
  }

  // 5. Google Docs / Slides / Sheets / Drive files
  if (url.includes('docs.google.com') || url.includes('drive.google.com')) {
    let glow = 'rgba(59, 130, 246, 0.12)'; // Blue for generic Drive/Doc
    if (url.includes('presentation') || url.includes('slides')) glow = 'rgba(245, 158, 11, 0.12)'; // Amber/yellow for slides
    if (url.includes('spreadsheets') || url.includes('sheets')) glow = 'rgba(16, 185, 129, 0.12)'; // Emerald/green for sheets
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(8, 11, 17, 0.85), rgba(8, 11, 17, 0.98)), radial-gradient(circle at top right, ${glow}, transparent 60%)`,
      backgroundSize: 'cover',
    };
  }

  // 6. Medium / Blogs / Articles
  if (url.includes('medium.com') || url.includes('dev.to') || url.includes('hashnode.com')) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(8, 11, 17, 0.85), rgba(8, 11, 17, 0.98)), radial-gradient(circle at top right, rgba(167, 139, 250, 0.12), transparent 60%)`,
      backgroundSize: 'cover',
    };
  }

  // 7. General Fallback based on type styles
  return getTypeGradient(resource.resource_type);
};

const TYPE_OPTIONS = [
  { value: 'All Types', label: 'All Types' },
  { value: 'Videos', label: 'Videos' },
  { value: 'Images', label: 'Images' },
  { value: 'Links', label: 'Links' },
  { value: 'Files', label: 'Files' },
];

function TypeFilterMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const selected = TYPE_OPTIONS.find(opt => opt.value === value) || TYPE_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all min-w-[140px] justify-between shadow-sm',
          open
            ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
            : 'bg-white/[0.02] border-white/[0.08] text-gray-300 hover:text-white hover:border-white/15 hover:bg-white/[0.04]'
        )}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform text-gray-500', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-[100] min-w-[160px] bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl py-1 backdrop-blur-xl"
        >
          {TYPE_OPTIONS.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors text-left',
                  active ? 'text-violet-400 bg-violet-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <span className="truncate">{opt.label}</span>
                {active && <Check className="w-3.5 h-3.5 shrink-0 text-violet-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

const GLOW_MAP = {
  image: 'from-violet-500/5 to-purple-500/5',
  video: 'from-rose-500/5 to-pink-500/5',
  youtube: 'from-rose-500/5 to-pink-500/5',
  file: 'from-amber-500/5 to-orange-500/5',
  external_link: 'from-blue-500/5 to-cyan-500/5',
  facebook_post: 'from-blue-500/5 to-cyan-500/5',
  linkedin_post: 'from-blue-500/5 to-cyan-500/5',
};

function hasRealContent(c) {
  if (c === null || c === undefined) return false;
  
  // If it's a string
  if (typeof c === 'string') {
    const trimmed = c.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '[]' || trimmed === '{}') return false;
    
    // Strip HTML tags and see if there is any visible text
    const textOnly = trimmed.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    if (!textOnly) return false;
    
    // If it looks like serialized JSON array or object, parse and check recursively
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return hasRealContent(parsed);
      } catch (e) {
        // Fall back to treating it as plain text since it contains non-HTML content
        return true;
      }
    }
    return true;
  }
  
  // If it's an array (editor blocks)
  if (Array.isArray(c)) {
    if (c.length === 0) return false;
    // Check if any block has real non-empty content
    return c.some(block => {
      if (!block) return false;
      if (typeof block === 'string') return hasRealContent(block);
      if (typeof block === 'object') {
        // Handle Editor.js or draft-js styles of blocks
        const text = block.data?.text || block.data?.content || '';
        if (typeof text === 'string' && text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0) return true;
        // Check array items (e.g. lists)
        if (Array.isArray(block.data?.items) && block.data.items.some(item => String(item).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0)) return true;
        // Check custom codes or custom media components
        if (block.type === 'code' && block.data?.code) return true;
        if (block.type === 'image' && block.data?.file?.url) return true;
      }
      return false;
    });
  }
  
  // If it's an object
  if (typeof c === 'object') {
    if (c.blocks && Array.isArray(c.blocks)) {
      return hasRealContent(c.blocks);
    }
    return Object.keys(c).length > 0;
  }
  
  return false;
}

export default function ResourcesClient({
  resources = [],
  categories = [],
  page = 1,
  total = 0,
  pageSize = 12,
  bookmarkedIds = [],
  completedIds = [],
  lovedIds = [],
  bookmarkTotal = 0,
  completedTotal = 0,
  submissionTotal = 0,
  canBookmark = false,
  canUpload = true,
  submitVariant = 'admin',
  basePath,
  blogsHref = '/blogs',
  roadmapsHref = '/roadmaps',
  blogCount = 0,
  roadmapCount = 0,
  userId = null,
  currentUser = null,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saved, setSaved] = useState(bookmarkedIds);
  const [completed, setCompleted] = useState(completedIds);
  const [loved, setLoved] = useState(lovedIds);
  const [activeResource, setActiveResource] = useState(null);
  const [pending, start] = useTransition();
  const [searchDraft, setSearchDraft] = useState(searchParams.get('q') || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const searchTimer = useRef(null);

  useEffect(() => { setSaved(bookmarkedIds); }, [bookmarkedIds]);
  useEffect(() => { setCompleted(completedIds); }, [completedIds]);
  useEffect(() => { setLoved(lovedIds); }, [lovedIds]);

  // Comments state — loaded dynamically when a resource slide-over opens
  const [resourceComments, setResourceComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  useEffect(() => {
    if (!activeResource?.id) {
      setResourceComments([]);
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    getResourceCommentsAction(activeResource.id).then((data) => {
      if (!cancelled) {
        setResourceComments(data || []);
        setCommentsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [activeResource?.id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this resource?')) {
      return;
    }
    
    try {
      let result;
      if (submitVariant === 'admin') {
        const fd = new FormData();
        fd.set('id', id);
        result = await deleteResourceAction(fd);
      } else {
        result = await deleteMemberResourceAction(id);
      }

      if (result?.error) {
        alert(result.error);
        return;
      }

      setActiveResource(null);
      router.refresh();
    } catch (err) {
      alert(err.message || 'Failed to delete resource.');
    }
  };

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
      
      // Update activeResource bookmark state dynamically if it is the currently viewed resource
      setActiveResource((current) => {
        if (current && current.id === resourceId) {
          return { ...current, bookmarked: result.bookmarked };
        }
        return current;
      });
    });
  }, [canBookmark, router]);

  const onToggleCompleted = useCallback((resourceId, e) => {
    if (e) e.stopPropagation();
    if (!canBookmark) { router.push('/login'); return; }
    start(async () => {
      const result = await toggleResourceCompletedAction(resourceId);
      if (result?.error) return;
      setCompleted((prev) =>
        result.completed
          ? [...new Set([...prev, resourceId])]
          : prev.filter((id) => id !== resourceId)
      );
      setActiveResource((current) => {
        if (current && current.id === resourceId) {
          return { ...current, completed: result.completed };
        }
        return current;
      });
    });
  }, [canBookmark, router]);

  const onToggleLove = useCallback((resourceId, e) => {
    if (e) e.stopPropagation();
    if (!userId) { router.push('/login'); return; }
    start(async () => {
      const result = await toggleResourceLoveAction(resourceId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setLoved((prev) =>
        result.loved
          ? [...new Set([...prev, resourceId])]
          : prev.filter((id) => id !== resourceId)
      );
      setActiveResource((current) => {
        if (current && current.id === resourceId) {
          return {
            ...current,
            loved: result.loved,
            upvotes: result.newCount,
          };
        }
        return current;
      });
      toast.success(result.loved ? 'Loved resource!' : 'Removed love');
    });
  }, [userId, router]);

  const handleTabChange = useCallback((tabId) => {
    setActiveResource(null);
    updateFilters({ tab: tabId, type: activeType, q: searchDraft });
  }, [activeType, searchDraft, updateFilters]);

  const filteredResources = resources.map((r) => ({
    ...r,
    bookmarked: saved.includes(r.id),
    completed: completed.includes(r.id),
    loved: loved.includes(r.id),
  }));

  // "All Resources" count = total for the current tab when tab is 'all';
  // otherwise use the all-tab count derived from totals we know about.
  const allTabCount = activeTab === 'all' ? total : undefined;

  const uiTabs = useMemo(() => {
    const list = [
      { value: 'all', label: 'All Resources', icon: List, count: allTabCount },
      { value: 'bookmarks', label: 'Bookmarks', icon: Star, count: bookmarkTotal },
      { value: 'completed', label: 'Completed', icon: CheckCircle2, count: completedTotal },
    ];

    if (userId) {
      list.push({ value: 'my_submissions', label: 'My Submissions', icon: FolderOpen, count: submissionTotal });
    }

    list.push(...categories.map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: Hash,
      count: cat.resource_count ?? undefined,
    })));

    return list;
  }, [allTabCount, bookmarkTotal, completedTotal, submissionTotal, categories, userId]);

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <PageHeader
        icon={FolderOpen}
        title="Learning Resources"
        subtitle="Browse and filter handpicked learning materials, guides, and docs"
        accent="violet"
        actions={
          canUpload && (
            <ActionButton
              tone="primary"
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
            >
              {submitVariant === 'member' ? 'Submit Resource' : 'Add Resource'}
            </ActionButton>
          )
        }
      />

      <TabBar tabs={uiTabs} value={activeTab} onChange={handleTabChange} />

      {(blogCount > 0 || roadmapCount > 0) && !activeResource && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <Link
            href={blogsHref}
            className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-all hover:border-violet-500/30 hover:bg-violet-500/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-200 group-hover:text-white">Blogs</div>
              <div className="text-[11px] text-gray-500">{blogCount} published article{blogCount === 1 ? '' : 's'}</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-violet-300" />
          </Link>
          <Link
            href={roadmapsHref}
            className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <MapIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-200 group-hover:text-white">Roadmaps</div>
              <div className="text-[11px] text-gray-500">{roadmapCount} learning path{roadmapCount === 1 ? '' : 's'}</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-emerald-300" />
          </Link>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeResource ? `resource-${activeResource.id}` : `tab-${activeTab}`}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full space-y-6 mt-6"
        >
          {activeResource ? (
            /* ── Active Resource Detail View ── */
            <GlassCard className="relative overflow-hidden min-h-[calc(100vh-280px)] p-6 sm:p-8 lg:p-10">
              {/* Type-based ambient backglow */}
              <div className={cn(
                "absolute inset-0 -z-10 bg-gradient-to-br pointer-events-none opacity-40",
                GLOW_MAP[activeResource.resource_type] || 'from-blue-500/5 to-cyan-500/5'
              )} />
              
              <button
                onClick={() => setActiveResource(null)}
                className="mb-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Resources
              </button>

              <div className="flex flex-col lg:flex-row items-start gap-8">
                {(() => {
                  const style = getTypeStyle(activeResource.resource_type);
                  return (
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                      style.bg,
                      style.text,
                      "outline outline-1 outline-offset-[-1px]",
                      style.outline
                    )}>
                      <style.icon className="w-8 h-8 stroke-[2px]" />
                    </div>
                  );
                })()}
                
                <div className="flex-1 min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <Pill tone={
                      activeResource.resource_type === 'image' ? 'violet' :
                      (activeResource.resource_type === 'video' || activeResource.resource_type === 'youtube') ? 'rose' :
                      activeResource.resource_type === 'file' ? 'amber' : 'blue'
                    }>
                      {activeResource.category?.name || 'Uncategorized'}
                    </Pill>
                     <span className="text-xs font-semibold text-gray-500">
                      {new Date(activeResource.published_at || activeResource.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="text-gray-600 font-semibold">·</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-gray-500" title="Unique views">
                      <Eye className="w-3.5 h-3.5 text-gray-600" />
                      {activeResource.uniqueViewsCount || 0} unique views
                    </span>
                    {activeResource.creator && (
                      <>
                        <span className="text-gray-600 font-semibold">·</span>
                        <div className="flex items-center gap-1.5">
                          <div className="relative h-4 w-4 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                            {activeResource.creator.avatar_url ? (
                              <img
                                src={driveImageUrl(activeResource.creator.avatar_url)}
                                alt={activeResource.creator.full_name || 'Creator'}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white/70 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30"
                              style={{ display: activeResource.creator.avatar_url ? 'none' : 'flex' }}
                            >
                              {getInitials(activeResource.creator.full_name || '?')}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-gray-400">
                            {activeResource.creator.full_name || 'Unknown'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <h1 className="mb-4 text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {activeResource.title}
                  </h1>
                  <p className="mb-8 max-w-4xl text-sm leading-relaxed text-gray-400 font-medium">
                    {activeResource.description || `Learning material in the ${activeResource.category?.name || 'Uncategorized'} category. This is a detailed view of the resource.`}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <ActionButton
                      tone="primary"
                      icon={ArrowUpRight}
                      href={safeExternalHref(activeResource.embed_url || activeResource.file_url) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Resource
                    </ActionButton>
                    {canBookmark && (
                      <>
                        <ActionButton
                          tone="ghost"
                          icon={Heart}
                          className={cn(
                            activeResource.loved && "text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                          )}
                          onClick={(e) => onToggleLove(activeResource.id, e)}
                        >
                          {activeResource.loved ? `Loved (${activeResource.upvotes || 0})` : `Love (${activeResource.upvotes || 0})`}
                        </ActionButton>
                        <ActionButton
                          tone="ghost"
                          icon={Star}
                          className={cn(
                            activeResource.bookmarked && "text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                          )}
                          onClick={(e) => onToggleBookmark(activeResource.id, e)}
                        >
                          {activeResource.bookmarked ? "Bookmarked" : "Bookmark"}
                        </ActionButton>
                      </>
                    )}
                    <ActionButton
                      tone="ghost"
                      icon={CheckCircle2}
                      className={cn(
                        activeResource.completed && "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                      )}
                      onClick={(e) => onToggleCompleted(activeResource.id, e)}
                    >
                      {activeResource.completed ? "Completed" : "Mark as Completed"}
                    </ActionButton>
                    {(submitVariant === 'admin' || (userId && activeResource.created_by === userId)) && (
                      <>
                        <ActionButton
                          tone="ghost"
                          icon={Edit3}
                          onClick={() => setEditingResource(activeResource)}
                          className="text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                        >
                          Edit
                        </ActionButton>
                        <ActionButton
                          tone="ghost"
                          icon={Trash2}
                          onClick={() => handleDelete(activeResource.id)}
                          className="text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                        >
                          Delete
                        </ActionButton>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Main Media Preview / Embed (only for non-rich-text types) ── */}
              {(() => {
                const r = activeResource;
                const isRichText = r.resource_type === 'rich_text';
                const hasEmbedSource = Boolean(
                  (r.embed_url && r.embed_url.trim().length > 0 && r.embed_url !== 'null') ||
                  (r.file_url && r.file_url.trim().length > 0 && r.file_url !== 'null')
                );
                const c = r.content;
                const hasContent = hasRealContent(c);

                // For rich_text, the "preview" IS the content (ResourceEmbed renders it).
                // Skip the separate Content section in that case to avoid duplication.
                const showPreview = isRichText ? hasContent : hasEmbedSource;
                const showContent = !isRichText && hasContent;

                return (
                  <>
                    {showPreview && (() => {
                      // All 'file' subtypes (pdf, txt, image, audio, video, office docs) and 'rich_text'
                      // have their own premium layout — skip the padded inner bg-gray-950 box so they
                      // render at full width/height without clipping.
                      const isFileType = r.resource_type === 'file';
                      const noInnerBox = isFileType || isRichText;

                      return (
                        <div className="mt-12 flex flex-1 flex-col border-t border-white/[0.06] pt-8">
                          <h3 className="mb-6 text-xs font-bold tracking-wider uppercase text-gray-400">
                            {isRichText ? 'Resource Content' : 'Resource Content Preview'}
                          </h3>
                          <ViewTracker resourceId={r.id} source="inline_view" />
                          {noInnerBox ? (
                            /* File and Rich Text types render their own chrome — no extra box */
                            <ResourceViewer resource={r} hideHeader={true} />
                          ) : (
                            <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-gray-950 min-h-[300px] sm:min-h-[480px] p-3 sm:p-6 lg:p-8 shadow-inner">
                              <ResourceViewer resource={r} hideHeader={true} />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {showContent && (
                      <div className="mt-12 border-t border-white/[0.06] pt-8">
                        <h3 className="mb-6 text-xs font-bold tracking-wider uppercase text-gray-400">
                          Resource Content
                        </h3>
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 sm:p-8 lg:p-10">
                          <EventContentRenderer content={c} />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* ── Comments Section ── */}
              <div className="px-1">
                {commentsLoading ? (
                  <div className="mt-12 flex items-center justify-center gap-2 border-t border-white/[0.08] pt-10">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    <span className="text-xs text-gray-600">Loading discussion…</span>
                  </div>
                ) : (
                  <ResourceComments
                    resourceId={activeResource?.id}
                    initialComments={resourceComments}
                    currentUser={currentUser}
                  />
                )}
              </div>
            </GlassCard>
          ) : (
            /* ── Grid + Filters View ── */
            <div className="flex flex-col space-y-6">


              {/* Search & Select Panel */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md group">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                  <input
                    value={searchDraft}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 transition-all focus:border-violet-500/40 focus:bg-white/[0.04] focus:outline-none"
                    placeholder="Search resources..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-gray-500">Filter By:</span>
                  <TypeFilterMenu
                    value={activeType}
                    onChange={(val) => updateFilters({ tab: activeTab, q: searchDraft, type: val })}
                  />
                </div>
              </div>

              {pending && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500/50" />
                </div>
              )}

              {!pending && filteredResources.length === 0 ? (
                <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
                  <Search className="w-12 h-12 text-gray-600 mb-4 opacity-30" />
                  <p className="font-semibold text-gray-400 text-sm">No resources found matching this criteria.</p>
                  <p className="text-xs text-gray-500 mt-1">Try resetting your filters or adjusting your search term.</p>
                </GlassCard>
              ) : (
                <>
                  {/* Staggered dynamic grid list */}
                  <div className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-300",
                    pending ? 'opacity-50' : 'opacity-100'
                  )}>
                    <StaggerList delay={0.02}>
                      {filteredResources.map((resource) => {
                        const style = getTypeStyle(resource.resource_type);
                        const glowColor = style.text.includes('rose') ? 'shadow-rose-500/5 hover:shadow-rose-500/10' :
                                          style.text.includes('violet') ? 'shadow-violet-500/5 hover:shadow-violet-500/10' :
                                          style.text.includes('amber') ? 'shadow-amber-500/5 hover:shadow-amber-500/10' :
                                          'shadow-blue-500/5 hover:shadow-blue-500/10';
                        
                        return (
                          <div
                            key={resource.id}
                            onClick={() => setActiveResource(resource)}
                            className={cn(
                              "group flex cursor-pointer flex-col relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all hover:border-white/[0.14] hover:bg-white/[0.04]",
                              glowColor
                            )}
                             style={getFallbackThumbnailStyle(resource)}
                          >
                            {/* Accent indicator line */}
                            <div className={cn("absolute top-0 left-0 w-full h-[3px] opacity-80", style.borderTop)} />
                            
                            <div className="flex justify-between items-start mb-5">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-md",
                                style.bg,
                                style.text,
                                "outline outline-1 outline-offset-[-1px]",
                                style.outline
                              )}>
                                <style.icon className="w-5 h-5 stroke-[2px]" />
                              </div>
                              <div className="flex items-center gap-2.5 z-10 relative">
                                {resource.status === 'draft' && (
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                                    Draft
                                  </span>
                                )}
                                {resource.is_pinned && (
                                  <Pin className="w-4 h-4 text-violet-400 fill-violet-500/20" />
                                )}
                                {(submitVariant === 'admin' || (userId && resource.created_by === userId)) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingResource(resource);
                                    }}
                                    className="p-1 -m-1 text-gray-500 hover:text-amber-400 transition-colors"
                                    title="Edit Resource"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => onToggleLove(resource.id, e)}
                                  className="p-1 -m-1 text-gray-500 hover:text-rose-400 transition-colors flex items-center gap-1 z-20 relative"
                                  aria-label="Love"
                                  title="Love Resource"
                                >
                                  <Heart className={cn("w-4 h-4 transition-transform group-hover:scale-110", resource.loved ? "fill-rose-500 text-rose-500" : "text-gray-500 hover:text-rose-400")} />
                                  {resource.upvotes > 0 && (
                                    <span className="text-[10px] font-bold text-gray-400">{resource.upvotes}</span>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => onToggleBookmark(resource.id, e)}
                                  className="p-1 -m-1 text-gray-500 hover:text-gray-300 transition-colors z-20 relative"
                                  aria-label="Bookmark"
                                >
                                  <Star className={cn("w-4 h-4 transition-transform group-hover:scale-110", resource.bookmarked ? "fill-amber-500 text-amber-500 hover:text-amber-400" : "")} />
                                </button>
                              </div>
                            </div>

                            <h3 className="mb-2 min-h-[44px] pr-2 text-sm font-semibold leading-snug text-gray-200 transition-colors group-hover:text-white line-clamp-2">
                              {resource.title}
                            </h3>

                            <p className="mb-6 min-h-[32px] text-xs leading-relaxed text-gray-400 line-clamp-2 font-medium">
                              {resource.description || `Learning material in the ${resource.category?.name || 'Uncategorized'} category. Click to explore the resource contents.`}
                            </p>

                            {/* Creator Info */}
                            {resource.creator && (
                              <div className="flex items-center gap-2 mb-4 -mt-2">
                                <div className="relative h-5 w-5 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                  {resource.creator.avatar_url ? (
                                    <img
                                      src={driveImageUrl(resource.creator.avatar_url)}
                                      alt={resource.creator.full_name || 'Creator'}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/70 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30"
                                    style={{ display: resource.creator.avatar_url ? 'none' : 'flex' }}
                                  >
                                    {getInitials(resource.creator.full_name || '?')}
                                  </div>
                                </div>
                                <span className="text-[11px] font-medium text-gray-400 group-hover:text-gray-300 transition-colors truncate">
                                  {resource.creator.full_name || 'Unknown'}
                                </span>
                              </div>
                            )}

                            <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[9.5px] font-bold tracking-wider text-gray-500 uppercase">
                                  {resource.category?.name || 'Uncategorized'}
                                </span>
                                {resource.completed && (
                                  <span className="rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 shadow-sm">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-500">
                                <span className="flex items-center gap-0.5" title="Unique views">
                                  <Eye className="w-3.5 h-3.5 text-gray-600" />
                                  {resource.uniqueViewsCount || 0}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(resource.published_at || resource.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </StaggerList>
                  </div>

                  {/* Pagination Section */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
                      <span className="text-xs font-semibold text-gray-500">
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
                                  className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                                    page === p 
                                      ? 'bg-violet-500 text-white shadow-md shadow-violet-500/10' 
                                      : 'border border-white/[0.08] bg-white/[0.02] text-gray-400 hover:border-white/[0.14] hover:text-gray-200'
                                  )}
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
        </motion.div>
      </AnimatePresence>

      {/* Create / Submit Resource Modal — full-screen block editor for both
          admins and members. For members, submissions go through the review
          queue (draft status) via submitMemberFullResourceAction. */}
      {canUpload && isAddModalOpen && (
        <ResourceFormPanel
          mode="create"
          resource={null}
          categories={categories}
          submitAsMember={submitVariant === 'member'}
          onClose={() => setIsAddModalOpen(false)}
          onSaved={() => {
            setIsAddModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {editingResource && (
        <ResourceFormPanel
          mode="edit"
          resource={editingResource}
          categories={categories}
          submitAsMember={submitVariant === 'member'}
          onClose={() => setEditingResource(null)}
          onSaved={() => {
            setEditingResource(null);
            router.refresh();
          }}
        />
      )}
    </PageShell>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  normalizeEmbed,
  safeExternalHref,
} from '@/app/_lib/resources/embed-utils';
import { FileDown, Download, ExternalLink, Loader2, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Minimize2, AlertCircle, FileSearch, Hash } from 'lucide-react';
import EventContentRenderer from '@/app/account/_components/events/EventContentRenderer';

// ─── File helpers ─────────────────────────────────────────────────────────────

function getFileExtension(url) {
  if (!url) return '';
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    return ext && ext.length <= 6 ? ext : '';
  } catch {
    return '';
  }
}

function getFileName(url) {
  if (!url) return 'file';
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1]) || 'file';
  } catch {
    return 'file';
  }
}

const FILE_TYPE_INFO = {
  pdf: {
    label: 'PDF Document',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  doc: {
    label: 'Word Document',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  docx: {
    label: 'Word Document',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  ppt: {
    label: 'Presentation',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  pptx: {
    label: 'Presentation',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  txt: {
    label: 'Text File',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
  },
  zip: {
    label: 'ZIP Archive',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
};

const DEFAULT_FILE_INFO = {
  label: 'File',
  color: 'text-gray-400',
  bg: 'bg-gray-500/10',
  border: 'border-gray-500/20',
};

function getFileTypeKey(resource, fileUrl) {
  const ext = getFileExtension(fileUrl);
  if (ext) return ext;

  const mime = String(
    resource?.content?.uploadedMediaMimeType ||
      resource?.content?.mediaMimeType ||
      ''
  ).toLowerCase();

  if (mime === 'application/pdf' || mime === 'application/x-pdf') return 'pdf';
  if (mime === 'application/zip' || mime === 'application/x-zip-compressed')
    return 'zip';
  if (mime === 'text/plain') return 'txt';
  if (mime === 'application/msword') return 'doc';
  if (
    mime ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'docx';
  if (mime === 'application/vnd.ms-powerpoint') return 'ppt';
  if (
    mime ===
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )
    return 'pptx';

  return '';
}

// ─── Social Post Embed Viewer (Unified Premium Component) ───────────────────

const SOCIAL_BRAND_CONFIGS = {
  facebook_post: {
    provider: 'Facebook',
    icon: FacebookIcon,
    accentColor: 'text-[#1877F2]',
    borderColor: 'border-[#1877F2]/20',
    bgColor: 'bg-[#1877F2]/5',
    buttonColor: 'bg-[#1877F2] hover:bg-[#1565C0] shadow-[#1877F2]/25',
    glowColor: 'from-[#1877F2]/10 via-[#1877F2]/5 to-transparent',
    tagColor: 'border-[#1877F2]/20 bg-[#1877F2]/10 text-blue-300',
  },
  linkedin_post: {
    provider: 'LinkedIn',
    icon: LinkedInIcon,
    accentColor: 'text-[#0A66C2]',
    borderColor: 'border-[#0A66C2]/20',
    bgColor: 'bg-[#0A66C2]/5',
    buttonColor: 'bg-[#0A66C2] hover:bg-[#08529C] shadow-[#0A66C2]/25',
    glowColor: 'from-[#0A66C2]/10 via-[#0A66C2]/5 to-transparent',
    tagColor: 'border-[#0A66C2]/20 bg-[#0A66C2]/10 text-sky-300',
  },
};

function SocialPostEmbedViewer({ href, type, title, iframeSrc, minHeight = 350, className = '' }) {
  const [attemptEmbed, setAttemptEmbed] = useState(false);
  const config = SOCIAL_BRAND_CONFIGS[type];
  if (!config) return null;

  const BrandIcon = config.icon;

  if (attemptEmbed && iframeSrc) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-center">
          <div className={`w-full max-w-130 overflow-hidden rounded-2xl border ${config.borderColor} bg-black/40 shadow-2xl`}>
            <iframe
              src={iframeSrc}
              title={title || `${config.provider} post`}
              className="w-full border-0"
              style={{ minHeight }}
              scrolling="no"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              loading="lazy"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-130 mx-auto">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-200 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Open on {config.provider}
          </a>
          <button
            onClick={() => setAttemptEmbed(false)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
          >
            Back to preview card
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border ${config.borderColor} ${config.bgColor} backdrop-blur-md shadow-2xl ${className}`}>
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-12 text-center overflow-hidden">
        {/* Background glow */}
        <div className={`absolute -inset-10 -z-10 bg-gradient-to-br ${config.glowColor} blur-3xl opacity-50`} />
        
        {/* Icon */}
        <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border ${config.borderColor} bg-white/5 ${config.accentColor} shadow-lg`}>
          <BrandIcon className="h-8 w-8" />
        </div>

        {/* Brand Tag */}
        <span className={`mb-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm ${config.tagColor}`}>
          {config.provider} Post
        </span>
        <h3 className="mb-3 max-w-lg text-lg font-bold text-white sm:text-xl leading-snug tracking-tight">
          {title || `View this post on ${config.provider}`}
        </h3>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm justify-center mt-4">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${config.buttonColor}`}
          >
            <BrandIcon className="h-4 w-4 text-white fill-current" />
            Open on {config.provider}
          </a>
          {iframeSrc && (
            <button
              onClick={() => setAttemptEmbed(true)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/3 px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white"
            >
              Try In-line Preview
            </button>
          )}
        </div>

        {/* Security hint */}
        <p className="mt-8 max-w-md text-[10.5px] leading-relaxed text-gray-500 font-medium">
          To protect your privacy, Facebook and LinkedIn posts are best viewed directly on their respective platforms. Click <strong>Open on {config.provider}</strong> to view the full post.
        </p>
      </div>
    </div>
  );
}

// ─── Facebook Post Embed ─────────────────────────────────────────────────────

function FacebookPostEmbed({ embedUrl, title }) {
  const href = safeExternalHref(embedUrl);
  if (!href) return null;

  const pluginUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(href)}&show_text=true&width=500`;

  return (
    <SocialPostEmbedViewer
      href={href}
      type="facebook_post"
      title={title}
      iframeSrc={pluginUrl}
      minHeight={350}
    />
  );
}

// ─── LinkedIn Post Embed ─────────────────────────────────────────────────────

function extractLinkedInPostId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const decodedPath = decodeURIComponent(u.pathname);
    const combined = `${decodedPath}${u.search}`;

    const urnMatch = combined.match(/(urn:li:(?:activity|share|ugcPost):\d+)/);
    if (urnMatch) return urnMatch[1];

    const slugActivityMatch = decodedPath.match(/-activity-(\d{10,})/);
    if (slugActivityMatch) {
      return `urn:li:activity:${slugActivityMatch[1]}`;
    }

    return null;
  } catch {
    return null;
  }
}

function LinkedInPostEmbed({ embedUrl, title }) {
  const href = safeExternalHref(embedUrl);
  if (!href) return null;

  const activityUrn = extractLinkedInPostId(embedUrl);
  const iframeSrc = activityUrn ? `https://www.linkedin.com/embed/feed/update/${activityUrn}` : null;

  return (
    <SocialPostEmbedViewer
      href={href}
      type="linkedin_post"
      title={title}
      iframeSrc={iframeSrc}
      minHeight={400}
    />
  );
}

// ─── SVG brand icons ─────────────────────────────────────────────────────────

function FacebookIcon({ className = 'h-7 w-7' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`text-[#1877F2] ${className}`}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className = 'h-7 w-7' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`text-[#0A66C2] ${className}`}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ─── Text File Reader ─────────────────────────────────────────────────────────

function TextFileReader({ fileUrl, title, className = '' }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Check if it's a Google Drive URL
  const isDrive = fileUrl?.includes('drive.google.com') || fileUrl?.match(/^\/api\/image\//);

  useEffect(() => {
    if (!fileUrl || isDrive) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch text');
        return res.text();
      })
      .then((text) => {
        if (isMounted) {
          setContent(text);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching text file:', err);
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fileUrl, isDrive]);

  // If it's a Drive URL or we encountered a CORS/fetch error, fall back to an iframe
  if (isDrive || error) {
    let embedSrc = fileUrl;
    const driveMatch = fileUrl.match(/^\/api\/image\/([^/?#&]+)/);
    if (driveMatch?.[1]) {
      embedSrc = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    } else if (fileUrl.includes('drive.google.com/file/d/')) {
      const fileIdMatch = fileUrl.match(/file\/d\/([^/?#&]+)/);
      if (fileIdMatch?.[1]) {
        embedSrc = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }

    return (
      <div className="space-y-3">
        <div className={`aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-black md:aspect-[4/3] lg:aspect-[16/10] ${className}`}>
          <iframe
            src={embedSrc}
            title={title || 'Text Document'}
            className="h-full w-full border-0 bg-white"
            loading="lazy"
            allowFullScreen
          />
        </div>
        <div className="flex justify-end">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-gray-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] md:aspect-[4/3] lg:aspect-[16/10] ${className}`}>
        {/* Header bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2">
          <span className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <FileDown className="h-3.5 w-3.5 text-gray-500" />
            {title || 'text_file.txt'}
          </span>
        </div>
        
        {/* Content area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 [scrollbar-width:thin]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/20" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-gray-300 break-words">
              {content}
            </pre>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-gray-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Open in new tab
        </a>
      </div>
    </div>
  );
}

// ─── Image File Viewer ────────────────────────────────────────────────────────

function ImageFileViewer({ fileUrl, title, className = '' }) {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.5, 4));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.5, 0.5));
  const handleReset = () => setScale(1);

  return (
    <div className="space-y-3">
      <div className={`relative flex w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-black/50 ${className}`}>
        
        {/* Floating Toolbar */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 p-1.5 shadow-xl backdrop-blur-md">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="w-[4ch] text-center text-[11px] font-medium text-white/70">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-white/20" />
          <button
            onClick={handleReset}
            disabled={scale === 1}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="Reset Zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Image Container */}
        <div className="flex h-[70vh] min-h-[400px] w-full items-center justify-center overflow-hidden p-4">
          <img
            src={fileUrl}
            alt={title || 'Image file'}
            style={{ 
              transform: `scale(${scale})`, 
              transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)' 
            }}
            className="max-h-full w-auto max-w-full rounded-lg object-contain shadow-2xl origin-center"
            loading="lazy"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200, 250, 300];
const DEFAULT_ZOOM = 100;

function buildPdfSrc(fileUrl, page, zoom) {
  // Append fragment params so the browser's built-in PDF renderer respects them.
  // Chrome / Edge honour #page=N&zoom=N; Firefox uses #page=N.
  return `${fileUrl}#page=${page}&zoom=${zoom}`;
}

function PDFViewer({ fileUrl, title, className = '', downloadUrl = null }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [totalPages, setTotalPages] = useState(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fitWidth, setFitWidth] = useState(false);
  const isDriveEmbed = fileUrl?.includes('drive.google.com');
  // If no separate downloadUrl, fall back to fileUrl
  const effectiveDownloadUrl = downloadUrl || fileUrl;
  // Derive the current iframe src
  const effectiveZoom = fitWidth ? 'FitH' : zoom;
  // Drive embeds don't support hashes
  const iframeSrc = isDriveEmbed ? fileUrl : buildPdfSrc(fileUrl, currentPage, effectiveZoom);

  // Sync page input with current page
  useEffect(() => { setPageInput(String(currentPage)); }, [currentPage]);

  // Fullscreen API
  const [containerEl, setContainerEl] = useState(null);

  const handleFullscreen = () => {
    if (!document.fullscreenElement && containerEl) {
      containerEl.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const zoomIn = () => {
    setFitWidth(false);
    const idx = ZOOM_LEVELS.findLastIndex((z) => z <= zoom);
    const next = ZOOM_LEVELS[Math.min(idx + 1, ZOOM_LEVELS.length - 1)];
    setZoom(next);
  };

  const zoomOut = () => {
    setFitWidth(false);
    const idx = ZOOM_LEVELS.findIndex((z) => z >= zoom);
    const prev = ZOOM_LEVELS[Math.max(idx - 1, 0)];
    setZoom(prev);
  };

  const resetZoom = () => { setFitWidth(false); setZoom(DEFAULT_ZOOM); };
  const toggleFitWidth = () => setFitWidth((f) => !f);

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => {
    setCurrentPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1));
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInput, 10);
      if (!isNaN(parsed) && parsed >= 1 && (!totalPages || parsed <= totalPages)) {
        setCurrentPage(parsed);
      } else {
        setPageInput(String(currentPage));
      }
    }
  };

  const handlePageInputBlur = () => {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && (!totalPages || parsed <= totalPages)) {
      setCurrentPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const canGoPrev = currentPage > 1;
  const canGoNext = !totalPages || currentPage < totalPages;
  const canZoomOut = !fitWidth && zoom <= ZOOM_LEVELS[0];
  const canZoomIn = !fitWidth && zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

  return (
    <div
      ref={setContainerEl}
      className={`flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-black/40 ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none border-0' : ''} ${className}`}
      style={isFullscreen ? { height: '100vh' } : {}}
    >
      {/* ── Top Toolbar ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-white/[0.06] bg-white/[0.025] px-3 py-2">

        {/* File label */}
        <div className="flex min-w-0 items-center gap-2 mr-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-500/15">
            <FileSearch className="h-3.5 w-3.5 text-red-400" />
          </div>
          <span className="truncate text-[12px] font-medium text-white/60 max-w-[140px] sm:max-w-[220px]">
            {title || 'PDF Document'}
          </span>
          <span className="shrink-0 rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            PDF
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Zoom and Page navigation controls (Only for non-Drive native PDFs) ── */}
        {!isDriveEmbed && (
          <>
            {/* ── Zoom controls ── */}
            <div className="flex items-center gap-0.5 rounded-lg border border-white/8 bg-white/5 p-0.5">
              <button
                onClick={zoomOut}
                disabled={canZoomOut}
                title="Zoom out"
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={toggleFitWidth}
                title={fitWidth ? 'Exit fit-width' : 'Fit to width'}
                className={`h-7 px-2 rounded-md text-[11px] font-semibold tabular-nums transition hover:bg-white/10 ${fitWidth ? 'text-indigo-400' : 'text-white/60 hover:text-white'}`}
              >
                {fitWidth ? 'Fit' : `${zoom}%`}
              </button>

              <button
                onClick={zoomIn}
                disabled={canZoomIn}
                title="Zoom in"
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              <div className="mx-0.5 h-4 w-px bg-white/10" />

              <button
                onClick={resetZoom}
                disabled={!fitWidth && zoom === DEFAULT_ZOOM}
                title="Reset zoom"
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            <div className="mx-1 h-5 w-px bg-white/[0.08]" />

            {/* ── Page navigation ── */}
            <div className="flex items-center gap-0.5 rounded-lg border border-white/8 bg-white/5 p-0.5">
              <button
                onClick={goToPrev}
                disabled={!canGoPrev}
                title="Previous page"
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                <Hash className="h-3 w-3 text-white/30 shrink-0" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={handlePageInputKeyDown}
                  onBlur={handlePageInputBlur}
                  title="Current page"
                  className="w-[3ch] bg-transparent text-center text-[12px] font-semibold text-white/80 outline-none focus:text-white"
                />
                {totalPages && (
                  <span className="text-[11px] text-white/25 select-none">/ {totalPages}</span>
                )}
              </div>

              <button
                onClick={goToNext}
                disabled={!canGoNext}
                title="Next page"
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-1 h-5 w-px bg-white/[0.08]" />
          </>
        )}

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-1">
          <a
            href={effectiveDownloadUrl}
            download
            title="Download PDF"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/8 bg-white/5 text-white/60 transition hover:bg-white/12 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
          </a>

          <a
            href={effectiveDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/8 bg-white/5 text-white/60 transition hover:bg-white/12 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={handleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/8 bg-white/5 text-white/60 transition hover:bg-white/12 hover:text-white"
          >
            {isFullscreen
              ? <Minimize2 className="h-3.5 w-3.5" />
              : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── PDF Frame ── */}
      <div className="relative flex-1 bg-[#1a1a2e]" style={{ minHeight: isFullscreen ? 0 : 'max(700px, 82vh)' }}>
        {/* Loading overlay */}
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d1117]">
            <Loader2 className="h-8 w-8 animate-spin text-red-400/60" />
            <p className="text-[13px] text-white/30">Loading PDF…</p>
          </div>
        )}

        {/* Error state */}
        {iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0d1117] p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/8">
              <AlertCircle className="h-8 w-8 text-red-400/70" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-white/70">Unable to preview this PDF</p>
              <p className="mt-1 text-[12px] text-white/30">The file may be restricted or require a login.</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <a
                href={effectiveDownloadUrl}
                download
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
              <a
                href={effectiveDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </a>
            </div>
          </div>
        )}

        <iframe
          key={fileUrl}
          src={iframeSrc}
          title={title || 'PDF Document'}
          className="h-full w-full border-0"
          style={{ minHeight: isFullscreen ? 'calc(100vh - 49px)' : 'max(700px, 82vh)' }}
          onLoad={() => { setIframeLoaded(true); setIframeError(false); }}
          onError={() => { setIframeLoaded(true); setIframeError(true); }}
          loading="lazy"
          allowFullScreen
        />
      </div>

      {/* ── Bottom bar (direct PDFs only – Drive has its own built-in controls) ── */}
      {!isDriveEmbed && (
        <div className="flex shrink-0 items-center justify-between border-t border-white/[0.05] bg-white/[0.015] px-4 py-2">
          <div className="flex items-center gap-2 text-[11px] text-white/25">
            <span>Use browser controls for advanced navigation</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              disabled={!canGoPrev}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/40 transition hover:bg-white/5 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="text-[11px] font-mono text-white/30">
              Page {currentPage}{totalPages ? ` of ${totalPages}` : ''}
            </span>
            <button
              onClick={goToNext}
              disabled={!canGoNext}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/40 transition hover:bg-white/5 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── External Link Viewer ───────────────────────────────────────────────────

function getDomainName(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.hostname.replace('www.', '');
  } catch {
    return 'External Site';
  }
}

function ExternalLinkViewer({ href, title, description, className = '' }) {
  const [attemptEmbed, setAttemptEmbed] = useState(false);
  const domain = getDomainName(href);

  if (attemptEmbed) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-lg shadow-black/20 md:aspect-video">
          <iframe
            src={href}
            title={title || 'External website'}
            className="absolute inset-0 h-full w-full bg-white"
            loading="lazy"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-200 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </a>
          <button
            onClick={() => setAttemptEmbed(false)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
          >
            Back to preview card
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-md shadow-2xl ${className}`}>
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-12 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute -inset-10 -z-10 bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent blur-3xl opacity-50" />
        
        {/* Icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10">
          <ExternalLink className="h-8 w-8 stroke-[1.75px]" />
        </div>

        {/* Domain and title */}
        <span className="mb-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 shadow-sm">
          {domain}
        </span>
        <h3 className="mb-3 max-w-lg text-lg font-bold text-white sm:text-xl leading-snug tracking-tight">
          {title || 'External Resource'}
        </h3>
        {description && (
          <p className="mb-8 max-w-md text-xs leading-relaxed text-gray-400">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm justify-center">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/25"
          >
            <ExternalLink className="h-4 w-4 stroke-[2.2px]" />
            Open Website
          </a>
          <button
            onClick={() => setAttemptEmbed(true)}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/3 px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white"
          >
            Try In-line Preview
          </button>
        </div>

        {/* Security hint */}
        <p className="mt-8 max-w-md text-[10.5px] leading-relaxed text-gray-500 font-medium">
          To protect your security, some external websites cannot be viewed directly inside this dashboard. Click <strong>Open Website</strong> to safely open it in a new window.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ResourceEmbed({ resource, className = '' }) {
  const type = resource?.resource_type;
  const embedUrl = resource?.embed_url;
  const fileUrl = resource?.file_url;

  // ── Image ──────────────────────────────────────────────
  if (type === 'image') {
    const src = fileUrl || embedUrl;
    if (!src) return null;

    return (
      <ImageFileViewer fileUrl={src} title={resource?.title} className={className} />
    );
  }

  // ── Video ──────────────────────────────────────────────
  if (type === 'video') {
    const src = fileUrl || embedUrl;
    if (!src) return null;

    // Drive-hosted videos are stored as /api/image/{fileId}.
    // The image proxy only handles images, so we use the Drive iframe
    // /preview embed for playback — same pattern as PDF previews.
    const driveMatch = src.match(/^\/api\/image\/([^/?#&]+)/);
    if (driveMatch?.[1]) {
      const driveEmbedSrc = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      return (
        <div
          className={`aspect-video overflow-hidden rounded-xl border border-white/10 bg-black ${className}`}
        >
          <iframe
            src={driveEmbedSrc}
            title={resource?.title || 'Video'}
            className="h-full w-full border-0"
            loading="lazy"
            allow="autoplay"
            allowFullScreen
          />
        </div>
      );
    }

    // Non-Drive video: use the native HTML5 player
    return (
      <div
        className={`overflow-hidden rounded-xl border border-white/10 bg-black ${className}`}
      >
        <video
          src={src}
          controls
          preload="metadata"
          className="w-full"
          style={{ maxHeight: '70vh' }}
        >
          Your browser does not support the video element.
        </video>
      </div>
    );
  }

  // ── Rich Text ──────────────────────────────────────────
  if (type === 'rich_text') {
    return (
      <div className={`w-full ${className}`}>
        <EventContentRenderer content={resource?.content} />
      </div>
    );
  }

  // ── YouTube ────────────────────────────────────────────
  if (type === 'youtube' && embedUrl) {
    const normalized = normalizeEmbed('youtube', embedUrl);
    if (!normalized.ok) return null;

    return (
      <div
        className={`aspect-video overflow-hidden rounded-xl border border-white/10 bg-black shadow-lg shadow-black/30 ${className}`}
      >
        <iframe
          src={normalized.embedUrl}
          title={resource?.title || 'YouTube video'}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  // ── Facebook Post ──────────────────────────────────────
  if (type === 'facebook_post' && embedUrl) {
    return (
      <div className={className}>
        <FacebookPostEmbed embedUrl={embedUrl} title={resource?.title} />
      </div>
    );
  }

  // ── LinkedIn Post ──────────────────────────────────────
  if (type === 'linkedin_post' && embedUrl) {
    return (
      <div className={className}>
        <LinkedInPostEmbed embedUrl={embedUrl} title={resource?.title} />
      </div>
    );
  }

  // ── External Link ──────────────────────────────────────
  if (type === 'external_link' && embedUrl) {
    const href = safeExternalHref(embedUrl);
    if (!href) return null;

    return (
      <ExternalLinkViewer
        href={href}
        title={resource?.title}
        description={resource?.description}
        className={className}
      />
    );
  }

  // ── File ───────────────────────────────────────────────
  if (type === 'file' && fileUrl) {
    const ext = getFileTypeKey(resource, fileUrl);

    // Determine if the file is a PDF before any URL-type branching
    const isPdfFile = ext === 'pdf';

    // 1. Check if it's a Google Drive URL
    let driveId = null;
    const driveMatch = fileUrl.match(/^\/api\/image\/([^/?#&]+)/);
    if (driveMatch?.[1]) {
      driveId = driveMatch[1];
    } else if (fileUrl.includes('drive.google.com/file/d/')) {
      const fileIdMatch = fileUrl.match(/file\/d\/([^/?#&]+)/);
      if (fileIdMatch?.[1]) {
        driveId = fileIdMatch[1];
      }
    }

    // Drive PDFs → use the full PDFViewer with the Drive /preview URL as the
    // iframe src (so the browser renders the PDF) while keeping the original
    // Drive URL available for the download / open-in-new-tab actions.
    if (isPdfFile && driveId) {
      const drivePreviewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
      return (
        <PDFViewer
          fileUrl={drivePreviewUrl}
          downloadUrl={fileUrl}
          title={resource?.title}
          className={className}
        />
      );
    }

    // If it is a non-PDF Drive URL, Drive handles its own previews
    if (driveId) {
      const previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
      return (
        <div className="space-y-3">
          <div className={`aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-black md:aspect-[4/3] lg:aspect-[16/10] ${className}`}>
            <iframe
              src={previewUrl}
              title={resource?.title || 'Google Drive Document'}
              className="h-full w-full border-0 bg-white"
              loading="lazy"
              allowFullScreen
            />
          </div>
          <div className="flex justify-end">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-gray-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </div>
        </div>
      );
    }

    // 2. Handle Text files
    if (ext === 'txt') {
      return (
        <TextFileReader fileUrl={fileUrl} title={resource?.title} className={className} />
      );
    }

    // 3. Handle PDF files
    if (ext === 'pdf') {
      return <PDFViewer fileUrl={fileUrl} title={resource?.title} className={className} />;
    }

    // 4. Handle Images natively with Zoom
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
    if (imageExts.includes(ext)) {
      return (
        <ImageFileViewer fileUrl={fileUrl} title={resource?.title} className={className} />
      );
    }

    // 5. Handle Videos natively
    const videoExts = ['mp4', 'webm', 'ogg', 'mov'];
    if (videoExts.includes(ext)) {
      return (
        <div className="space-y-3">
          <div className={`aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-lg shadow-black/30 ${className}`}>
            <video controls className="h-full w-full object-contain">
              <source src={fileUrl} type={`video/${ext === 'mov' ? 'mp4' : ext}`} />
              Your browser does not support the video element.
            </video>
          </div>
        </div>
      );
    }

    // 6. Handle Audio natively
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a'];
    if (audioExts.includes(ext)) {
      return (
        <div className={`flex flex-col gap-5 rounded-xl border border-white/10 bg-[#0d1117] p-5 shadow-lg ${className}`}>
          <div className="flex items-center gap-3 text-gray-300">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileDown className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-[14px] font-medium text-white">{resource?.title || 'Audio File'}</p>
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{ext} AUDIO</p>
            </div>
          </div>
          <audio controls className="w-full h-10 outline-none">
            <source src={fileUrl} type={`audio/${ext === 'm4a' ? 'mp4' : ext}`} />
            Your browser does not support the audio element.
          </audio>
          <div className="flex justify-end pt-2 border-t border-white/5">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[12px] font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </div>
        </div>
      );
    }

    // 7. Handle Office Documents via Google Docs Viewer
    // (Note: This requires fileUrl to be a public absolute URL)
    const officeExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
    if (officeExts.includes(ext) && fileUrl.startsWith('http')) {
      const gdocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      return (
        <div className="space-y-3">
          <div className={`aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-black md:aspect-[4/3] lg:aspect-[16/10] ${className}`}>
            <iframe
              src={gdocsUrl}
              title={resource?.title || 'Office Document'}
              className="h-full w-full border-0 bg-white"
              loading="lazy"
              allowFullScreen
            />
          </div>
          <div className="flex justify-end">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-gray-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
          </div>
        </div>
      );
    }

    const fileName = getFileName(fileUrl);
    const info = FILE_TYPE_INFO[ext] || {
      ...DEFAULT_FILE_INFO,
      label: ext ? `${ext.toUpperCase()} File` : 'File',
    };

    return (
      <div
        className={`overflow-hidden rounded-2xl border ${info.border} ${info.bg} ${className}`}
      >
        <div className="flex items-center gap-5 p-6">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border ${info.border} bg-white/5`}
          >
            <FileDown className={`h-8 w-8 ${info.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white">
              {fileName}
            </p>
            <p className="mt-1 text-sm text-gray-400">{info.label}</p>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>
    );
  }

  return null;
}

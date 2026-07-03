/**
 * @file Add Platform Section Component
 * @description Modern platform picker with search, categorized view, and glassmorphic aesthetics
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { usePlatformSearch } from './usePlatformSearch';

/**
 * Modal Overlay Component - Backdrop with blur
 */
function ModalOverlay({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
    />
  );
}

/**
 * Modal Dialog Component - Glassmorphic Container with ambient backdrop glows
 */
function ModalDialog({ isOpen, onClose, children, title }) {
  // Freeze background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalOverlay onClose={onClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/80 shadow-2xl backdrop-blur-2xl flex flex-col"
            >
              {/* Background ambient glows */}
              <div className="absolute -top-[10%] -left-[10%] -z-10 h-[50%] w-[50%] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-[10%] -right-[10%] -z-10 h-[50%] w-[50%] rounded-full bg-sky-600/10 blur-[100px] pointer-events-none" />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-zinc-950/40 px-6 py-4 backdrop-blur-md shrink-0">
                {title && (
                  <h3 className="text-base font-bold tracking-tight text-white sm:text-lg">
                    {title}
                  </h3>
                )}
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-400 transition-all hover:bg-white/[0.08] hover:text-white"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Platform Logo - Shows image from platforms file with styled fallback
 */
function PlatformLogo({ config, size = 32 }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const showImage = config?.logo && !imageError;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Fallback initials badge */}
      <div
        className={`absolute inset-0 inline-flex items-center justify-center rounded-xl font-bold shadow-md transition-opacity duration-200 ${config?.bg || 'bg-zinc-800'} ${config?.color || 'text-white'} ${showImage && imageLoaded ? 'opacity-0' : 'opacity-100'}`}
        style={{ fontSize: size * 0.38 }}
      >
        {config?.short || '??'}
      </div>

      {/* Platform logo image */}
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.logo}
          alt={config.name || 'Platform'}
          width={size}
          height={size}
          className={`absolute inset-0 rounded-xl object-contain p-1.5 transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundColor: 'rgba(9, 9, 11, 0.6)' }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}

/**
 * Platform selection item - Premium glass card with micro-animations
 */
function PlatformItem({ platform, config, onClick, disabled }) {
  return (
    <button
      onClick={() => onClick(platform.id)}
      disabled={disabled}
      className="group flex w-full items-center gap-3.5 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3.5 text-left transition-all hover:scale-[1.01] hover:border-white/[0.1] hover:bg-white/[0.04] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <PlatformLogo config={config} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-gray-200 transition-colors group-hover:text-white">
          {config.name}
        </div>
        <div className="truncate text-[11px] text-zinc-500 mt-0.5">
          {platform.description || config.placeholder}
        </div>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-500 transition-all group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 group-hover:text-indigo-400">
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

/**
 * Connect form for entering username with profile card simulator preview
 */
function ConnectForm({
  platformId,
  config,
  onSubmit,
  onCancel,
  isLoading,
  error,
}) {
  const [handle, setHandle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [platformId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Premium Platform Card Preview Simulation */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 p-6 shadow-xl">
        {/* subtle radial lightwash */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <PlatformLogo config={config} size={52} />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white">
                  {config.name}
                </h4>
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                  Live Preview
                </span>
              </div>
              <p className="font-mono text-xs text-zinc-500 mt-1">
                @{handle.trim() || 'handle'}
              </p>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
              </span>
              Pending Sync
            </span>
          </div>
        </div>

        {/* Dummy Stats Row */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-white/[0.05] rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5">
          {[
            { l: 'Rating', v: '—' },
            { l: 'Peak', v: '—' },
            { l: 'Solved', v: '—' },
          ].map((item) => (
            <div key={item.l} className="flex flex-col items-center">
              <span className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {item.l}
              </span>
              <span className="mt-1 font-mono text-sm font-bold text-gray-400">
                {item.v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actual Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (handle.trim()) {
            onSubmit(platformId, handle.trim());
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Account Username / Handle
          </label>
          <input
            ref={inputRef}
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={`e.g. ${config.placeholder || 'username'}`}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/50 px-4 py-3.5 text-sm text-white placeholder-zinc-600 transition-all outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10"
          />

          {config.url && (
            <div className="pt-1.5 flex items-center">
              <a
                href={config.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                Find your handle on the {config.name} website
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[0.08] text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.04] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!handle.trim() || isLoading}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Connect Platform</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

/**
 * Category section - shows first row by default, expandable
 */
function CategorySection({
  category,
  platforms,
  platformConfig,
  onPlatformClick,
  disabled,
}) {
  const [expanded, setExpanded] = useState(false);

  // Show 4 items initially (first two rows on sm screens)
  const initialCount = 4;
  const hasMore = platforms.length > initialCount;
  const visiblePlatforms = expanded
    ? platforms
    : platforms.slice(0, initialCount);
  const remainingCount = platforms.length - initialCount;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01]">
      {/* Category Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{category.icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {category.label}
          </span>
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-gray-400">
            {platforms.length}
          </span>
        </div>
      </div>

      {/* Platform Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visiblePlatforms.map((platform) => (
            <PlatformItem
              key={platform.id}
              platform={platform}
              config={platformConfig[platform.id]}
              onClick={onPlatformClick}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Show More / Less Button */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] py-2.5 text-xs font-medium text-zinc-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.03] hover:text-white"
          >
            {expanded ? (
              <>
                <ChevronDown className="h-4 w-4 rotate-180 transition-transform" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 transition-transform" />
                Show {remainingCount} more platforms
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function PlatformSelectionContent({
  availablePlatforms,
  platformConfig,
  onPlatformClick,
  isConnecting,
}) {
  const { searchQuery, setSearchQuery, groupedPlatforms, hasResults } =
    usePlatformSearch(availablePlatforms, platformConfig);

  const isEmpty = !availablePlatforms || availablePlatforms.length === 0;

  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-dashed border-white/[0.08] py-16 text-center bg-white/[0.01]"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          <Check className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-gray-200">
          All Platforms Connected!
        </p>
        <p className="text-xs text-zinc-500 mt-2 max-w-xs mx-auto">
          You have successfully linked all supported competitive programming accounts.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search Input Container */}
      <div className="sticky top-0 z-10 bg-zinc-950/20 backdrop-blur-sm pb-2">
        <div className="relative group">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-indigo-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search platforms (e.g. Codeforces, LeetCode...)"
            autoFocus
            className="w-full rounded-2xl border border-white/[0.08] bg-zinc-900/40 py-3.5 pr-12 pl-11 text-sm text-white placeholder-zinc-550 transition-all outline-none focus:border-indigo-500/80 focus:bg-zinc-900/60 focus:ring-4 focus:ring-indigo-500/10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-xl p-1.5 text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Sections */}
      {hasResults ? (
        <div className="space-y-4">
          {Object.entries(groupedPlatforms).map(([categoryId, category]) => (
            <CategorySection
              key={categoryId}
              category={category}
              platforms={category.platforms}
              platformConfig={platformConfig}
              onPlatformClick={onPlatformClick}
              disabled={isConnecting}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-white/[0.08] py-16 text-center bg-white/[0.01]"
        >
          <Search className="mx-auto mb-3.5 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-400">
            No platforms match your search
          </p>
          <p className="text-xs text-zinc-600 mt-1 max-w-xs mx-auto">
            Try checking your spelling or search for popular judges like LeetCode or Codeforces.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-xs font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Clear Search Filter
          </button>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Main Add Platform Section with Modal Dialog
 */
export default function AddPlatformSection({
  availablePlatforms,
  platformConfig,
  onConnect,
  isConnecting,
  error,
  isExpanded,
  onToggleExpanded,
  hasConnected,
}) {
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [backStack, setBackStack] = useState([]);

  const handleConnect = async (platformId, handle) => {
    try {
      await onConnect(platformId, handle);
      setConnectingPlatform(null);
      setBackStack([]);
      if (isExpanded) {
        onToggleExpanded();
      }
    } catch {
      // Error handled by parent
    }
  };

  const handlePlatformSelect = (platformId) => {
    setBackStack([...backStack, platformId]);
    setConnectingPlatform(platformId);
  };

  const handleGoBack = () => {
    const newStack = [...backStack];
    newStack.pop();
    setBackStack(newStack);
    setConnectingPlatform(
      newStack.length > 0 ? newStack[newStack.length - 1] : null
    );
  };

  const handleCloseModal = () => {
    setConnectingPlatform(null);
    setBackStack([]);
    if (isExpanded) {
      onToggleExpanded();
    }
  };

  return (
    <div className={hasConnected ? 'border-t border-zinc-800/50 pt-6' : ''}>
      <ModalDialog
        isOpen={isExpanded}
        onClose={handleCloseModal}
        title={
          connectingPlatform
            ? `Connect ${platformConfig[connectingPlatform]?.name}`
            : 'Link Online Judge Account'
        }
      >
        {/* Back Button - Show when selecting a specific platform */}
        {connectingPlatform && (
          <button
            onClick={handleGoBack}
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-xs font-semibold text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Platforms
          </button>
        )}

        {/* Connect Form - Show when platform selected */}
        {connectingPlatform ? (
          <ConnectForm
            platformId={connectingPlatform}
            config={platformConfig[connectingPlatform]}
            onSubmit={handleConnect}
            onCancel={handleGoBack}
            isLoading={isConnecting}
            error={error}
          />
        ) : (
          /* Platform Selection - Show when no platform selected */
          <PlatformSelectionContent
            availablePlatforms={availablePlatforms}
            platformConfig={platformConfig}
            onPlatformClick={handlePlatformSelect}
            isConnecting={isConnecting}
          />
        )}
      </ModalDialog>
    </div>
  );
}

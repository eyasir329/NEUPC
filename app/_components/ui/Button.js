/**
 * @file Reusable Button component with professional click effects.
 * Supports ripple animation, hover shine, loading state, and press feedback.
 *
 * @module Button
 */

'use client';

import { useCallback, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/app/_lib/utils';

// ─── Inline spinner for loading state ─────────────────────────────────────────
function ButtonSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'h-3.5 w-3.5 border-[1.5px]',
    md: 'h-4 w-4 border-2',
    lg: 'h-5 w-5 border-2',
  };
  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent',
        sizes[size]
      )}
      aria-hidden="true"
    />
  );
}

// ─── Variant style maps ───────────────────────────────────────────────────────
const VARIANTS = {
  primary:
    'bg-linear-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-600 hover:to-primary-700 focus-visible:ring-primary-500',
  secondary:
    'border-2 border-white/30 bg-white/10 text-white backdrop-blur-md hover:border-white/50 hover:bg-white/20 focus-visible:ring-white/50',
  gradient:
    'bg-linear-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-600 hover:to-secondary-600 focus-visible:ring-primary-500',
  ghost:
    'text-primary-400 hover:bg-white/10 hover:text-primary-300 focus-visible:ring-primary-500',
  danger:
    'bg-red-600 text-white shadow-lg shadow-red-500/25 hover:bg-red-700 hover:shadow-xl hover:shadow-red-500/40 focus-visible:ring-red-500',
  white:
    'bg-white text-gray-900 shadow-lg hover:bg-gray-100 hover:shadow-xl focus-visible:ring-white',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm gap-1.5 rounded-lg',
  md: 'px-6 py-3 text-sm sm:text-base gap-2 rounded-xl',
  lg: 'px-8 py-3.5 md:px-10 md:py-4 text-base md:text-lg gap-2.5 rounded-xl',
};

/**
 * Professional Button component with ripple effect, hover shine,
 * loading spinner, and scale-on-press feedback.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'gradient'|'ghost'|'danger'|'white'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.loading] — Shows spinner and disables click
 * @param {string} [props.loadingText] — Text to show while loading
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.fullWidth] — w-full
 * @param {string} [props.href] — Renders as Next.js Link
 * @param {React.ReactNode} [props.icon] — Leading icon
 * @param {React.ReactNode} [props.iconRight] — Trailing icon
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 * @param {Function} [props.onClick]
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled = false,
  fullWidth = false,
  href,
  icon,
  iconRight,
  children,
  className,
  onClick,
  type = 'button',
  ...rest
}) {
  const btnRef = useRef(null);

  // ── Ripple effect on click ──────────────────────────────────────────────
  const handleRipple = useCallback((e) => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.cssText = `
      position:absolute; left:${x}px; top:${y}px;
      width:${size}px; height:${size}px;
      transform:translate(-50%,-50%) scale(0);
    `;
    btn.appendChild(ripple);

    // Trigger animation
    requestAnimationFrame(() => {
      ripple.style.transform = 'translate(-50%,-50%) scale(1)';
      ripple.style.opacity = '0';
    });

    setTimeout(() => ripple.remove(), 600);
  }, []);

  const handleClick = useCallback(
    (e) => {
      if (loading || disabled) return;
      handleRipple(e);
      onClick?.(e);
    },
    [loading, disabled, handleRipple, onClick]
  );

  // ── Shared classes ──────────────────────────────────────────────────────
  const classes = cn(
    // Base
    'relative inline-flex items-center justify-center font-semibold overflow-hidden',
    'transition-all duration-300 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
    // Press effect
    'active:scale-[0.97]',
    // Variant + size
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    (disabled || loading) && 'pointer-events-none opacity-60',
    className
  );

  // ── Content ─────────────────────────────────────────────────────────────
  const content = (
    <>
      {/* Hover shine overlay */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        aria-hidden="true"
      />

      {/* Button content */}
      <span className="relative z-10 inline-flex items-center gap-2">
        {loading ? (
          <>
            <ButtonSpinner size={size} />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {icon && (
              <span className="shrink-0 transition-transform duration-300">
                {icon}
              </span>
            )}
            <span>{children}</span>
            {iconRight && (
              <span className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5">
                {iconRight}
              </span>
            )}
          </>
        )}
      </span>
    </>
  );

  // ── Link variant ────────────────────────────────────────────────────────
  if (href && !loading && !disabled) {
    return (
      <Link href={href} className={cn(classes, 'group')} {...rest}>
        {content}
      </Link>
    );
  }

  // ── Button variant ──────────────────────────────────────────────────────
  return (
    <button
      ref={btnRef}
      type={type}
      className={cn(classes, 'group')}
      disabled={disabled || loading}
      onClick={handleClick}
      {...rest}
    >
      {content}
    </button>
  );
}

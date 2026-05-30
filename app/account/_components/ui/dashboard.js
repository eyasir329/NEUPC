/**
 * @file Shared dashboard primitives used across role panels (member,
 *   advisor, executive). Dark-glass cards, tinted icon chips, gradient
 *   bars, motion entrance, lucide icons.
 *
 * Tokens:
 *   surface:  border-white/[0.06] bg-white/[0.02]
 *   hover:    border-white/[0.1]  bg-white/[0.04]
 *   text:     text-gray-400 (label) / text-white (value) / text-gray-500 (sub)
 *   radius:   rounded-xl (cards) / rounded-lg (chips) / rounded-full (pills)
 *   accent:   bg-{c}-500/10  border-{c}-500/20  text-{c}-400
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

// ---------- Page shell ----------
export function PageShell({ children, className = '' }) {
  return (
    <div
      className={`mx-auto w-full max-w-[1600px] space-y-6 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 lg:px-8 xl:px-10 2xl:px-12 ${className}`}
    >
      {children}
    </div>
  );
}

// Static accent class maps (Tailwind JIT cannot detect dynamic class names).
const ACCENT_CHIP = {
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  rose: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
  violet: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
  cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
  pink: 'border-pink-500/20 bg-pink-500/10 text-pink-400',
  orange: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  fuchsia: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400',
  teal: 'border-teal-500/20 bg-teal-500/10 text-teal-400',
  indigo: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
  sky: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  lime: 'border-lime-500/20 bg-lime-500/10 text-lime-400',
  red: 'border-red-500/20 bg-red-500/10 text-red-400',
  green: 'border-green-500/20 bg-green-500/10 text-green-400',
  gray: 'border-white/10 bg-white/5 text-gray-400',
};

const ACCENT_TEXT = {
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  violet: 'text-violet-400',
  cyan: 'text-cyan-400',
  pink: 'text-pink-400',
  orange: 'text-orange-400',
  fuchsia: 'text-fuchsia-400',
  teal: 'text-teal-400',
  indigo: 'text-indigo-400',
  sky: 'text-sky-400',
  lime: 'text-lime-400',
  red: 'text-red-400',
  green: 'text-green-400',
  gray: 'text-gray-400',
};

// ---------- Page header ----------
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  accent = 'blue',
  actions,
  meta,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div
            className={`rounded-xl border p-3 ${ACCENT_CHIP[accent] ?? ACCENT_CHIP.blue}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-white sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
          {meta && <div className="mt-2 flex flex-wrap gap-2">{meta}</div>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </motion.div>
  );
}

// ---------- Card surface ----------
export function GlassCard({
  children,
  className = '',
  hover = false,
  padding = 'p-5',
  as: Tag = 'div',
  href,
  ...rest
}) {
  const base = `rounded-2xl border border-white/[0.08] bg-gray-900 ${padding} ${
    hover
      ? 'transition-all hover:bg-white/[0.02] hover:border-white/[0.12]'
      : ''
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={base} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <Tag className={base} {...rest}>
      {children}
    </Tag>
  );
}

// ---------- Section header (inside cards) ----------
export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  accent = 'gray',
  action,
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <Icon
            className={`h-4 w-4 shrink-0 ${ACCENT_TEXT[accent] ?? ACCENT_TEXT.gray}`}
          />
        )}
        <div>
          <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ---------- Icon chip ----------
export function IconChip({ icon: Icon, accent = 'blue', size = 'md' }) {
  const sizes = {
    sm: 'p-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5',
    md: 'p-2 [&>svg]:h-5 [&>svg]:w-5',
    lg: 'p-2.5 [&>svg]:h-6 [&>svg]:w-6',
  };
  return (
    <div
      className={`inline-flex rounded-lg border ${ACCENT_CHIP[accent] ?? ACCENT_CHIP.blue} ${sizes[size]}`}
    >
      <Icon />
    </div>
  );
}

// ---------- Stat card ----------
export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent = 'blue',
  href,
  trend,
  delay = 0,
}) {
  const inner = (
    <>
      <div className="flex min-h-9 items-start justify-between gap-3">
        {Icon && <IconChip icon={Icon} accent={accent} />}
        {trend && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${
              trend.dir === 'up'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
            }`}
          >
            {trend.dir === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="mt-0.5 text-2xl font-bold text-white">{value}</div>
        {sublabel && (
          <div className="mt-0.5 text-[11px] text-gray-500">{sublabel}</div>
        )}
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <GlassCard
        hover
        href={href}
        padding="p-4"
        className="flex h-full flex-col"
      >
        {inner}
      </GlassCard>
    </motion.div>
  );
}

// ---------- Pill / badge ----------
const PILL_TONES = {
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  rose: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  violet: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
  cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
  pink: 'border-pink-500/20 bg-pink-500/10 text-pink-300',
  gray: 'border-white/10 bg-white/5 text-gray-300',
  orange: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
  red: 'border-red-500/20 bg-red-500/10 text-red-300',
  green: 'border-green-500/20 bg-green-500/10 text-green-300',
  indigo: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
  sky: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
};

export function Pill({ children, tone = 'gray', className = '', icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PILL_TONES[tone] ?? PILL_TONES.gray} ${className}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

// ---------- Gradient progress bar ----------
const GRADIENT_TONES = {
  blue: 'from-blue-500/70 to-cyan-500/50',
  emerald: 'from-emerald-500/70 to-teal-500/50',
  amber: 'from-amber-500/70 to-orange-500/50',
  rose: 'from-rose-500/70 to-pink-500/50',
  violet: 'from-violet-500/70 to-fuchsia-500/50',
  orange: 'from-orange-500/70 to-amber-500/50',
  indigo: 'from-indigo-500/70 to-violet-500/50',
  red: 'from-red-500/70 to-rose-500/50',
};

export function GradientBar({
  value,
  max = 100,
  tone = 'blue',
  height = 'h-2',
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={`relative ${height} overflow-hidden rounded-full border border-white/[0.04] bg-white/[0.02]`}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full bg-linear-to-r ${GRADIENT_TONES[tone] ?? GRADIENT_TONES.blue}`}
      />
    </div>
  );
}

// ---------- Tab bar ----------
export function TabBar({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
      {tabs.map((t) => {
        const active = t.value === value;
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              active
                ? 'bg-white/[0.06] text-white shadow-sm'
                : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {t.label}
            {typeof t.count === 'number' && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Empty state ----------
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  accent = 'gray',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div
          className={`mb-3 rounded-2xl border p-3 ${ACCENT_CHIP[accent] ?? ACCENT_CHIP.gray}`}
        >
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-gray-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- Action button (small primary / ghost) ----------
const BUTTON_TONES = {
  primary:
    'border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/40',
  ghost:
    'border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:text-white',
  danger:
    'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
  emerald:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
  amber:
    'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
  indigo:
    'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20',
  violet:
    'border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20',
};

export function ActionButton({
  children,
  tone = 'ghost',
  icon: Icon,
  href,
  className = '',
  ...props
}) {
  const cls = `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${BUTTON_TONES[tone] ?? BUTTON_TONES.ghost} ${className}`;
  const inner = (
    <>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...props}>
      {inner}
    </button>
  );
}

// ---------- Avatar (initials with deterministic color) ----------
const AVATAR_TONES = [
  'from-blue-500/40 to-cyan-500/30 text-blue-100',
  'from-violet-500/40 to-fuchsia-500/30 text-violet-100',
  'from-emerald-500/40 to-teal-500/30 text-emerald-100',
  'from-amber-500/40 to-orange-500/30 text-amber-100',
  'from-rose-500/40 to-pink-500/30 text-rose-100',
  'from-cyan-500/40 to-sky-500/30 text-cyan-100',
];

function hashName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name = '?', size = 'md', src }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full border border-white/10 object-cover`}
      />
    );
  }
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const tone = AVATAR_TONES[hashName(name) % AVATAR_TONES.length];
  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-linear-to-br font-semibold ${tone}`}
    >
      {initials || '?'}
    </div>
  );
}

// ---------- Sparkline ----------
export function Sparkline({ data = [], tone = 'blue', height = 'h-8' }) {
  const max = Math.max(...data, 1);
  const colorMap = {
    blue: 'bg-blue-500/40 hover:bg-blue-500/70',
    emerald: 'bg-emerald-500/40 hover:bg-emerald-500/70',
    amber: 'bg-amber-500/40 hover:bg-amber-500/70',
    violet: 'bg-violet-500/40 hover:bg-violet-500/70',
    indigo: 'bg-indigo-500/40 hover:bg-indigo-500/70',
  };
  return (
    <div className={`flex ${height} items-end gap-[2px]`}>
      {data.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ delay: i * 0.015, duration: 0.3 }}
          className={`flex-1 rounded-sm transition-colors ${colorMap[tone] ?? colorMap.blue}`}
          style={{ minHeight: v > 0 ? '4px' : '2px' }}
          title={`${v}`}
        />
      ))}
    </div>
  );
}

// ---------- Stagger helper ----------
export function StaggerList({ children, delay = 0.04 }) {
  return (
    <>
      {Array.isArray(children)
        ? children.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * delay }}
            >
              {c}
            </motion.div>
          ))
        : children}
    </>
  );
}

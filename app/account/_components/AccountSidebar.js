/**
 * @file Account sidebar component
 * @module AccountSidebar
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sparkles,
  PanelLeftClose,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { signOutAction } from '@/app/_lib/actions/actions';
import { cn } from '@/app/_lib/utils/utils';
import { ROLE_THEMES, ROLE_LABELS } from './roleTheme';

const ROLE_DESCRIPTIONS = {
  guest: 'Browse and participate',
  member: 'Full member benefits',
  mentor: 'Guide members',
  executive: 'Run operations',
  admin: 'Manage platform',
  advisor: 'Advisory board',
};

// ─── Tooltip (collapsed mode) ─────────────────────────────────────────────────
function Tooltip({ children, label, show }) {
  if (!show) return children;
  return (
    <div className="group/tooltip relative">
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute top-1/2 left-full z-[100] ml-3 -translate-y-1/2 rounded-lg border border-white/10 bg-[#0D1527] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-gray-200 opacity-0 shadow-2xl transition-all duration-150 group-hover/tooltip:opacity-100"
      >
        {label}
        <div className="absolute top-1/2 -left-1 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-white/10 bg-[#0D1527]" />
      </div>
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ item, isActive, collapsed, theme, onClick }) {
  const Icon = item.icon;
  return (
    <Tooltip label={item.label} show={collapsed}>
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          'group/nav relative flex items-center rounded-lg border border-transparent transition-all duration-150 outline-none',
          'focus-visible:ring-2 focus-visible:ring-white/20',
          collapsed ? 'h-9 w-9 justify-center' : 'h-11 gap-3 px-3 md:h-9',
          isActive
            ? cn('font-semibold shadow-sm', theme.active)
            : item.accent
              ? 'border-indigo-500/20 bg-linear-to-r from-indigo-500/10 to-violet-500/10 font-bold text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.08)] hover:from-indigo-500/15 hover:to-violet-500/15 hover:text-indigo-300'
              : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-200 active:bg-white/[0.07]'
        )}
      >
        {isActive && (
          <div
            className={cn(
              'absolute top-1/2 left-0 h-[18px] w-[3px] -translate-y-1/2 rounded-r-full bg-linear-to-b',
              theme.gradient
            )}
          />
        )}
        <Icon
          className={cn(
            'shrink-0 transition-all duration-150',
            collapsed ? 'h-[18px] w-[18px]' : 'h-[16px] w-[16px]',
            isActive
              ? ''
              : item.accent
                ? 'text-indigo-400 opacity-90 group-hover/nav:text-indigo-300 group-hover/nav:opacity-100'
                : 'opacity-60 group-hover/nav:opacity-100'
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-[14px] tracking-[-0.01em] md:text-[13px]">
              {item.label}
            </span>
            {item.badge != null && item.badge !== 0 && (
              <span
                className={cn(
                  'flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] leading-none font-bold tabular-nums',
                  item.badgeType === 'alert'
                    ? 'bg-sky-500 text-white'
                    : typeof item.badge === 'string'
                      ? 'bg-white/[0.07] text-[9px] tracking-wider text-gray-500 uppercase'
                      : 'bg-white/[0.07] text-gray-400'
                )}
              >
                {typeof item.badge === 'number' && item.badge > 99
                  ? '99+'
                  : item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge != null && item.badge !== 0 && (
          <span
            className={cn(
              'absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ring-1 ring-[#0B1121]',
              item.badgeType === 'alert' ? 'bg-sky-400' : 'bg-white/25'
            )}
          />
        )}
      </Link>
    </Tooltip>
  );
}

// ─── Route matching ───────────────────────────────────────────────────────────
function isRouteActive(pathname, href) {
  if (!pathname || !href) return false;
  const roleRootPattern = /^\/account\/[a-z]+$/;
  if (roleRootPattern.test(href)) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

// ─── Nav Group ────────────────────────────────────────────────────────────────
function NavGroup({ group, pathname, collapsed, theme, onItemClick }) {
  return (
    <div className="mb-0.5">
      {!collapsed && group.label && (
        <p className="mb-0.5 px-3 pt-4 pb-1 text-[10px] font-semibold tracking-[0.08em] text-gray-600 uppercase select-none">
          {group.label}
        </p>
      )}
      {collapsed && <div className="mx-auto my-2.5 h-px w-5 bg-white/[0.05]" />}
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={isRouteActive(pathname, item.href)}
            collapsed={collapsed}
            theme={theme}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Role switcher helpers ────────────────────────────────────────────────────
function RoleOptionsList({ userRoles, activeRole, onPick }) {
  return (
    <div className="space-y-0.5 p-1.5">
      {userRoles.map((role) => {
        const rt = ROLE_THEMES[role] || ROLE_THEMES.guest;
        const isCurrent = role === activeRole;
        return (
          <button
            key={role}
            onClick={() => onPick(role)}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors outline-none',
              'focus-visible:ring-2 focus-visible:ring-white/20',
              isCurrent
                ? rt.active
                : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-100'
            )}
          >
            {isCurrent && (
              <span
                className={cn(
                  'absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-linear-to-b',
                  rt.gradient
                )}
              />
            )}
            <span className={cn('h-2 w-2 shrink-0 rounded-full', rt.dot)} />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] leading-tight font-semibold">
                {ROLE_LABELS[role] || role}
              </p>
              <p className="mt-0.5 truncate text-[10.5px] text-gray-500">
                {ROLE_DESCRIPTIONS[role] || ''}
              </p>
            </div>
            {isCurrent && <Check className="h-3.5 w-3.5 shrink-0 opacity-70" />}
          </button>
        );
      })}
    </div>
  );
}

function useRoleMenu({ placement }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8, fallbackAxisSideDirection: 'end' }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(180, availableHeight)}px`,
          });
        },
      }),
    ],
  });
  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePress: true, escapeKey: true });
  const role = useRole(context, { role: 'menu' });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);
  return {
    open,
    setOpen,
    refs,
    floatingStyles,
    context,
    getReferenceProps,
    getFloatingProps,
  };
}

function RoleMenuPanel({
  context,
  refs,
  floatingStyles,
  getFloatingProps,
  children,
}) {
  return (
    <FloatingPortal>
      <FloatingFocusManager context={context} modal={false}>
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className="z-[100] w-54 outline-none"
        >
          <div className="animate-in fade-in zoom-in-95 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0D1527] shadow-2xl duration-150">
            <div className="border-b border-white/[0.06] px-3.5 py-2.5">
              <p className="text-[9.5px] font-bold tracking-[0.1em] text-gray-600 uppercase">
                Switch Role
              </p>
            </div>
            {children}
          </div>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}

// ─── User profile section ─────────────────────────────────────────────────────
function UserProfile({
  session,
  activeRole,
  userRoles,
  theme,
  onSwitch,
  collapsed,
}) {
  const hasMultiple = userRoles && userRoles.length > 1;
  const menu = useRoleMenu({
    placement: collapsed ? 'right-end' : 'top-start',
  });

  const initials = session?.name
    ? session.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const avatar = session?.image || session?.avatar_url;

  return (
    <>
      <button
        ref={hasMultiple ? menu.refs.setReference : undefined}
        {...(hasMultiple ? menu.getReferenceProps() : {})}
        className={cn(
          'flex w-full items-center rounded-xl transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-white/20',
          collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5',
          hasMultiple
            ? 'cursor-pointer hover:bg-white/[0.04]'
            : 'cursor-default'
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              'flex items-center justify-center overflow-hidden rounded-full font-semibold text-white',
              collapsed ? 'h-8 w-8 text-[11px]' : 'h-8 w-8 text-[11px]'
            )}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={session?.name || 'User'}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center rounded-full bg-linear-to-br',
                  theme.gradient
                )}
              >
                {initials}
              </div>
            )}
          </div>
          {/* Online dot */}
          <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full border-[1.5px] border-[#0B1121] bg-emerald-400" />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[12.5px] leading-tight font-semibold text-gray-100">
              {session?.name || 'User'}
            </p>
            <p className="mt-0.5 truncate text-[10.5px] leading-tight text-gray-500">
              {session?.email || ''}
            </p>
          </div>
        )}

        {!collapsed && hasMultiple && (
          <ChevronsUpDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-gray-600 transition-transform duration-150',
              menu.open && 'rotate-180'
            )}
          />
        )}
      </button>

      {hasMultiple && menu.open && (
        <RoleMenuPanel {...menu}>
          <RoleOptionsList
            userRoles={userRoles}
            activeRole={activeRole}
            onPick={(role) => {
              menu.setOpen(false);
              onSwitch(role);
            }}
          />
        </RoleMenuPanel>
      )}
    </>
  );
}

// ─── Role badge (shows current role) ─────────────────────────────────────────
function RoleBadge({ activeRole, theme }) {
  if (!activeRole) return null;
  return (
    <div
      className={cn(
        'mx-3 mb-0.5 flex items-center gap-1.5 rounded-md px-2 py-1',
        theme.badge,
        'border'
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', theme.dot)} />
      <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">
        {ROLE_LABELS[activeRole] || activeRole}
      </span>
    </div>
  );
}

// ─── Membership upgrade card ──────────────────────────────────────────────────
function MembershipCard({ role }) {
  if (role !== 'guest') return null;
  return (
    <div className="mx-3 mb-3 rounded-xl border border-sky-500/20 bg-linear-to-br from-sky-500/10 to-blue-600/5 p-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-sky-400" />
        <p className="text-[10px] font-bold tracking-[0.08em] text-sky-400 uppercase">
          Upgrade
        </p>
      </div>
      <p className="mb-1 text-[13px] leading-snug font-semibold text-white">
        Become a Member
      </p>
      <p className="mb-3 text-[11px] leading-relaxed text-gray-500">
        Unlock contests, certificates, mentorship &amp; more.
      </p>
      <Link
        href="/account/guest/membership-application"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-[12px] font-semibold text-white transition-all hover:bg-sky-400 active:scale-[0.98]"
      >
        Apply now
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function AccountSidebar({
  sidebarOpen,
  setSidebarOpen,
  hideSidebar,
  sidebarNavigation,
  activeRole,
  userRoles,
  session,
  collapsed,
  setCollapsed,
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (hideSidebar) return null;

  const theme = ROLE_THEMES[activeRole] || ROLE_THEMES.guest;
  const handleRoleSwitch = (role) => router.push(`/account/${role}`);
  const closeMobileSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Mobile hamburger (hidden md+ since rail is always visible) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          'fixed top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0B1121]/90 text-gray-400 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-white/[0.14] hover:text-white md:hidden',
          sidebarOpen ? 'left-[calc(min(290px,86vw)+8px)]' : 'left-3'
        )}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[58] flex flex-col border-r border-white/[0.06] bg-[#0B1121] transition-all duration-300 ease-out',
          'md:sticky md:top-0 md:z-40 md:h-screen md:translate-x-0',
          collapsed
            ? 'w-[60px]'
            : 'w-[min(290px,86vw)] lg:w-56 xl:w-60 2xl:w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'pb-[env(safe-area-inset-bottom)]'
        )}
        role="navigation"
        aria-label="Account sidebar"
      >
        {/* Collapse toggle (lg+ only; tablet is force-collapsed) */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute top-[18px] -right-3 z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-white/[0.1] bg-[#0B1121] text-gray-600 shadow-lg transition-all hover:border-white/[0.18] hover:bg-[#131B2C] hover:text-gray-300 lg:flex"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <PanelLeftClose className="h-3 w-3" />
          )}
        </button>

        {/* ── Brand ────────────────────────────────────────────────────────── */}
        <div
          className={cn(
            'shrink-0 border-b border-white/[0.06]',
            collapsed
              ? 'flex items-center justify-center px-3 py-[18px]'
              : 'flex items-center gap-3 px-4 py-[16px]'
          )}
        >
          <Link
            href="/"
            className="shrink-0 transition-opacity hover:opacity-80"
          >
            {collapsed ? (
              <span className="text-[15px] font-bold tracking-tight text-white select-none">
                N<span className={theme.accentText}>P</span>
              </span>
            ) : (
              <span className="text-[15px] font-bold tracking-tight text-white select-none">
                NEU<span className={theme.accentText}>PC</span>
              </span>
            )}
          </Link>
          {!collapsed && (
            <div
              className={cn(
                'ml-auto flex items-center gap-1 rounded-md border px-1.5 py-0.5',
                theme.badge
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', theme.dot)} />
              <span className="text-[9.5px] font-bold tracking-[0.08em] uppercase">
                {ROLE_LABELS[activeRole] || 'Panel'}
              </span>
            </div>
          )}
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <nav
          className={cn(
            'flex-1 overflow-x-hidden overflow-y-auto py-2',
            collapsed ? 'flex flex-col items-center px-1.5' : 'px-2',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          )}
        >
          {sidebarNavigation.map((group) => (
            <NavGroup
              key={group.key}
              group={group}
              pathname={pathname}
              collapsed={collapsed}
              theme={theme}
              onItemClick={closeMobileSidebar}
            />
          ))}
        </nav>

        {/* ── Membership upgrade card ──────────────────────────────────────── */}
        {!collapsed && <MembershipCard role={activeRole} />}

        {/* ── User profile + footer ─────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-white/[0.06]">
          {/* User profile row */}
          <div
            className={cn(
              'px-1.5 pt-2',
              collapsed ? 'flex justify-center' : ''
            )}
          >
            <UserProfile
              session={session}
              activeRole={activeRole}
              userRoles={userRoles}
              theme={theme}
              onSwitch={handleRoleSwitch}
              collapsed={collapsed}
            />
          </div>

          {/* Sign out */}
          <div
            className={cn(
              'px-2 pt-1 pb-2',
              collapsed ? 'flex justify-center' : 'flex'
            )}
          >
            <form action={signOutAction}>
              <Tooltip label="Sign out" show={collapsed}>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-gray-600 transition-colors hover:bg-rose-500/[0.06] hover:text-rose-400"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  {!collapsed && <span>Sign out</span>}
                </button>
              </Tooltip>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

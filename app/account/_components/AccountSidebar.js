'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  Home,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import { signOutAction } from '@/app/_lib/actions';

export default function AccountSidebar({
  sidebarOpen,
  setSidebarOpen,
  hideSidebar,
  sidebarNavigation,
  activeRole,
  session,
  userRoles,
}) {
  const pathname = usePathname();

  if (hideSidebar) return null;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-4 z-50 rounded-xl border border-white/20 bg-gray-900/90 p-3 text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-gray-800 lg:hidden ${
          sidebarOpen ? 'left-[19rem]' : 'left-4'
        }`}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-linear-to-b from-gray-900/98 via-gray-900/95 to-gray-900/98 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* User Profile Section */}
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              {session?.image ? (
                <img
                  src={session.image}
                  alt={session?.name || 'User'}
                  className="h-12 w-12 overflow-hidden rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-white shadow-lg">
                  <User className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold text-white">
                  {session?.name || 'Guest User'}
                </p>
                <p className="truncate text-xs text-gray-400">
                  {session?.email || 'guest@example.com'}
                </p>
              </div>
            </div>
            {/* Role Badge */}
            {activeRole && (
              <div className="mt-3">
                <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300">
                  {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="scrollbar-hide flex-1 overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Main Navigation */}
            <div className="mb-8">
              <h3 className="mb-3 px-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                Navigation
              </h3>
              <div className="space-y-1.5">
                {sidebarNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`group relative flex items-center justify-between overflow-hidden rounded-xl px-4 py-3.5 transition-all duration-300 ${
                        isActive
                          ? 'bg-linear-to-r from-blue-500/20 to-blue-600/10 text-blue-400 shadow-lg shadow-blue-500/20'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-blue-400 to-blue-600" />
                      )}
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-5 w-5 transition-transform duration-300 ${
                            isActive ? 'scale-110' : 'group-hover:scale-110'
                          }`}
                        />
                        <span className="text-sm font-semibold">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span
                            className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold shadow-lg ${
                              item.badgeType === 'alert'
                                ? 'bg-red-500 text-white'
                                : 'bg-blue-500/30 text-blue-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="h-4 w-4" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Upgrade Section - Only for guests */}
            {activeRole === 'guest' && (
              <div>
                <h3 className="mb-3 px-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Membership
                </h3>
                <Link
                  href="/account/guest/membership-application"
                  className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-purple-500/30 bg-linear-to-br from-purple-500/20 via-pink-500/15 to-purple-600/20 px-4 py-4 shadow-lg shadow-purple-500/20 transition-all duration-300 hover:border-purple-500/50 hover:shadow-purple-500/30"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-purple-600/0 via-pink-600/10 to-purple-600/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <span className="text-sm font-bold text-purple-300">
                      Upgrade Account
                    </span>
                  </div>
                  <ChevronRight className="relative h-4 w-4 text-purple-400 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="space-y-3 border-t border-white/10 p-4">
            {/* Switch Role Button - Only visible if user has multiple roles */}
            {userRoles && userRoles.length > 1 && (
              <Link
                href="/account"
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 shadow-lg transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/20 hover:shadow-blue-500/20"
              >
                <User className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                <span>Switch Role</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            )}

            {/* Logout Button */}
            <form action={signOutAction}>
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 shadow-lg transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/20 hover:shadow-red-500/20"
              >
                <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

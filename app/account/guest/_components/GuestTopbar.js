'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, HelpCircle, ChevronRight } from 'lucide-react';

const SEGMENT_LABEL = {
  account: 'Account',
  guest: 'Guest',
  notifications: 'Notifications',
  participation: 'My Participation',
  events: 'Events',
  resources: 'Resources',
  profile: 'Profile',
  settings: 'Settings',
  'membership-application': 'Apply',
};

const SEGMENT_GROUP = {
  notifications: 'Activity',
  participation: 'Activity',
  events: 'Discover',
  resources: 'Discover',
  profile: 'Account',
  settings: 'Account',
  'membership-application': 'Membership',
};

function buildCrumbs(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const guestIdx = parts.indexOf('guest');
  if (guestIdx === -1) return ['Guest', 'Dashboard'];
  const tail = parts.slice(guestIdx + 1);
  if (tail.length === 0) return ['Guest', 'Dashboard'];
  const last = tail[tail.length - 1];
  const group = SEGMENT_GROUP[last];
  const label = SEGMENT_LABEL[last] || last;
  return group ? ['Guest', group, label] : ['Guest', label];
}

export default function GuestTopbar() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  return (
    <div className="gp-topbar">
      <nav className="gp-topbar-crumb" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={12} strokeWidth={1.5} />}
            {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
          </span>
        ))}
      </nav>
      <div className="gp-topbar-spacer" />
      <button type="button" className="gp-topbar-search" aria-label="Search">
        <Search size={13} />
        <span>Search events, resources…</span>
        <kbd>⌘K</kbd>
      </button>
      <Link
        href="/account/guest/notifications"
        className="gp-topbar-icon-btn"
        aria-label="Notifications"
      >
        <Bell size={16} />
        <span className="gp-ping" />
      </Link>
      <button type="button" className="gp-topbar-icon-btn" aria-label="Help">
        <HelpCircle size={16} />
      </button>
    </div>
  );
}

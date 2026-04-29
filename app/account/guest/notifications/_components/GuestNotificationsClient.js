/**
 * @file Guest notifications client — full notification centre with
 *   filtering, read/unread management, and bulk actions.
 * @module GuestNotificationsClient
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useScrollLock } from '@/app/_lib/hooks';
import {
  Bell,
  BellOff,
  Pin,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  Clock,
  Paperclip,
  X,
  Search,
  Sparkles,
  Lock,
  Trophy,
  ExternalLink,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  PageHead,
  Stat,
  StatRow,
  Badge,
  Btn,
  Tabs,
  UpgradeBanner,
} from '../../_components/ui';

const READ_KEY = 'neupc_guest_read_notices';

const TYPE_META = {
  general: { label: 'General', icon: Info },
  urgent: { label: 'Urgent', icon: AlertTriangle, variant: 'danger' },
  event: { label: 'Event', icon: Calendar, variant: 'accent' },
  deadline: { label: 'Deadline', icon: Clock, variant: 'warn' },
  achievement: { label: 'Achievement', icon: Trophy, variant: 'success' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isThisWeek(iso) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 7 * 86400000;
}

function NoticeRow({ notice, isRead, onRead, onOpen }) {
  const tm = TYPE_META[notice.notice_type] ?? TYPE_META.general;
  const TypeIcon = tm.icon;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
      style={{
        borderBottom: '1px solid var(--gp-line)',
        background: !isRead ? 'oklch(0.18 0.005 240 / 0.4)' : 'transparent',
        transition: 'background .12s',
      }}
      onClick={() => {
        onRead(notice.id);
        onOpen(notice);
      }}
    >
      <div
        className="mt-1 shrink-0"
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: !isRead ? 'var(--gp-accent)' : 'transparent',
        }}
      />
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center"
        style={{ borderRadius: 7, background: 'var(--gp-surface-3)', color: 'var(--gp-text-2)' }}
      >
        <TypeIcon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5" style={{ marginBottom: 4 }}>
          <Badge variant={tm.variant}>{tm.label}</Badge>
          {notice.is_pinned && (
            <Badge variant="warn">
              <Pin size={10} /> Pinned
            </Badge>
          )}
          {notice.priority === 'critical' && <Badge variant="danger">Critical</Badge>}
          {notice.priority === 'high' && <Badge variant="warn">High</Badge>}
        </div>
        <div style={{ fontSize: 13, fontWeight: !isRead ? 600 : 500, color: 'var(--gp-text)' }}>
          {notice.title}
        </div>
        <div
          className="line-clamp-2"
          style={{ fontSize: 12, color: 'var(--gp-text-3)', lineHeight: 1.4, marginTop: 2 }}
        >
          {notice.content}
        </div>
        <div
          className="flex flex-wrap items-center gap-3"
          style={{ fontSize: 11, color: 'var(--gp-text-4)', marginTop: 6 }}
        >
          <span className="gp-mono">{timeAgo(notice.created_at)}</span>
          {notice.users?.full_name && <span>By {notice.users.full_name}</span>}
          {notice.attachments?.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip size={11} /> {notice.attachments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NoticeModal({ notice, onClose }) {
  useScrollLock(!!notice);
  if (!notice) return null;
  const tm = TYPE_META[notice.notice_type] ?? TYPE_META.general;
  const TypeIcon = tm.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="gp-card relative flex w-full max-w-lg flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gp-card-head">
          <h3>
            <TypeIcon size={14} style={{ color: 'var(--gp-text-3)' }} />
            <Badge variant={tm.variant}>{tm.label}</Badge>
            {notice.is_pinned && (
              <Badge variant="warn">
                <Pin size={10} /> Pinned
              </Badge>
            )}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: 4,
              border: 'none',
              background: 'transparent',
              color: 'var(--gp-text-3)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="gp-card-body overflow-y-auto">
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 10 }}>
            {notice.title}
          </h2>
          <p
            className="whitespace-pre-line"
            style={{ fontSize: 13.5, color: 'var(--gp-text-2)', lineHeight: 1.6, marginBottom: 16 }}
          >
            {notice.content}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {notice.users?.full_name && (
              <div
                style={{
                  background: 'var(--gp-surface-2)',
                  border: '1px solid var(--gp-line)',
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div
                  className="gp-mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--gp-text-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 3,
                  }}
                >
                  Posted by
                </div>
                <div style={{ fontSize: 12.5 }}>{notice.users.full_name}</div>
              </div>
            )}
            <div
              style={{
                background: 'var(--gp-surface-2)',
                border: '1px solid var(--gp-line)',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div
                className="gp-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--gp-text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 3,
                }}
              >
                Posted
              </div>
              <div style={{ fontSize: 12.5 }}>{formatDate(notice.created_at)}</div>
            </div>
            {notice.expires_at && (
              <div
                style={{
                  background: 'var(--gp-surface-2)',
                  border: '1px solid var(--gp-line)',
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div
                  className="gp-mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--gp-text-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 3,
                  }}
                >
                  Expires
                </div>
                <div style={{ fontSize: 12.5 }}>{formatDate(notice.expires_at)}</div>
              </div>
            )}
          </div>

          {notice.attachments?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div
                className="gp-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--gp-text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Attachments
              </div>
              <div className="flex flex-col gap-1.5">
                {notice.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att}
                    target="_blank"
                    rel="noreferrer"
                    className="gp-btn"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Paperclip size={13} />
                    <span className="truncate flex-1">
                      {att.split('/').pop() || `Attachment ${i + 1}`}
                    </span>
                    <ExternalLink size={11} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuestNotificationsClient({ notices }) {
  const [readIds, setReadIds] = useState(new Set());
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      if (raw) setReadIds(new Set(JSON.parse(raw)));
    } catch {}
    setMounted(true);
  }, []);

  function markRead(id) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(READ_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function markAllRead() {
    const next = new Set([...readIds, ...notices.map((n) => n.id)]);
    setReadIds(next);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...next]));
    } catch {}
  }

  const isRead = (id) => !mounted || readIds.has(id);

  const unreadCount = mounted ? notices.filter((n) => !readIds.has(n.id)).length : 0;
  const thisWeekCount = notices.filter((n) => isThisWeek(n.created_at)).length;
  const presentTypes = ['all', ...new Set(notices.map((n) => n.notice_type).filter(Boolean))];

  const filtered = useMemo(() => {
    return notices.filter((n) => {
      const s = search.toLowerCase();
      const matchSearch =
        !search || n.title.toLowerCase().includes(s) || (n.content ?? '').toLowerCase().includes(s);
      const matchTab =
        activeTab === 'all' ||
        (activeTab === 'unread' && mounted && !readIds.has(n.id)) ||
        (activeTab === 'pinned' && n.is_pinned) ||
        (activeTab === 'critical' && n.priority === 'critical') ||
        (activeTab === 'events' && n.notice_type === 'event') ||
        (activeTab === 'system' && n.notice_type === 'general');
      const matchType = typeFilter === 'all' || n.notice_type === typeFilter;
      return matchSearch && matchTab && matchType;
    });
  }, [notices, search, activeTab, typeFilter, readIds, mounted]);

  const TABS = [
    { id: 'all', label: 'All', count: notices.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'pinned', label: 'Pinned', count: notices.filter((n) => n.is_pinned).length },
    { id: 'critical', label: 'Critical', count: notices.filter((n) => n.priority === 'critical').length },
  ].filter((t) => t.id === 'all' || t.count > 0);

  return (
    <>
      <NoticeModal notice={selected} onClose={() => setSelected(null)} />

      <PageHead
        eyebrow="Activity"
        title="Notifications"
        sub="Stay updated on club announcements and your registrations."
        actions={
          <>
            {unreadCount > 0 && (
              <Btn onClick={markAllRead}>
                <CheckCircle2 size={13} /> Mark all read
              </Btn>
            )}
            <Btn href="/account/guest/settings">
              <SettingsIcon size={13} /> Preferences
            </Btn>
          </>
        }
      />

      <StatRow cols={3}>
        <Stat icon={Bell} label="Total" value={notices.length} trend="All time" />
        <Stat icon={Bell} label="Unread" value={unreadCount} trend="Action recommended" />
        <Stat icon={Calendar} label="This week" value={thisWeekCount} trend="+ recent" />
      </StatRow>

      <div className="gp-search" style={{ marginBottom: 16 }}>
        <Search size={14} style={{ color: 'var(--gp-text-4)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notifications…"
        />
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} items={TABS} />

      {presentTypes.length > 2 && (
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
          {presentTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`gp-chip ${typeFilter === t ? 'gp-active' : ''}`}
            >
              {t === 'all' ? 'All types' : (TYPE_META[t]?.label ?? t)}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="gp-card" style={{ padding: 60, textAlign: 'center' }}>
          <div
            className="grid place-items-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--gp-surface-2)',
              border: '1px solid var(--gp-line)',
              margin: '0 auto 14px',
              color: 'var(--gp-text-3)',
            }}
          >
            <BellOff size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No notifications found</div>
          <div style={{ fontSize: 12.5, color: 'var(--gp-text-3)', marginBottom: 16 }}>
            {notices.length === 0
              ? 'Check back later for club announcements.'
              : 'Try adjusting your search or filters.'}
          </div>
          {(search || typeFilter !== 'all' || activeTab !== 'all') && (
            <button
              className="gp-btn"
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setActiveTab('all');
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="gp-card">
          {filtered.map((notice) => (
            <NoticeRow
              key={notice.id}
              notice={notice}
              isRead={isRead(notice.id)}
              onRead={markRead}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <UpgradeBanner
          icon={Lock}
          title="Want smarter alerts?"
          desc="Members get role-targeted notifications, contest reminders & leaderboard alerts."
        />
      </div>
    </>
  );
}

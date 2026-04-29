/**
 * @file Guest events client — browsable list of public club events
 *   with filtering, search, and registration actions for guests.
 * @module GuestEventsClient
 */

'use client';

import { useState, useMemo } from 'react';
import { useScrollLock } from '@/app/_lib/hooks';
import {
  Calendar,
  MapPin,
  Clock,
  Tag,
  Search,
  ExternalLink,
  X,
  ChevronRight,
  Sparkles,
  Users,
  Globe,
  Wifi,
  Building2,
  Star,
  AlertCircle,
  CheckCircle2,
  Timer,
  Flame,
  Lock,
} from 'lucide-react';
import { driveImageUrl } from '@/app/_lib/utils';
import { PageHead, Stat, StatRow, Badge, Btn, UpgradeBanner } from '../../_components/ui';

const VENUE_META = {
  online: { icon: Wifi, label: 'Online' },
  offline: { icon: Building2, label: 'In-Person' },
  hybrid: { icon: Globe, label: 'Hybrid' },
};

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getDeadlineStatus(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diffMs = d - now;
  if (diffMs <= 0) return { label: 'Registration closed', closed: true };
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days === 0) return { label: `${hours}h left to register`, urgent: true };
  if (days <= 3) return { label: `${days}d ${hours}h left`, urgent: true };
  return { label: `Deadline: ${formatDate(deadline)}` };
}

function statusBadge(status) {
  if (status === 'upcoming') return <Badge variant="success">Upcoming</Badge>;
  if (status === 'ongoing') return <Badge variant="accent">Ongoing</Badge>;
  if (status === 'completed') return <Badge>Completed</Badge>;
  if (status === 'cancelled') return <Badge variant="danger">Cancelled</Badge>;
  return <Badge>{status}</Badge>;
}

function EventCard({ event, onOpen }) {
  const venueMeta = VENUE_META[event.venue_type] ?? VENUE_META.offline;
  const deadline = getDeadlineStatus(event.registration_deadline);
  const dateObj = event.start_date ? new Date(event.start_date) : null;
  const dM = dateObj?.toLocaleDateString('en-US', { month: 'short' });
  const dD = dateObj?.getDate();

  return (
    <div
      className="gp-card cursor-pointer flex flex-col"
      style={{ transition: 'border-color .15s, transform .15s' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gp-line-strong)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--gp-line)')}
      onClick={() => onOpen(event)}
    >
      <div
        className="relative overflow-hidden"
        style={{ height: 132, background: 'var(--gp-surface-2)' }}
      >
        {event.cover_image || event.banner_image ? (
          <img
            src={driveImageUrl(event.cover_image || event.banner_image)}
            alt={event.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/placeholder-event.svg';
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full grid place-items-center gp-mono"
            style={{
              fontSize: 10,
              color: 'var(--gp-text-4)',
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent 0 6px, oklch(0.2 0.005 240) 6px 7px)',
            }}
          >
            {(event.category || 'EVENT').toUpperCase()} COVER
          </div>
        )}
        {event.category && (
          <span
            className="gp-mono"
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--gp-text)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {event.category}
          </span>
        )}
        {dateObj && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 7,
              padding: '6px 9px',
              textAlign: 'center',
              minWidth: 44,
            }}
          >
            <b style={{ display: 'block', fontSize: 16, lineHeight: 1, fontWeight: 600 }}>{dD}</b>
            <span
              className="gp-mono"
              style={{
                fontSize: 9,
                color: 'var(--gp-text-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {dM}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col" style={{ padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>
          {event.title}
        </div>
        {event.description && (
          <div
            className="line-clamp-2 flex-1"
            style={{ fontSize: 12, color: 'var(--gp-text-3)', lineHeight: 1.45 }}
          >
            {event.description}
          </div>
        )}
        <div className="flex flex-col gap-1.5" style={{ marginTop: 12, fontSize: 11.5, color: 'var(--gp-text-3)' }}>
          {event.start_date && (
            <div className="flex items-center gap-1.5">
              <Clock size={11} style={{ color: 'var(--gp-text-4)' }} />
              {formatDate(event.start_date)}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <MapPin size={11} style={{ color: 'var(--gp-text-4)' }} />
            <span className="truncate">
              {event.location || '—'} · {venueMeta.label}
            </span>
          </div>
          {deadline && (
            <div className="flex items-center gap-1.5" style={deadline.urgent ? { color: 'oklch(0.85 0.13 75)' } : {}}>
              <Timer size={11} style={{ color: 'var(--gp-text-4)' }} /> {deadline.label}
            </div>
          )}
        </div>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ borderTop: '1px solid var(--gp-line)', padding: '10px 14px' }}
      >
        {statusBadge(event.status)}
        <button className="gp-btn gp-btn-ghost gp-btn-sm">
          Details <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

function EventModal({ event, onClose }) {
  useScrollLock();
  if (!event) return null;
  const venueMeta = VENUE_META[event.venue_type] ?? VENUE_META.offline;
  const VenueIcon = venueMeta.icon;
  const deadline = getDeadlineStatus(event.registration_deadline);
  const canRegister =
    event.registration_required &&
    event.status !== 'completed' &&
    event.status !== 'cancelled' &&
    (!event.registration_deadline || new Date(event.registration_deadline) > new Date());

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="gp-card relative flex w-full max-w-2xl flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {(event.banner_image || event.cover_image) && (
          <div className="relative shrink-0" style={{ height: 200 }}>
            <img
              src={driveImageUrl(event.banner_image || event.cover_image)}
              alt={event.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder-event.svg';
              }}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--gp-surface), transparent)' }} />
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-3 right-3 grid place-items-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid var(--gp-line)',
            color: 'var(--gp-text-2)',
            cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>

        <div className="overflow-y-auto" style={{ padding: '20px 22px 24px' }}>
          <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 12 }}>
            {event.category && <Badge variant="accent">{event.category}</Badge>}
            {statusBadge(event.status)}
            {event.is_featured && (
              <Badge>
                <Star size={11} /> Featured
              </Badge>
            )}
          </div>

          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>
            {event.title}
          </h2>
          {event.description && (
            <p style={{ margin: '6px 0 16px', fontSize: 13.5, color: 'var(--gp-text-3)', lineHeight: 1.5 }}>
              {event.description}
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" style={{ marginBottom: 16 }}>
            {[
              { icon: Calendar, label: 'Start', value: formatDateTime(event.start_date) },
              event.end_date && { icon: Clock, label: 'End', value: formatDateTime(event.end_date) },
              { icon: MapPin, label: 'Location', value: event.location || '—' },
              { icon: VenueIcon, label: 'Mode', value: venueMeta.label },
              event.max_participants && {
                icon: Users,
                label: 'Capacity',
                value: `${event.max_participants}`,
              },
              event.registration_deadline && {
                icon: Timer,
                label: 'Reg. Deadline',
                value: formatDateTime(event.registration_deadline),
              },
            ]
              .filter(Boolean)
              .map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--gp-surface-2)',
                    border: '1px solid var(--gp-line)',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div
                    className="gp-mono flex items-center gap-1"
                    style={{
                      fontSize: 10,
                      color: 'var(--gp-text-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 4,
                    }}
                  >
                    <Icon size={11} /> {label}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--gp-text-2)' }}>{value}</div>
                </div>
              ))}
          </div>

          {event.content && (
            <div
              style={{
                background: 'var(--gp-surface-2)',
                border: '1px solid var(--gp-line)',
                borderRadius: 8,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div
                className="gp-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--gp-text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Details
              </div>
              <div
                className="text-sm"
                style={{ color: 'var(--gp-text-2)', lineHeight: 1.55 }}
                dangerouslySetInnerHTML={{ __html: event.content }}
              />
            </div>
          )}

          {event.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 16 }}>
              {event.tags.map((t) => (
                <Badge key={t}>
                  <Tag size={10} /> {t}
                </Badge>
              ))}
            </div>
          )}

          {deadline?.urgent && (
            <div
              className="flex items-center gap-2"
              style={{
                padding: '10px 14px',
                marginBottom: 16,
                borderRadius: 8,
                background: 'oklch(0.78 0.13 75 / 0.1)',
                border: '1px solid oklch(0.78 0.13 75 / 0.3)',
                color: 'oklch(0.85 0.13 75)',
                fontSize: 12.5,
              }}
            >
              <AlertCircle size={14} /> {deadline.label}
            </div>
          )}

          <div
            style={{
              padding: 14,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--gp-surface-2), oklch(0.18 0.02 var(--gp-accent-h)))',
              border: '1px solid var(--gp-accent-line)',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <Sparkles size={14} style={{ color: 'var(--gp-accent-text)' }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>Member-only benefits available</div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gp-text-3)', margin: '0 0 12px' }}>
              Members get priority registration, exclusive materials, discounts, and post-event recordings.
            </p>
            <div className="flex flex-wrap gap-2">
              {canRegister && event.registration_url && (
                <a
                  href={event.registration_url}
                  target="_blank"
                  rel="noreferrer"
                  className="gp-btn"
                >
                  Register as guest <ExternalLink size={12} />
                </a>
              )}
              <Btn href="/account/guest/membership-application" variant="primary">
                Apply for membership <ChevronRight size={13} />
              </Btn>
            </div>
          </div>

          {event.external_url && (
            <a
              href={event.external_url}
              target="_blank"
              rel="noreferrer"
              className="gp-btn"
              style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
            >
              <Globe size={14} /> Visit event page <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuestEventsClient({ events }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('soonest');

  const categories = ['all', ...new Set(events.map((e) => e.category).filter(Boolean))];
  const venueTypes = ['all', ...new Set(events.map((e) => e.venue_type).filter(Boolean))];

  const filtered = useMemo(() => {
    let arr = events.filter((e) => {
      const s = search.toLowerCase();
      const matchSearch =
        !search ||
        e.title.toLowerCase().includes(s) ||
        (e.description ?? '').toLowerCase().includes(s) ||
        (e.location ?? '').toLowerCase().includes(s);
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      const matchVenue = venueFilter === 'all' || e.venue_type === venueFilter;
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchCat && matchVenue && matchStatus;
    });

    arr = [...arr].sort((a, b) => {
      if (sort === 'soonest' || sort === 'oldest')
        return new Date(a.start_date) - new Date(b.start_date);
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'deadline') {
        const da = a.registration_deadline ? new Date(a.registration_deadline) : Infinity;
        const db = b.registration_deadline ? new Date(b.registration_deadline) : Infinity;
        return da - db;
      }
      return 0;
    });

    return arr;
  }, [events, search, categoryFilter, venueFilter, statusFilter, sort]);

  const upcoming = events.filter((e) => e.status === 'upcoming').length;
  const ongoing = events.filter((e) => e.status === 'ongoing').length;
  const completed = events.filter((e) => e.status === 'completed').length;

  return (
    <>
      <EventModal event={selected} onClose={() => setSelected(null)} />

      <PageHead
        eyebrow="Discover"
        title="Events"
        sub="Workshops, contests & bootcamps hosted by NEUPC."
      />

      <StatRow cols={3}>
        <Stat icon={Flame} label="Upcoming" value={upcoming} trend="2 closing soon" />
        <Stat icon={Sparkles} label="Ongoing" value={ongoing} trend="Bootcamp · week 2" />
        <Stat icon={CheckCircle2} label="Completed" value={completed} trend="This semester" />
      </StatRow>

      <div className="flex gap-2.5 items-center flex-wrap" style={{ marginBottom: 14 }}>
        <div className="gp-search" style={{ flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ color: 'var(--gp-text-4)' }} />
          <input
            placeholder="Search events by title, description or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="gp-select"
          style={{ width: 'auto' }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="soonest">Sort: Soonest</option>
          <option value="newest">Newest added</option>
          <option value="deadline">Closing soon</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
        {['all', 'upcoming', 'ongoing', 'completed'].map((s) => (
          <button
            key={s}
            className={`gp-chip ${statusFilter === s ? 'gp-active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All status' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        {categories.length > 2 &&
          categories.map((c) => (
            <button
              key={c}
              className={`gp-chip ${categoryFilter === c ? 'gp-active' : ''}`}
              onClick={() => setCategoryFilter(c)}
            >
              {c === 'all' ? 'All categories' : c}
            </button>
          ))}
        {venueTypes.length > 2 &&
          venueTypes.map((v) => (
            <button
              key={v}
              className={`gp-chip ${venueFilter === v ? 'gp-active' : ''}`}
              onClick={() => setVenueFilter(v)}
            >
              {v === 'all' ? 'All venues' : VENUE_META[v]?.label || v}
            </button>
          ))}
      </div>

      <div className="gp-mono" style={{ fontSize: 11.5, color: 'var(--gp-text-3)', marginBottom: 12 }}>
        Showing {filtered.length} of {events.length} events
      </div>

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
            <Calendar size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No events found</div>
          <div style={{ fontSize: 12.5, color: 'var(--gp-text-3)', marginBottom: 16 }}>
            {events.length === 0
              ? 'Check back later for upcoming activities.'
              : 'Try adjusting your search or filters.'}
          </div>
          {(search || categoryFilter !== 'all' || venueFilter !== 'all' || statusFilter !== 'all') && (
            <button
              className="gp-btn"
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setVenueFilter('all');
                setStatusFilter('all');
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} onOpen={setSelected} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <UpgradeBanner
          icon={Lock}
          title="Unlock more events"
          desc="Members get bootcamps, mentor sessions, and post-event recordings."
        />
      </div>
    </>
  );
}

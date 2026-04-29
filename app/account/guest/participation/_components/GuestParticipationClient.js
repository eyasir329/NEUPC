/**
 * @file Guest participation client — detailed view of the guest's
 *   event attendance history and participation records.
 * @module GuestParticipationClient
 */

'use client';

import { useState } from 'react';
import {
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { PageHead, Stat, StatRow, Badge, Btn, Tabs, UpgradeBanner } from '../../_components/ui';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const REG_STATUS = {
  registered: { label: 'Registered', variant: 'accent', icon: Clock },
  confirmed: { label: 'Confirmed', variant: 'success', icon: CheckCircle2 },
  attended: { label: 'Attended', variant: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'danger', icon: XCircle },
  missed: { label: 'Missed', variant: '', icon: XCircle },
};

export default function GuestParticipationClient({ registrations = [], certificates = [] }) {
  const [tab, setTab] = useState('events');

  const attended = registrations.filter((r) => r.status === 'attended').length;
  const upcoming = registrations.filter((r) => ['registered', 'confirmed'].includes(r.status)).length;
  const sorted = [...registrations].sort(
    (a, b) => new Date(b.registered_at || 0) - new Date(a.registered_at || 0)
  );

  const TABS = [
    { id: 'events', label: 'Events', count: registrations.length },
    { id: 'certificates', label: 'Certificates', count: certificates.length },
    { id: 'timeline', label: 'Timeline', count: sorted.length },
  ];

  return (
    <>
      <PageHead
        eyebrow="Activity"
        title="My participation"
        sub="Your event history, registrations & activity timeline."
      />

      <StatRow cols={4}>
        <Stat icon={Calendar} label="Registered" value={upcoming} trend="Upcoming" />
        <Stat icon={CheckCircle2} label="Attended" value={attended} trend="Confirmed" />
        <Stat icon={Flame} label="Streak" value={Math.min(attended, 9)} unit="events" trend="Keep it going" />
        <Stat icon={Award} label="Certificates" value={`${certificates.length}`} unit={`/ ${attended}`} trend="Members-only" />
      </StatRow>

      <Tabs value={tab} onChange={setTab} items={TABS} />

      {tab === 'events' && (
        <div className="gp-card" style={{ overflowX: 'auto' }}>
          <div
            className="grid gp-mono"
            style={{
              gridTemplateColumns: '1fr 140px 110px 110px',
              padding: '10px 16px',
              borderBottom: '1px solid var(--gp-line)',
              fontSize: 11,
              color: 'var(--gp-text-4)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <div>Event</div>
            <div>Venue</div>
            <div>Date</div>
            <div>Status</div>
          </div>
          {sorted.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gp-text-3)' }}>
              No registrations yet. Browse events to get started.
            </div>
          ) : (
            sorted.map((r, i) => {
              const sm = REG_STATUS[r.status] ?? REG_STATUS.registered;
              return (
                <div
                  key={r.id}
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: '1fr 140px 110px 110px',
                    padding: '12px 16px',
                    borderBottom: i < sorted.length - 1 ? '1px solid var(--gp-line)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.events?.title ?? 'Untitled'}</div>
                  <div className="truncate" style={{ fontSize: 12, color: 'var(--gp-text-3)' }}>
                    {r.events?.location ?? '—'}
                  </div>
                  <div className="gp-mono" style={{ fontSize: 11.5, color: 'var(--gp-text-3)' }}>
                    {formatDate(r.events?.start_date)}
                  </div>
                  <div>
                    <Badge variant={sm.variant}>
                      <sm.icon size={11} /> {sm.label}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'certificates' && (
        <div className="gp-card" style={{ padding: 40, textAlign: 'center' }}>
          <div
            className="grid place-items-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--gp-surface-2)',
              border: '1px solid var(--gp-line)',
              margin: '0 auto 16px',
              color: 'var(--gp-text-3)',
            }}
          >
            <Award size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            Certificates are a member benefit
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--gp-text-3)',
              maxWidth: 420,
              margin: '0 auto 18px',
            }}
          >
            You&apos;ve attended {attended} eligible events. Apply for membership to claim and download your certificates.
          </div>
          <Btn href="/account/guest/membership-application" variant="primary">
            Apply for membership →
          </Btn>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="gp-card gp-card-body">
          <div className="gp-timeline">
            {sorted.length === 0 && (
              <div style={{ color: 'var(--gp-text-3)', fontSize: 13 }}>No activity yet.</div>
            )}
            {sorted.map((r, i) => {
              const sm = REG_STATUS[r.status] ?? REG_STATUS.registered;
              return (
                <div key={r.id} className={`gp-tl-item ${i === 0 ? 'gp-accent' : ''}`}>
                  <div className="gp-tl-date">{formatDate(r.registered_at || r.events?.start_date)}</div>
                  <div className="gp-tl-title">
                    {sm.label} · {r.events?.title ?? 'Event'}
                  </div>
                  <div className="gp-tl-body">
                    {r.events?.location ?? '—'}
                    {r.team_name ? ` · Team ${r.team_name}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <UpgradeBanner
          icon={TrendingUp}
          title="Unlock participation insights"
          desc="Members see contest rankings, performance trends, leaderboard standings & exportable reports."
        />
      </div>
    </>
  );
}

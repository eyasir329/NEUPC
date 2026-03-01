/**
 * @file Guest profile page — shows the guest user’s account information
 *   along with computed engagement stats (events registered, attended,
 *   certificates earned, and notice count).
 * @module GuestProfilePage
 * @access guest
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getUserEventRegistrations,
  getUserCertificates,
  getActiveNotices,
} from '@/app/_lib/data-service';
import GuestProfileClient from './_components/GuestProfileClient';

export const metadata = { title: 'My Profile | Guest | NEUPC' };

export default async function GuestProfilePage() {
  const { user } = await requireRole('guest', { checkIsActive: false });

  const [registrations, certificates, allNotices] = await Promise.all([
    getUserEventRegistrations(user.id).catch(() => []),
    getUserCertificates(user.id).catch(() => []),
    getActiveNotices().catch(() => []),
  ]);

  const noticeCount = allNotices.filter((n) => {
    if (!n.target_audience || n.target_audience.length === 0) return true;
    return (
      n.target_audience.includes('all') || n.target_audience.includes('guest')
    );
  }).length;

  const stats = {
    eventsRegistered: registrations.length,
    eventsAttended: registrations.filter((r) => r.attended).length,
    certificates: certificates.length,
    notices: noticeCount,
  };

  return <GuestProfileClient user={user} stats={stats} />;
}

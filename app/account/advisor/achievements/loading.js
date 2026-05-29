/**
 * @file Achievements loading page — skeleton UI shown while the
 *   achievements page data resolves.
 *
 * @module AdvisorAchievementsLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="cards" title="Achievements" />;
}

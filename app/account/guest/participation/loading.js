/**
 * @file Participation loading page — skeleton UI shown while the
 *   participation page data resolves.
 *
 * @module GuestParticipationLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Participation" />;
}

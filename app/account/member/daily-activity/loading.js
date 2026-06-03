/**
 * @file Daily Activity loading page — skeleton UI shown while the
 *   daily activity page data resolves.
 *
 * @module MemberDailyActivityLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="cards" title="Daily Activity" />;
}

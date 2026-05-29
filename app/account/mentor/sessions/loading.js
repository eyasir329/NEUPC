/**
 * @file Sessions loading page — skeleton UI shown while the
 *   sessions page data resolves.
 *
 * @module MentorSessionsLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Sessions" />;
}

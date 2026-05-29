/**
 * @file Inbox loading page — skeleton UI shown while the
 *   inbox page data resolves.
 *
 * @module MentorInboxLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Inbox" />;
}

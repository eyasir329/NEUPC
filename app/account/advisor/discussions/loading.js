/**
 * @file Discussions loading page — skeleton UI shown while the
 *   discussions page data resolves.
 *
 * @module AdvisorDiscussionsLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Discussions" />;
}

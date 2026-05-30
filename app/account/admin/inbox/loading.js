/**
 * @file Notices loading page — skeleton UI shown while the
 *   notices page data resolves.
 *
 * @module AdminNoticesLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Notices" />;
}

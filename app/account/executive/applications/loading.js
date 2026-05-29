/**
 * @file Applications loading page — skeleton UI shown while the
 *   applications page data resolves.
 *
 * @module ExecutiveApplicationsLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Applications" />;
}

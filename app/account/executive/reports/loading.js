/**
 * @file Reports loading page — skeleton UI shown while the
 *   reports page data resolves.
 *
 * @module ExecutiveReportsLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="dashboard" title="Reports" />;
}

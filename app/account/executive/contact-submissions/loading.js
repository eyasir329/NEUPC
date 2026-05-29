/**
 * @file Contact Submissions loading page — skeleton UI shown while the
 *   contact submissions page data resolves.
 *
 * @module ExecutiveContactSubmissionsLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Contact Submissions" />;
}

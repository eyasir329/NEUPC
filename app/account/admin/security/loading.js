/**
 * @file Security loading page — skeleton UI shown while the
 *   security page data resolves.
 *
 * @module AdminSecurityLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Security" />;
}

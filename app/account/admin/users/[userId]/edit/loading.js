/**
 * @file Edit User loading page — skeleton UI shown while the
 *   edit user page data resolves.
 *
 * @module AdminEditUserLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="form" title="Edit User" />;
}

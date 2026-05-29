/**
 * @file Users loading page — skeleton UI shown while the
 *   users page data resolves.
 *
 * @module AdminUsersLoading
 */

import AccountLoading from '../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Users" />;
}

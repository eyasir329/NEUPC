/**
 * @file Members loading page — skeleton UI shown while the
 *   members page data resolves.
 *
 * @module ExecutiveMembersLoading
 */

import AccountLoading from '../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Members" />;
}

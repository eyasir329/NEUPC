/**
 * @file Resources loading page — skeleton UI shown while the
 *   resources page data resolves.
 *
 * @module MemberResourcesLoading
 */

import AccountLoading from '../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="cards" title="Resources" />;
}

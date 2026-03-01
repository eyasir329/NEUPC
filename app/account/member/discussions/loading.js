/**
 * @file Discussions loading page — skeleton UI shown while the
 *   discussions page data resolves.
 *
 * @module MemberDiscussionsLoading
 */

import AccountLoading from '../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Discussions" />;
}

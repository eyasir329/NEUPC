/**
 * @file Roadmap loading page — skeleton UI shown while the
 *   roadmap page data resolves.
 *
 * @module MemberRoadmapLoading
 */

import AccountLoading from '../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="cards" title="Roadmap" />;
}

/**
 * @file Recommendations loading page — skeleton UI shown while the
 *   recommendations page data resolves.
 *
 * @module MentorRecommendationsLoading
 */

import AccountLoading from '../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="cards" title="Recommendations" />;
}

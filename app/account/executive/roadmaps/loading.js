/**
 * @file Roadmaps loading page — skeleton UI shown while the
 *   roadmaps page data resolves.
 *
 * @module ExecutiveRoadmapsLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="cards" title="Roadmaps" />;
}

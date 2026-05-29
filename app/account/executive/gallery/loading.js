/**
 * @file Gallery loading page — skeleton UI shown while the
 *   gallery page data resolves.
 *
 * @module ExecutiveGalleryLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="cards" title="Gallery" />;
}

/**
 * @file Gallery not-found page — shown when a resource within the
 *   gallery section cannot be located.
 *
 * @module MemberGalleryNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Gallery Not Found"
      description="The gallery page or resource you're looking for doesn't exist."
      dashboardHref="/account/member"
    />
  );
}

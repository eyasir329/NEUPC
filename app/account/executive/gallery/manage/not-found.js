/**
 * @file Manage Gallery not-found page — shown when a resource within the
 *   manage gallery section cannot be located.
 *
 * @module ExecutiveManageGalleryNotFound
 */

'use client';

import AccountNotFoundState from '../../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Manage Gallery Not Found"
      description="The manage gallery page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}

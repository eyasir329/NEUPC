/**
 * @file Data Export not-found page — shown when a resource within the
 *   data export section cannot be located.
 *
 * @module AdminDataExportNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Data Export Not Found"
      description="The data export page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}

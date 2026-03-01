/**
 * @file Settings not-found page — shown when a resource within the
 *   settings section cannot be located.
 *
 * @module MemberSettingsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Settings Not Found"
      description="The settings page or resource you're looking for doesn't exist."
      dashboardHref="/account/member"
    />
  );
}

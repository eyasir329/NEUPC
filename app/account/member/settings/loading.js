/**
 * @file Settings loading page — skeleton UI shown while the
 *   settings page data resolves.
 *
 * @module MemberSettingsLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="form" title="Settings" />;
}

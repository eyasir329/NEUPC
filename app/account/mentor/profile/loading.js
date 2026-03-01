/**
 * @file Profile loading page — skeleton UI shown while the
 *   profile page data resolves.
 *
 * @module MentorProfileLoading
 */

import AccountLoading from '../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="profile" title="Profile" />;
}

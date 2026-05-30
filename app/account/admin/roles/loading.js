/**
 * @file Roles loading page — skeleton UI shown while the
 *   roles page data resolves.
 *
 * @module AdminRolesLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="cards" title="Roles" />;
}

/**
 * @file Create User loading page — skeleton UI shown while the
 *   create user page data resolves.
 *
 * @module AdminCreateUserLoading
 */

import AccountLoading from '../../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="form" title="Create User" />;
}

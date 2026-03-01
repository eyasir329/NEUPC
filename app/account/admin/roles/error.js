/**
 * @file Roles error boundary — catches runtime errors on the
 *   roles page and presents recovery options.
 *
 * @module AdminRolesError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Roles"
      dashboardHref="/account/admin"
    />
  );
}

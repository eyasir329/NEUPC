/**
 * @file Data Export error boundary — catches runtime errors on the
 *   data export page and presents recovery options.
 *
 * @module AdminDataExportError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Data Export"
      dashboardHref="/account/admin"
    />
  );
}

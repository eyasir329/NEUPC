'use client';

/**
 * @file Admin recognitions error boundary.
 * @module AdminRecognitionsError
 */

import AccountError from '@/app/account/_components/AccountError';

export default function ErrorBoundary({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Recognitions Dashboard"
      dashboardHref="/account/admin/recognitions"
    />
  );
}

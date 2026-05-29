'use client';

/**
 * @file Executive recognitions error boundary.
 * @module ExecutiveRecognitionsError
 */

import AccountError from '@/app/account/_components/AccountError';

export default function ErrorBoundary({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Recognitions Dashboard"
      dashboardHref="/account/executive/recognitions"
    />
  );
}

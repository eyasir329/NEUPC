'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Inbox"
      dashboardHref="/account/advisor"
    />
  );
}

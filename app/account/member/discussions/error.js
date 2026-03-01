/**
 * @file Discussions error boundary — catches runtime errors on the
 *   discussions page and presents recovery options.
 *
 * @module MemberDiscussionsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Discussions"
      dashboardHref="/account/member"
    />
  );
}

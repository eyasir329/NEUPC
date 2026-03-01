/**
 * @file Budget not-found page — shown when a resource within the
 *   budget section cannot be located.
 *
 * @module AdvisorBudgetNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Budget Not Found"
      description="The budget page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}

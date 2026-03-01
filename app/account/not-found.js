/**
 * @file Account 404 page — catches unmatched /account/* routes and
 *   renders an informative not-found screen with role-specific
 *   navigation suggestions.
 *
 * @module AccountNotFound
 */

'use client';

import AccountNotFoundState from './_components/AccountNotFoundState';

export default function AccountNotFound() {
  return (
    <AccountNotFoundState
      title="Page Not Found"
      description="The account page you're looking for doesn't exist or has been moved."
      dashboardHref="/account"
      suggestions={[
        { label: 'Dashboard', href: '/account' },
        { label: 'Events', href: '/events' },
        { label: 'Contact', href: '/contact' },
      ]}
    />
  );
}

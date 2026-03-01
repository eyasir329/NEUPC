/**
 * @file Account error boundary — catches unhandled errors in /account/*
 *   routes and renders a user-friendly recovery screen.
 *
 * @module AccountErrorPage
 */

'use client';

import AccountError from './_components/AccountError';

export default function Error({ error, reset }) {
  return <AccountError error={error} reset={reset} dashboardHref="/account" />;
}

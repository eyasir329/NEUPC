/**
 * @file Account loading page — shown during route transitions within
 *   the /account/* segment while server components resolve.
 *
 * @module AccountLoadingPage
 */

import AccountLoading from './_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="dashboard" />;
}

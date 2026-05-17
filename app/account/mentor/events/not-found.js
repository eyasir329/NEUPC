'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Events Not Found"
      description="The events page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}

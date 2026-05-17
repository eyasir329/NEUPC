'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Event Management Not Found"
      description="The event management page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}

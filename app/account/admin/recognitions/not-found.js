/**
 * @file Admin recognitions not-found handler.
 * @module AdminRecognitionsNotFound
 */

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Recognitions Dashboard Not Found"
      description="The recognitions dashboard page you are trying to access could not be found."
      backHref="/account/admin"
    />
  );
}

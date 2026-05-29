/**
 * @file Executive recognitions not-found handler.
 * @module ExecutiveRecognitionsNotFound
 */

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Recognitions Dashboard Not Found"
      description="The recognitions dashboard page you are trying to access could not be found."
      backHref="/account/executive"
    />
  );
}

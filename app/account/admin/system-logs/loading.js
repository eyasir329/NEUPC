/**
 * @file System Logs loading page — skeleton UI shown while the
 *   system logs page data resolves.
 *
 * @module AdminSystemLogsLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="System Logs" />;
}

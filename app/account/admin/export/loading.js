/**
 * @file Data Export loading page — skeleton UI shown while the
 *   data export page data resolves.
 *
 * @module AdminDataExportLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="form" title="Data Export" />;
}

/**
 * @file Applications loading page — skeleton UI shown while the
 *   applications page data resolves.
 *
 * @module AdminApplicationsLoading
 */

import AccountLoading from '../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Applications" />;
}

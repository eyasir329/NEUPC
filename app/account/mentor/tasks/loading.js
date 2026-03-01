/**
 * @file Tasks loading page — skeleton UI shown while the
 *   tasks page data resolves.
 *
 * @module MentorTasksLoading
 */

import AccountLoading from '../../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="table" title="Tasks" />;
}

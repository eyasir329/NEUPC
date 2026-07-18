/**
 * @file Executive notifications route — notices are surfaced in the
 *   executive inbox, so this route forwards there.
 * @module ExecutiveNotificationsPage
 * @access executive | admin
 */

import { redirect } from 'next/navigation';

export default function ExecutiveNotificationsPage() {
  redirect('/account/executive/inbox');
}

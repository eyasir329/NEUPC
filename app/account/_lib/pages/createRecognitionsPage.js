/**
 * @file Factory for the recognitions management page (achievements +
 *   certificates). Shared verbatim by the admin and executive panels —
 *   they differ only in which roles may enter, so the page body lives here
 *   once and each route supplies its own `allowedRoles` + metadata.
 *
 * @module account/_lib/pages/createRecognitionsPage
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getAchievementsAdmin,
  getUsersForSelector,
  getParticipationRecordsAdmin,
  getJourneyItemsAdmin,
  getAllEvents,
  getAllContests,
  getAllBootcamps,
  getAllCertificates,
  getUsersForCertificates,
} from '@/app/_lib/services/data-service';
import RecognitionsClient from '@/app/account/_components/recognitions/RecognitionsClient';

/**
 * Build a recognitions page component for the given roles.
 * @param {string|string[]} allowedRoles roles permitted to view the page
 * @returns {() => Promise<JSX.Element>} an async server-component page
 */
export function createRecognitionsPage(allowedRoles) {
  return async function RecognitionsPage() {
    const { user } = await requireRole(allowedRoles);

    const [
      achievementsRes,
      users,
      participations,
      journey,
      dbEvents,
      dbContests,
      dbBootcamps,
      dbCertificates,
      dbUsers,
    ] = await Promise.all([
      getAchievementsAdmin().catch(() => ({ achievements: [], stats: {} })),
      getUsersForSelector().catch(() => []),
      getParticipationRecordsAdmin().catch(() => []),
      getJourneyItemsAdmin().catch(() => []),
      getAllEvents().catch(() => []),
      getAllContests().catch(() => []),
      getAllBootcamps().catch(() => []),
      getAllCertificates().catch(() => []),
      getUsersForCertificates().catch(() => []),
    ]);

    const achievements = achievementsRes?.achievements ?? [];
    const stats = achievementsRes?.stats ?? {};

    return (
      <RecognitionsClient
        // Achievements props
        initialAchievements={achievements}
        stats={stats}
        users={users}
        initialParticipations={participations}
        initialJourney={journey}
        // Certificates props
        dbEvents={dbEvents}
        dbContests={dbContests}
        dbBootcamps={dbBootcamps}
        dbCertificates={dbCertificates}
        dbUsers={dbUsers}
        userId={user.id}
      />
    );
  };
}

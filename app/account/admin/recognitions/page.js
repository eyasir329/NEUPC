/**
 * @file Admin recognitions management page (server component).
 * Combines both Achievements and Certificates dashboards into a single, unified experience.
 *
 * @module AdminRecognitionsPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
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
} from '@/app/_lib/data-service';
import RecognitionsClient from './_components/RecognitionsClient';

export const metadata = { title: 'Recognitions | Admin | NEUPC' };

export default async function AdminRecognitionsPage() {
  const { user } = await requireRole(['admin']);

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
      // Achievements Props
      initialAchievements={achievements}
      stats={stats}
      users={users}
      initialParticipations={participations}
      initialJourney={journey}
      
      // Certificates Props
      dbEvents={dbEvents}
      dbContests={dbContests}
      dbBootcamps={dbBootcamps}
      dbCertificates={dbCertificates}
      dbUsers={dbUsers}
      userId={user.id}
    />
  );
}

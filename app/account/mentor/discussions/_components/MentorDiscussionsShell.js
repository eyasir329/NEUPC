/**
 * @file Mentor discussions shell component
 * @module MentorDiscussionsShell
 */

'use client';

import { RefreshCw, HelpCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { StaffDiscussionsClient } from '@/app/_components/discussions';
import { PageShell, PageHeader } from '@/app/account/_components/ui';

export default function MentorDiscussionsShell({
  initialDiscussions,
  initialStats,
  userId,
  userEmail,
}) {
  return (
    <PageShell>
      <PageHeader
        icon={HelpCircle}
        title="Help Desk"
        subtitle="Manage discussions, respond to members, and track issues"
        accent="blue"
      />
      <StaffDiscussionsClient
        initialDiscussions={initialDiscussions}
        initialStats={initialStats}
        userId={userId}
        userEmail={userEmail}
        userRole="mentor"
        hideHeader
      />
    </PageShell>
  );
}

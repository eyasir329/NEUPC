/**
 * @file Read-only feed of upcoming external coding contests
 * @module api/member/daily-activity/contests
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch upcoming contests (start_time >= today) — global feed, no user filter
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('external_contests')
      .select('*')
      .gte('start_time', today)
      .order('start_time', { ascending: true })
      .limit(30);

    if (error) throw error;

    // Map to the Todoist task-like shape the UI expects
    const contests = (data || []).map((c) => {
      const startDate = new Date(c.start_time);
      const dueDate = startDate.toISOString().split('T')[0];
      const contestTime = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const durationMin = c.duration_seconds ? Math.round(c.duration_seconds / 60) : null;

      return {
        id: c.id,
        title: c.name,
        description: `${c.platform} contest`,
        completed: false,
        createdAt: c.created_at,
        dueDate,
        priority: 2,
        projectId: undefined,
        labels: ['Contests'],
        subtasks: [],
        comments: [],
        isArchived: false,
        isContest: true,
        contestPlatform: c.platform?.toLowerCase() || 'other',
        contestDuration: durationMin ? `${durationMin}m` : null,
        contestTime,
        contestUrl: c.url || null,
      };
    });

    return NextResponse.json(contests);
  } catch (err) {
    console.error('[contests GET]', err);
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 });
  }
}

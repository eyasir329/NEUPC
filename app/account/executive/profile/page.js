/**
 * @file Executive profile page — displays the authenticated executive’s
 *   personal info, member profile details, and current committee position
 *   so they can review or update their data.
 * @module ExecutiveProfilePage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import {
  isV2SchemaAvailable,
  getUserHandlesV2,
} from '@/app/_lib/services/problem-solving-v2-helpers';
import ExecutiveProfileClient from './_components/ExecutiveProfileClient';

export const metadata = { title: 'Profile | Executive | NEUPC' };

export default async function ExecutiveProfilePage() {
  const { user } = await requireRole(['executive', 'admin']);

  // Fetch basic profiles and committee info
  const [{ data: memberProfile }, { data: committeeInfo }] = await Promise.all([
    supabaseAdmin
      .from('member_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabaseAdmin
      .from('committee_members')
      .select(
        `id, term_start, term_end, is_current, bio,
        position:committee_positions(title, category)`
      )
      .eq('user_id', user.id)
      .eq('is_current', true)
      .maybeSingle(),
  ]);

  // Dynamically fetch user handles based on active schema format (V1 or V2)
  let userHandles = [];
  try {
    const useV2 = await isV2SchemaAvailable();
    if (useV2) {
      userHandles = await getUserHandlesV2(user.id);
    } else {
      const { data } = await supabaseAdmin
        .from('user_handles')
        .select('platform, handle')
        .eq('user_id', user.id);
      userHandles = data || [];
    }
  } catch (err) {
    console.error('Error fetching user handles in profile page:', err);
  }

  // Merge handles into memberProfile for backward compatibility
  const handlesMap = {};
  (userHandles || []).forEach((h) => {
    handlesMap[`${h.platform}_handle`] = h.handle;
  });

  const enrichedProfile = {
    ...(memberProfile || {}),
    ...handlesMap,
  };

  return (
    <ExecutiveProfileClient
      user={user}
      memberProfile={enrichedProfile}
      committeeInfo={committeeInfo}
    />
  );
}

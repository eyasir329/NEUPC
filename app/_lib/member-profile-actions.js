'use server';

import { revalidatePath } from 'next/cache';
import { auth } from './auth';
import { supabaseAdmin } from './supabase';
import { getUserRoles, getUserByEmail } from './data-service';

async function requireActiveMember() {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('member')) throw new Error('Not a member');

  const user = await getUserByEmail(session.user.email);
  if (!user) throw new Error('User not found');
  if (user.account_status !== 'active' || user.is_active === false)
    throw new Error('Account not active');

  return user;
}

// ── Update basic user info (full_name, phone) ────────────────────────────────
export async function updateMemberInfoAction(formData) {
  try {
    const user = await requireActiveMember();

    const full_name = formData.get('full_name')?.trim();
    const phone = formData.get('phone')?.trim() || null;
    const avatar_url = formData.get('avatar_url')?.trim() || null;

    const updates = { updated_at: new Date().toISOString() };
    if (full_name) updates.full_name = full_name;
    updates.phone = phone;
    if (avatar_url !== null) updates.avatar_url = avatar_url;

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/account/member/profile');
    revalidatePath('/account/member/settings');
    revalidatePath('/account');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

// ── Update member profile (handles, bio, skills, etc.) ───────────────────────
export async function updateMemberProfileAction(formData) {
  try {
    const user = await requireActiveMember();

    const rawSkills = formData.get('skills') || '';
    const rawInterests = formData.get('interests') || '';
    const skills = rawSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const interests = rawInterests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updates = {
      bio: formData.get('bio')?.trim() || null,
      linkedin: formData.get('linkedin')?.trim() || null,
      github: formData.get('github')?.trim() || null,
      codeforces_handle: formData.get('codeforces_handle')?.trim() || null,
      vjudge_handle: formData.get('vjudge_handle')?.trim() || null,
      atcoder_handle: formData.get('atcoder_handle')?.trim() || null,
      leetcode_handle: formData.get('leetcode_handle')?.trim() || null,
      skills: skills.length > 0 ? skills : null,
      interests: interests.length > 0 ? interests : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('member_profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/account/member/profile');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

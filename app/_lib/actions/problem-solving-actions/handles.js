/**
 * @file Platform handle actions: connect, disconnect, cleanup.
 * @module problem-solving-actions/handles
 */

'use server';

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { V2_TABLES, getPlatformId, upsertUserHandleV2 } from '@/app/_lib/services/problem-solving-v2-helpers';
import { revalidatePath } from 'next/cache';
import {
  SUPPORTED_PLATFORMS,
  normalizeHandleForPlatform,
  purgePlatformDataForUser,
  verifyHandle,
} from './_helpers';

export async function connectHandleAction(platform, handle, authToken = null) {
  try {
    const { user } = await requireRole('member');
    const normalizedHandle = normalizeHandleForPlatform(platform, handle);

    // Validate input
    if (!platform || !normalizedHandle) {
      return { success: false, error: 'Platform and handle are required' };
    }

    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      return {
        success: false,
        error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(', ')}`,
      };
    }

    if (normalizedHandle.length < 1 || normalizedHandle.length > 100) {
      return {
        success: false,
        error: 'Handle must be between 1 and 100 characters',
      };
    }

    if (
      platform === 'leetcode' &&
      !/^[A-Za-z0-9._-]{1,100}$/.test(normalizedHandle)
    ) {
      return {
        success: false,
        error:
          'Invalid LeetCode handle format. Use username, @username, or profile URL.',
      };
    }

    // Get platform ID
    const platformId = await getPlatformId(platform);
    if (!platformId) {
      return {
        success: false,
        error: `Unknown platform: ${platform}`,
      };
    }

    // Check if handle is already connected to another user
    const { data: existingHandle } = await supabaseAdmin
      .from(V2_TABLES.USER_HANDLES)
      .select('user_id')
      .eq('platform_id', platformId)
      .eq('handle', normalizedHandle)
      .neq('user_id', user.id)
      .maybeSingle();

    if (existingHandle) {
      return {
        success: false,
        error: 'This handle is already connected to another account',
      };
    }

    // Verify handle exists on the platform
    let verificationResult = null;
    try {
      verificationResult = await verifyHandle(platform, normalizedHandle);
    } catch (verifyError) {
      return {
        success: false,
        error: `Could not verify handle on ${platform}: ${verifyError.message}`,
      };
    }

    // Handle is considered verified if we successfully fetched user info from the platform
    const canonicalHandle =
      verificationResult?.username ||
      verificationResult?.handle ||
      normalizedHandle;
    const isVerified = Boolean(verificationResult);

    // Upsert handle (include auth_token if provided)
    const extraFields = {
      is_verified: isVerified,
      verified_at: isVerified ? new Date().toISOString() : null,
      current_rating: verificationResult?.rating,
      max_rating: verificationResult?.maxRating,
      rank_title: verificationResult?.rank,
      avatar_url: verificationResult?.avatar,
    };
    if (authToken) {
      extraFields.auth_token = authToken;
    }

    const savedHandle = await upsertUserHandleV2(
      user.id,
      platform,
      canonicalHandle,
      extraFields
    );

    // Create fetch job - check if exists first to avoid constraint issues
    const { data: existingJob } = await supabaseAdmin
      .from(V2_TABLES.SYNC_JOBS)
      .select('id')
      .eq('user_id', user.id)
      .eq('platform_id', platformId)
      .eq('job_type', 'submissions')
      .maybeSingle();

    if (!existingJob) {
      await supabaseAdmin.from(V2_TABLES.SYNC_JOBS).insert({
        user_id: user.id,
        platform_id: platformId,
        job_type: 'submissions',
        status: 'pending',
        scheduled_at: new Date().toISOString(),
      });
    }

    // Revalidate to show updated handle connection
    revalidatePath('/account/member/problem-solving', 'page');

    return {
      success: true,
      data: {
        handle: savedHandle,
        message: `Successfully connected ${savedHandle} on ${platform}`,
        verified: isVerified,
      },
    };
  } catch (error) {
    console.error('Error connecting handle:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect an online judge handle
 */
export async function disconnectHandleAction(platform) {
  try {
    const { user } = await requireRole('member');

    if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
      return { success: false, error: 'Valid platform is required' };
    }

    const platformId = await getPlatformId(platform);
    if (!platformId) {
      return { success: false, error: `Unknown platform: ${platform}` };
    }

    let cleanupData = null;
    if (platform === 'spoj') {
      cleanupData = await purgePlatformDataForUser({
        userId: user.id,
        platformId,
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from(V2_TABLES.USER_HANDLES)
      .delete()
      .eq('user_id', user.id)
      .eq('platform_id', platformId);

    if (deleteError) throw deleteError;

    // Also delete any pending sync jobs
    await supabaseAdmin
      .from(V2_TABLES.SYNC_JOBS)
      .delete()
      .eq('user_id', user.id)
      .eq('platform_id', platformId);

    // Revalidate to show updated handle disconnection
    revalidatePath('/account/member/problem-solving', 'page');

    if (cleanupData) {
      return {
        success: true,
        message:
          'Disconnected SPOJ handle and removed previous SPOJ track data',
        data: cleanupData,
      };
    }

    return { success: true, message: `Disconnected ${platform} handle` };
  } catch (error) {
    console.error('Error disconnecting handle:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove all previously stored LeetCode data for the current user.
 *
 * LeetCode syncing is extension-only, so this action performs a full
 * user-scoped purge to let the user re-import clean data from the browser
 * extension.
 */
export async function cleanupLeetCodeDataAction() {
  try {
    const { user } = await requireRole('member');

    const platform = 'leetcode';
    const platformId = await getPlatformId(platform);
    if (!platformId) {
      return { success: false, error: 'LeetCode platform is not configured' };
    }

    const { data: handleRecord, error: handleError } = await supabaseAdmin
      .from(V2_TABLES.USER_HANDLES)
      .select('handle')
      .eq('user_id', user.id)
      .eq('platform_id', platformId)
      .maybeSingle();

    if (handleError) throw handleError;

    const connectedHandle = normalizeHandleForPlatform(
      platform,
      handleRecord?.handle
    );

    if (!connectedHandle) {
      return {
        success: false,
        error: 'No connected LeetCode handle found for this account',
      };
    }

    const cleanupData = await purgePlatformDataForUser({
      userId: user.id,
      platformId,
    });

    revalidatePath('/account/member/problem-solving', 'page');
    revalidatePath('/api/problem-solving/problems', 'page');
    revalidatePath('/api/problem-solving/stats', 'page');

    return {
      success: true,
      data: {
        handle: connectedHandle,
        cleanupMode: 'full_purge',
        ...cleanupData,
        message:
          cleanupData.totalDeleted > 0
            ? 'Removed previous LeetCode data. Use the browser extension to extract fresh history.'
            : 'No previous LeetCode data found. Use the browser extension to extract data.',
      },
    };
  } catch (error) {
    console.error('Error cleaning LeetCode data:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SYNC DATA
// ============================================


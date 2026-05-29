/**
 * @file Internal data-layer helpers shared across the split data modules.
 */

import {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
} from '@/app/_lib/integrations/supabase';

export async function _log(userId, action, entityType, entityId, details = {}) {
  try {
    await supabaseAdmin.from('activity_logs').insert([
      {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      },
    ]);
  } catch {
    // Silently ignore errors
  }
}

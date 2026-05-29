/**
 * @file usaco — split from the problem-solving-services module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import {
  V2_TABLES,
  getPlatformCode,
  getPlatformId,
  isV2SchemaAvailable,
} from '@/app/_lib/services/problem-solving-v2-helpers';

// ============================================
// USACO SERVICE
// ============================================
export class USACOService {
  constructor() {
    this.baseUrl = 'https://usaco.org';
  }

  async getUserProfile(username) {
    // USACO doesn't have a public API - return placeholder
    return {
      username,
      totalSolved: 0,
      note: 'USACO does not provide a public API. Manual entry or scraping required.',
    };
  }

  async getSubmissions(_username, _fromTimestamp = null) {
    // USACO requires authentication - return empty
    return [];
  }

  async getCache(key) {
    const { data } = await supabaseAdmin
      .from('api_cache')
      .select('cache_value')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single();
    return data?.cache_value;
  }

  async setCache(key, value, ttlSeconds) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await supabaseAdmin.from('api_cache').upsert({
      cache_key: key,
      cache_value: value,
      expires_at: expiresAt,
    });
  }
}

/**
 * @file Resource tag upsert helper.
 * NOT a server action — lives outside any 'use server' module so it is
 * never exposed as a client-callable endpoint (it mutates tag mappings
 * with the admin client and has no auth check of its own; callers must
 * be guarded actions).
 *
 * @module resource-tags
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { slugify } from '@/app/_lib/resources/constants';
import { parseTags } from '@/app/_lib/resources/resource-schemas';

export async function upsertTags(resourceId, rawTags = []) {
  const tags = parseTags(rawTags);

  await supabaseAdmin
    .from('resource_tag_map')
    .delete()
    .eq('resource_id', resourceId);

  if (!tags.length) return;

  const prepared = tags.map((name) => ({
    name,
    slug: slugify(name) || name.toLowerCase(),
  }));

  const { error: tagInsertError } = await supabaseAdmin
    .from('resource_tags')
    .upsert(prepared, { onConflict: 'slug' });

  if (tagInsertError) throw new Error(tagInsertError.message);

  const { data: dbTags, error: tagsFetchError } = await supabaseAdmin
    .from('resource_tags')
    .select('id,slug')
    .in(
      'slug',
      prepared.map((t) => t.slug)
    );

  if (tagsFetchError) throw new Error(tagsFetchError.message);

  if (!dbTags?.length) return;

  const maps = dbTags.map((t) => ({ resource_id: resourceId, tag_id: t.id }));
  const { error: mapError } = await supabaseAdmin
    .from('resource_tag_map')
    .upsert(maps, { onConflict: 'resource_id,tag_id' });

  if (mapError) throw new Error(mapError.message);
}

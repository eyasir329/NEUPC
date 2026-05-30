/**
 * @file roadmaps data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all roadmaps.
export async function getAllRoadmaps() {
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get published roadmaps, sorted by view count (includes content for stage data).
export async function getPublishedRoadmaps() {
  const { data, error } = await supabase
    .from('roadmaps')
    .select(
      'id, slug, title, description, category, difficulty, thumbnail, estimated_duration, prerequisites, content, views, is_featured, created_at'
    )
    .eq('status', 'published')
    .order('views', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get a published roadmap by slug.
export async function getRoadmapBySlug(slug) {
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*, users!roadmaps_created_by_fkey(id, full_name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get published roadmaps by category, sorted by view count (includes content).
export async function getRoadmapsByCategory(category) {
  const { data, error } = await supabase
    .from('roadmaps')
    .select(
      'id, slug, title, description, category, difficulty, thumbnail, estimated_duration, prerequisites, content, views, is_featured, created_at'
    )
    .eq('category', category)
    .eq('status', 'published')
    .order('views', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a roadmap.
export async function createRoadmap(roadmapData) {
  const { data, error } = await supabase
    .from('roadmaps')
    .insert([roadmapData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a roadmap.
export async function updateRoadmap(id, updates) {
  const { data, error } = await supabase
    .from('roadmaps')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a roadmap.
export async function deleteRoadmap(id) {
  const { error } = await supabaseAdmin.from('roadmaps').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Increment view count for a roadmap.
export async function incrementRoadmapViews(id) {
  let newViews = 1;
  const { error } = await supabaseAdmin.rpc('increment_roadmap_views', {
    roadmap_id: id,
  });

  if (error) {
    const { data: roadmap } = await supabaseAdmin
      .from('roadmaps')
      .select('views')
      .eq('id', id)
      .single();
    if (roadmap) {
      newViews = (roadmap.views || 0) + 1;
      await supabaseAdmin
        .from('roadmaps')
        .update({ views: newViews })
        .eq('id', id);
    }
  } else {
    // Fetch live views directly after successful RPC
    const { data: current } = await supabaseAdmin
      .from('roadmaps')
      .select('views')
      .eq('id', id)
      .single();
    if (current) newViews = current.views;
  }

  return { success: true, views: newViews };
}

// Get featured roadmaps by category.
export async function getFeaturedRoadmapsByCategory(category) {
  const { data, error } = await supabase
    .from('roadmaps')
    .select(
      'id, slug, title, description, difficulty, thumbnail, estimated_duration, views'
    )
    .eq('category', category)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('views', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

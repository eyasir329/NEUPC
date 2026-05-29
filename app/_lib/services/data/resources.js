/**
 * @file resources data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all resources for admin view.
export async function getResourcesAdmin() {
  const { data, error } = await supabaseAdmin
    .from('resources')
    .select('*, users!resources_created_by_fkey(id, full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const resources = data ?? [];

  const stats = {
    total: resources.length,
    featured: resources.filter((r) => r.is_featured).length,
    free: resources.filter((r) => r.is_free).length,
    paid: resources.filter((r) => !r.is_free).length,
    totalUpvotes: resources.reduce((s, r) => s + (r.upvotes ?? 0), 0),
    byType: resources.reduce((acc, r) => {
      acc[r.resource_type] = (acc[r.resource_type] ?? 0) + 1;
      return acc;
    }, {}),
  };

  return { resources, stats };
}

// Get all resources.
export async function getAllResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get resources by category.
export async function getResourcesByCategory(category) {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('category', category)
    .order('upvotes', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get resources by difficulty level.
export async function getResourcesByDifficulty(difficulty) {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('difficulty', difficulty)
    .order('upvotes', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get featured resources.
export async function getFeaturedResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_featured', true)
    .order('upvotes', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get free resources.
export async function getFreeResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('is_free', true)
    .order('upvotes', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a resource.
export async function createResource(resourceData) {
  const { data, error } = await supabase
    .from('resources')
    .insert([resourceData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a resource.
export async function updateResource(id, updates) {
  const { data, error } = await supabase
    .from('resources')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a resource.
export async function deleteResource(id) {
  const { error } = await supabaseAdmin.from('resources').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function searchResources(query) {
  const { data, error } = await supabase
    .from('resources')
    .select('id, title, description, category, difficulty, resource_type')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(20);
  if (error) throw new Error(error.message);
  return data;
}

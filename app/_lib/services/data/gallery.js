/**
 * @file gallery data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get gallery items for an event.
export async function getEventGallery(eventId) {
  const { data, error } = await supabaseAdmin
    .from('event_gallery')
    .select('*')
    .eq('event_id', eventId)
    .order('display_order');
  if (error) throw new Error(error.message);
  return data;
}

// Get all event_gallery items (admin) — includes event title join.
export async function getAllEventGalleryAdmin() {
  const { data, error } = await supabaseAdmin
    .from('event_gallery')
    .select('*, events(id, title)')
    .order('event_id')
    .order('display_order');
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Get all event_gallery items (public) — includes event title/category join.
export async function getAllEventGalleryPublic() {
  const { data, error } = await supabaseAdmin
    .from('event_gallery')
    .select('*, events(id, title, category, start_date, status)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Add a gallery item to an event.
export async function addEventGalleryItem(galleryData) {
  const { data, error } = await supabase
    .from('event_gallery')
    .insert([galleryData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a gallery item.
export async function deleteEventGalleryItem(id) {
  const { error } = await supabaseAdmin
    .from('event_gallery')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get all gallery items for admin view.
export async function getGalleryAdmin() {
  const { data, error } = await supabaseAdmin
    .from('gallery_items')
    .select(
      `*, 
       users!gallery_items_uploaded_by_fkey(id, full_name, avatar_url),
       events!gallery_items_event_id_fkey(id, title, slug)`
    )
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const items = data ?? [];

  const stats = {
    total: items.length,
    images: items.filter((i) => i.type === 'image').length,
    videos: items.filter((i) => i.type === 'video').length,
    featured: items.filter((i) => i.is_featured).length,
    categories: [...new Set(items.map((i) => i.category).filter(Boolean))]
      .length,
    linkedEvents: [...new Set(items.map((i) => i.event_id).filter(Boolean))]
      .length,
  };

  return { items, stats };
}

// Get all gallery items.
export async function getAllGalleryItems() {
  const { data, error } = await supabaseAdmin
    .from('gallery_items')
    .select('*')
    .order('display_order');
  if (error) throw new Error(error.message);
  return data;
}

// Get featured gallery items.
export async function getFeaturedGalleryItems() {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('is_featured', true)
    .order('display_order');
  if (error) throw new Error(error.message);
  return data;
}

// Get gallery items for an event.
export async function getGalleryItemsByEvent(eventId) {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('event_id', eventId)
    .not('event_id', 'is', null)
    .order('display_order');
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Get gallery items by category.
export async function getGalleryItemsByCategory(category) {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('category', category)
    .order('display_order');
  if (error) throw new Error(error.message);
  return data;
}

// Add a gallery item.
export async function addGalleryItem(itemData) {
  const { data, error } = await supabase
    .from('gallery_items')
    .insert([itemData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a gallery item.
export async function updateGalleryItem(id, updates) {
  const { data, error } = await supabase
    .from('gallery_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a gallery item.
export async function deleteGalleryItem(id) {
  const { error } = await supabaseAdmin
    .from('gallery_items')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

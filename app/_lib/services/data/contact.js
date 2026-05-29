/**
 * @file contact data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

/**
 * Get FAQ categories with items.
 */
export async function getFAQs() {
  const { data, error } = await supabase
    .from('faq_categories')
    .select(
      `
      *,
      items:faq_items(*)
    `
    )
    .order('display_order')
    .order('display_order', { foreignTable: 'faq_items' });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Search FAQs by keyword.
 */
export async function searchFAQs(query) {
  const { data, error } = await supabase
    .from('faq_items')
    .select(
      `
      *,
      category:faq_categories(id, title, icon)
    `
    )
    .or(
      `question.ilike.%${query}%,answer.ilike.%${query}%,keywords.cs.{${query}}`
    )
    .limit(20);

  if (error) throw new Error(error.message);
  return data;
}

// Get all contact form submissions.
export async function getAllContactSubmissions() {
  const { data, error } = await supabaseAdmin
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get new/unread contact submissions.
export async function getNewContactSubmissions() {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .eq('status', 'new')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get a contact submission by ID.
export async function getContactSubmissionById(id) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Create a contact form submission.
export async function createContactSubmission(submissionData) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert([submissionData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update status of a contact submission.
export async function updateContactSubmissionStatus(
  id,
  status,
  repliedBy = null
) {
  const updates = {
    status,
    ...(repliedBy && {
      replied_by: repliedBy,
      replied_at: new Date().toISOString(),
    }),
  };
  const { data, error } = await supabase
    .from('contact_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

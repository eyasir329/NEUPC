/**
 * @file certificates data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get certificates for a user.
export async function getUserCertificates(userId) {
  const { data, error } = await supabase
    .from('certificates')
    .select(
      '*, events(id, title, slug), contests(id, title, slug), bootcamps(id, title, slug)'
    )
    .eq('recipient_id', userId)
    .order('issue_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get a certificate by certificate number.
export async function getCertificateByNumber(certificateNumber) {
  const { data, error } = await supabase
    .from('certificates')
    .select(
      `
      *,
      users!certificates_recipient_id_fkey(id, full_name, email),
      events(id, title),
      contests(id, title)
    `
    )
    .eq('certificate_number', certificateNumber)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Issue a certificate.
export async function issueCertificate(certificateData) {
  const { data, error } = await supabase
    .from('certificates')
    .insert([certificateData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Verify a certificate by number.
export async function verifyCertificate(certificateNumber) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*, users!certificates_recipient_id_fkey(full_name)')
    .eq('certificate_number', certificateNumber)
    .eq('verified', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a certificate.
export async function deleteCertificate(id) {
  const { error } = await supabaseAdmin
    .from('certificates')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get all certificates.
export async function getAllCertificates() {
  const { data, error } = await supabase
    .from('certificates')
    .select(
      '*, users!certificates_recipient_id_fkey(id, full_name, email), events(id, title, slug), contests(id, title, slug), bootcamps(id, title, slug)'
    )
    .order('issue_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Get users for certificate selection.
export async function getUsersForCertificates() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email')
    .order('full_name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function bulkIssueCertificates(eventId, certificateData) {
  const { data, error } = await supabase
    .from('certificates')
    .insert(certificateData)
    .select();
  if (error) throw new Error(error.message);
  return data;
}

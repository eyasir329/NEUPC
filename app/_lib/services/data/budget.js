/**
 * @file budget data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all budget entries.
export async function getAllBudgetEntries() {
  const { data, error } = await supabase
    .from('budget_entries')
    .select(
      '*, events(id, title), users!budget_entries_created_by_fkey(id, full_name)'
    )
    .order('transaction_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get budget entries by type.
export async function getBudgetEntriesByType(type) {
  const { data, error } = await supabase
    .from('budget_entries')
    .select('*, events(id, title)')
    .eq('entry_type', type)
    .order('transaction_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get aggregate budget summary.
export async function getBudgetSummary() {
  const [{ data: income }, { data: expenses }] = await Promise.all([
    supabase.from('budget_entries').select('amount').eq('entry_type', 'income'),
    supabase
      .from('budget_entries')
      .select('amount')
      .eq('entry_type', 'expense'),
  ]);
  const totalIncome =
    income?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  const totalExpenses =
    expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
}

// Create a budget entry.
export async function createBudgetEntry(entryData) {
  const { data, error } = await supabase
    .from('budget_entries')
    .insert([entryData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Approve a budget entry.
export async function approveBudgetEntry(id, approvedBy) {
  const { data, error } = await supabase
    .from('budget_entries')
    .update({ approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a budget entry.
export async function deleteBudgetEntry(id) {
  const { error } = await supabaseAdmin
    .from('budget_entries')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

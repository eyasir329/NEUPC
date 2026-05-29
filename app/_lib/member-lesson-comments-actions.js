/**
 * @file Lesson comment server actions
 * @module member-lesson-comments-actions
 */

'use server';

import { supabaseAdmin } from './supabase';
import { revalidatePath } from 'next/cache';
import { requireActionSession } from './action-guard';

export async function getLessonCommentsAction(lessonId) {
  if (!lessonId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('lesson_comments')
      .select('*, users(id, full_name, avatar_url)')
      .eq('lesson_id', lessonId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Failed to get lesson comments:', err);
    return [];
  }
}

export async function addLessonCommentAction(formData) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const user = authResult.user;

  const lessonId = formData.get('lessonId');
  const content = formData.get('content')?.trim();
  const parentId = formData.get('parentId') || null;

  if (!lessonId) return { error: 'Lesson ID is required.' };
  if (!content || content.length < 2) return { error: 'Comment is too short.' };
  if (content.length > 2000)
    return { error: 'Comment must be under 2000 characters.' };

  const { data, error } = await supabaseAdmin
    .from('lesson_comments')
    .insert([
      {
        lesson_id: lessonId,
        user_id: user.id,
        parent_id: parentId,
        content,
        is_approved: true,
      },
    ])
    .select('*, users(id, full_name, avatar_url)')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/account/member/bootcamps');
  revalidatePath('/account/mentor/bootcamps');
  return { comment: data };
}

export async function editLessonCommentAction(formData) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const user = authResult.user;

  const id = formData.get('id');
  const content = formData.get('content')?.trim();

  if (!id) return { error: 'Comment ID is required.' };
  if (!content || content.length < 2) return { error: 'Comment is too short.' };
  if (content.length > 2000)
    return { error: 'Comment must be under 2000 characters.' };

  const { data, error } = await supabaseAdmin
    .from('lesson_comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, users(id, full_name, avatar_url)')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/account/member/bootcamps');
  revalidatePath('/account/mentor/bootcamps');
  return { comment: data };
}

export async function deleteLessonCommentAction(formData) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const user = authResult.user;

  const id = formData.get('id');
  if (!id) return { error: 'Comment ID is required.' };

  const { error } = await supabaseAdmin
    .from('lesson_comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/account/member/bootcamps');
  revalidatePath('/account/mentor/bootcamps');
  return { success: true };
}

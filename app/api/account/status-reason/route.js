/**
 * @file Status reason API route — secured with session auth.
 * @module StatusReasonRoute
 */

import { supabaseAdmin } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';
import { auth } from '@/app/_lib/auth';
import { getUserByEmail } from '@/app/_lib/data-service';
import { NextResponse } from 'next/server';
import { sanitizeText } from '@/app/_lib/validation';

export async function GET(request) {
  try {
    // Auth check — user can only fetch their own status reason
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Users can only view their own status reason
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('status_reason')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Database error in GET /api/account/status-reason');
      return NextResponse.json(
        { error: 'Failed to fetch reason' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reason: data?.status_reason || null });
  } catch (error) {
    console.error('Error in GET /api/account/status-reason:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Auth check — only admins can update status reasons
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { getUserRoles } = await import('@/app/_lib/data-service');
    const userRoles = await getUserRoles(session.user.email);

    if (!userRoles.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const userId = body.userId;
    const reason = sanitizeText(body.reason, 1000);

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'User ID and reason are required' },
        { status: 400 }
      );
    }

    // Verify target user exists
    const { data: userExists } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const adminUser = await getUserByEmail(session.user.email);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        status_reason: reason,
        status_changed_by: adminUser?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('status_reason');

    if (error) {
      console.error('Database error in PUT /api/account/status-reason');
      return NextResponse.json(
        { error: 'Failed to update reason' },
        { status: 500 }
      );
    }

    revalidatePath('/account');
    revalidatePath('/account/admin/users');

    return NextResponse.json({
      reason: data?.[0]?.status_reason || reason,
      message: 'Reason updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/account/status-reason:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

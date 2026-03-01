/**
 * @file Edit API route — secured with field whitelisting.
 * @module EditRoute
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth';
import {
  updateUser,
  getUserRoles,
  getUserByEmail,
} from '@/app/_lib/data-service';
import { pickAllowedFields } from '@/app/_lib/validation';

/** Fields that can be updated via this endpoint. */
const ALLOWED_USER_FIELDS = [
  'full_name',
  'email',
  'phone',
  'avatar_url',
  'bio',
  'account_status',
  'status_reason',
  'department',
  'batch',
  'student_id',
  'linkedin',
  'github',
  'codeforces_handle',
  'vjudge_handle',
  'atcoder_handle',
  'leetcode_handle',
];

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userRoles = await getUserRoles(session.user.email);
    if (!userRoles.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Verify admin account is active
    const adminUser = await getUserByEmail(session.user.email);
    if (!adminUser || adminUser.account_status !== 'active') {
      return NextResponse.json(
        { error: 'Admin account not active' },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Whitelist fields — prevent mass-assignment attacks
    const updates = pickAllowedFields(body, ALLOWED_USER_FIELDS);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided' },
        { status: 400 }
      );
    }

    await updateUser(userId, updates, adminUser.id);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error(`API Error [${new Date().toISOString()}]:`, error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @file [userId] API route — updates a user's name, email, and role.
 * @module [userId]Route
 */

import { NextResponse } from 'next/server';
import { requireApiAuth, isAuthError } from '@/app/_lib/auth/api-guard';
import { updateUser, updateAdminUser } from '@/app/_lib/services/data-service';
import { revalidatePath } from 'next/cache';

export async function PUT(request, { params }) {
  try {
    const authResult = await requireApiAuth(['admin', 'executive']);
    if (isAuthError(authResult)) return authResult;

    const adminId = authResult.user.id;
    const { userId } = await params;
    const { fullName, email, role } = await request.json();

    if (!fullName || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // full_name + role (user_roles table) via the admin-audited path
    await updateAdminUser(userId, { fullName, role }, adminId);

    // email lives on the users row
    await updateUser(userId, { email });

    revalidatePath('/account/admin/users');
    revalidatePath('/account/executive/users');

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error(`API Error [${new Date().toISOString()}]:`, error);
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

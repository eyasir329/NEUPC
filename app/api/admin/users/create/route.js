/**
 * @file Create API route
 * @module CreateRoute
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth';
import { createUser, getUserRoles } from '@/app/_lib/data-service';

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userRoles = await getUserRoles(session.user.email);
    if (!userRoles.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const adminId = session.user.id;
    const { fullName, email, role } = await request.json();

    if (!fullName || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { success, userId, error } = await createUser(
      fullName,
      email,
      role,
      adminId
    );

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId,
    });
  } catch (error) {
    console.error(`API Error [${new Date().toISOString()}]:`, error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

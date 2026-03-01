/**
 * @file route
 * @module route
 */

import { auth } from '@/app/_lib/auth';
import {
  getUserRoles,
  getAllUsers,
  getUserStats,
} from '@/app/_lib/data-service';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRoles = await getUserRoles(session.user.email);
    if (!userRoles.includes('admin')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle different actions
    if (action === 'stats') {
      const stats = await getUserStats();
      return NextResponse.json(stats);
    }

    // Default: return all users
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

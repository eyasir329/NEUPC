
import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth';
import {
  suspendUser,
  activateUser,
  banUser,
  deleteUser,
  approveMember,
  getUserRoles,
} from '@/app/_lib/data-service';

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
    const { action, userId, reason } = await request.json();

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'Missing action or userId' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'suspend':
        await suspendUser(userId, adminId, reason);
        return NextResponse.json({
          success: true,
          message: 'User suspended successfully',
        });

      case 'activate':
        await activateUser(userId, adminId, reason);
        return NextResponse.json({
          success: true,
          message: 'User activated successfully',
        });

      case 'ban':
        await banUser(userId, adminId, reason);
        return NextResponse.json({
          success: true,
          message: 'User banned successfully',
        });

      case 'delete':
        await deleteUser(userId, adminId, reason);
        return NextResponse.json({
          success: true,
          message: 'User deleted successfully',
        });

      case 'approve':
        await approveMember(userId, adminId);
        return NextResponse.json({
          success: true,
          message: 'User approved successfully',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error(`API Error [${new Date().toISOString()}]:`, error);
    return NextResponse.json(
      { error: 'An internal server error occurred', details: error.message },
      { status: 500 }
    );
  }
}

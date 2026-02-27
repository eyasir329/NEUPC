
import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth';
import { updateUser, getUserRoles } from '@/app/_lib/data-service';

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

    const adminId = session.user.id;
    const { userId } = params;
    const updates = await request.json();

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    await updateUser(userId, updates, adminId);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error(`API Error [${new Date().toISOString()}]:`, error);
    return NextResponse.json(
      { error: 'An internal server error occurred', details: error.message },
      { status: 500 }
    );
  }
}

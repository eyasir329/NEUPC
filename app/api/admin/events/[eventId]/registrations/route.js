import { auth } from '@/app/_lib/auth';
import { getUserRoles, getEventRegistrations } from '@/app/_lib/data-service';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = await getUserRoles(session.user.email);
    if (
      !userRoles.includes('admin') &&
      !userRoles.includes('executive') &&
      !userRoles.includes('advisor')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { eventId } = await params;
    const registrations = await getEventRegistrations(eventId);

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

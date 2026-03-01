/**
 * @file Debug users API route — DISABLED for security.
 *
 * This endpoint previously exposed all user data without authentication.
 * It has been disabled. Use the admin panel to view user data.
 *
 * @module DebugUsersRoute
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint has been disabled.' },
    { status: 403 }
  );
}

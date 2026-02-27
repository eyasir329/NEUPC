import { supabaseAdmin } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Fetch user's status reason from the database
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('status_reason')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Database error:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch reason' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        reason: data?.status_reason || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in GET /api/account/status-reason:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const { userId, reason } = await request.json();

    if (!userId || !reason) {
      return new Response(
        JSON.stringify({ error: 'User ID and reason are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test if supabaseAdmin is working
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (testError?.message?.includes('JWT')) {
      console.error(
        '❌ CRITICAL: Invalid service role key. Update SUPABASE_SERVICE_KEY in .env.local'
      );
      return new Response(
        JSON.stringify({
          error: 'Server configuration error: Invalid service key',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First check if user exists
    const { data: userExists, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking user:', checkError.message);
      return new Response(
        JSON.stringify({ error: `Error checking user: ${checkError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!userExists) {
      console.error('❌ User not found in database:', userId);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update user's status reason in the database
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        status_reason: reason,
        status_changed_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('status_reason');

    if (error) {
      console.error('❌ Database error:', error.message);
      return new Response(
        JSON.stringify({ error: `Database error: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          reason: reason,
          message: 'Reason updated successfully',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedReason = Array.isArray(data)
      ? data[0]?.status_reason
      : data?.status_reason;

    revalidatePath('/account');
    revalidatePath('/account/admin/users');

    return new Response(
      JSON.stringify({
        reason: updatedReason || reason,
        message: 'Reason updated successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in PUT /api/account/status-reason:', error.message);
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

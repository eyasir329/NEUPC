import { supabaseAdmin } from '@/app/_lib/supabase';

export async function GET(request) {
  try {
    console.log('🔵 GET /api/debug/users - diagnostic endpoint');

    // Fetch all users (only email and id for debugging)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, account_status, status_reason')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch users',
          details: error.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Fetched', data?.length || 0, 'users');
    return new Response(
      JSON.stringify({
        message: `Found ${data?.length || 0} users in database`,
        users: data || [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in GET /api/debug/users:', error.message);
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

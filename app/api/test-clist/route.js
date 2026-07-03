import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

export async function GET() {
  try {
    const { data: sample, error } = await supabaseAdmin
      .from('contest_history')
      .select('id, contest_name, rank, total_participants, contest_date, platform_id')
      .not('rank', 'is', null)
      .order('contest_date', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sample });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

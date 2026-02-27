import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(session.user.email);
  const allowed = ['admin', 'executive', 'advisor'];
  if (!roles.some((r) => allowed.includes(r))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { blogId } = await params;

  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .select('*, users(id, full_name, avatar_url)')
    .eq('blog_id', blogId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const approved = (data ?? []).filter((c) => c.is_approved).length;
  const pending = (data ?? []).filter((c) => !c.is_approved).length;

  return NextResponse.json({
    comments: data ?? [],
    stats: { total: (data ?? []).length, approved, pending },
  });
}

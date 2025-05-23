// Debug utility - Create this as app/api/debug/user-role/route.js
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user roles
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (name)
      `)
      .eq('user_id', user.id);

    // Get all roles for reference
    const { data: allRoles } = await supabase
      .from('roles')
      .select('*');

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      },
      userRoles,
      allRoles,
      error: error?.message
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

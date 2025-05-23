// Manual role assignment utility - Create this as app/api/debug/assign-vendor-role/route.js
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { userEmail } = await request.json();
    
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Get user by email
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError) {
      // Try alternative approach
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== userEmail) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      users = { id: user.id };
    }

    // Get vendor role ID
    const { data: vendorRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'vendor')
      .single();

    if (roleError) {
      return NextResponse.json({ error: 'Vendor role not found' }, { status: 404 });
    }

    // Assign vendor role
    const { error: assignError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: users.id,
        role_id: vendorRole.id
      });

    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Vendor role assigned successfully',
      userId: users.id,
      roleId: vendorRole.id
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
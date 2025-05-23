// app/api/vendor/login/route.js - Enhanced with better debugging
import { NextResponse } from 'next/server';
import auth from '@/lib/auth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const result = await auth.createSession(formData);

    if (!result.success) {
      console.error('Login failed:', result.message);
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    console.log('Login successful, checking vendor role for user:', result.user.id);

    // Check if the user has the vendor role
    const userRole = await auth.getUserRole(result.user.id);
    console.log('User role determined:', userRole);
    
    if (userRole !== 'vendor' && userRole !== 'admin') {
      console.error('Access denied. User role:', userRole);
      return NextResponse.json(
        { success: false, error: `Access denied. You have '${userRole}' role but need 'vendor' privileges to access the vendor dashboard.` },
        { status: 403 }
      );
    }

    console.log('Vendor login successful');
    return NextResponse.json({ 
      success: true, 
      message: 'Vendor login successful',
      user: result.user,
      role: userRole
    });
    
  } catch (error) {
    console.error('Vendor login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
// app/api/user/login/route.js - Fixed user login API
import { NextResponse } from 'next/server';
import auth from '@/lib/auth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const result = await auth.createSession(formData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: result.user
    });
  } catch (error) {
    console.error('User login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
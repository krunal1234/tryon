// app/api/user/register/route.js
import { NextResponse } from 'next/server';
import auth from '@/lib/auth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { email, password } = Object.fromEntries(formData);
    
    const result = await auth.signUpUser(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import auth from '@/lib/auth';

export async function POST() {
  try {
    const result = await auth.deleteSession();

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { setupDatabaseSchema } from '@/lib/db-schema';

export async function GET() {
  try {
    const success = await setupDatabaseSchema();
    
    if (!success) {
      return NextResponse.json(
        { message: 'Database schema setup failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Database schema setup completed successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
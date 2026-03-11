import { NextRequest, NextResponse } from 'next/server';
import { EventType } from '@/lib/types';
import { getPackagesFromDB } from '@/lib/supabase/packages';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('eventType') as EventType | null;

    const packages = await getPackagesFromDB(eventType);

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Error in catering-packages API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages', packages: [] },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { saveSortOrder } from '@/lib/supabase/products';

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || items.some((i: { id?: string; sort_position?: number }) => !i.id || typeof i.sort_position !== 'number')) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
    }

    await saveSortOrder(items);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder products:', error);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}

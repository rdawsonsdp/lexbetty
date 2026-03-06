import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getDisabledCategories, setDisabledCategories } from '@/lib/supabase/settings';

// GET — public, used by public pages to know which categories are hidden
export async function GET() {
  try {
    const disabled = await getDisabledCategories();
    return NextResponse.json({ disabled_categories: disabled });
  } catch {
    return NextResponse.json({ disabled_categories: [] });
  }
}

// PUT — admin only, update disabled categories
export async function PUT(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { disabled_categories } = body;

    if (!Array.isArray(disabled_categories)) {
      return NextResponse.json({ error: 'disabled_categories must be an array' }, { status: 400 });
    }

    await setDisabledCategories(disabled_categories);
    return NextResponse.json({ success: true, disabled_categories });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getAllPackagesForAdmin, upsertPackage } from '@/lib/supabase/packages';
import { CateringPackage } from '@/lib/types';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const packages = await getAllPackagesForAdmin();
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Failed to fetch admin packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, description, pricePerPerson, image, items, categories, minHeadcount, maxHeadcount, sort_position, is_active } = body;

    if (!id || !title || !pricePerPerson) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pkg: CateringPackage = {
      id,
      title,
      description: description || '',
      pricePerPerson: Number(pricePerPerson),
      image: image || '/images/bbq_brisket.jpg',
      items: items || [],
      categories: categories || ['lunch'],
      minHeadcount: minHeadcount || undefined,
      maxHeadcount: maxHeadcount || undefined,
    };

    await upsertPackage(pkg, sort_position ?? 0, is_active ?? true);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save package:', error);
    return NextResponse.json({ error: 'Failed to save package' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, description, pricePerPerson, image, items, categories, minHeadcount, maxHeadcount, sort_position, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
    }

    const pkg: CateringPackage = {
      id,
      title,
      description: description || '',
      pricePerPerson: Number(pricePerPerson),
      image: image || '/images/bbq_brisket.jpg',
      items: items || [],
      categories: categories || ['lunch'],
      minHeadcount: minHeadcount || undefined,
      maxHeadcount: maxHeadcount || undefined,
    };

    await upsertPackage(pkg, sort_position ?? 0, is_active ?? true);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update package:', error);
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
  }
}

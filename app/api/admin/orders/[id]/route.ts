import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { updateOrder, OrderUpdateInput } from '@/lib/orders/update';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as OrderUpdateInput;

    if (body.headcount !== undefined && (body.headcount < 1 || !Number.isFinite(body.headcount))) {
      return NextResponse.json({ error: 'Invalid headcount' }, { status: 400 });
    }
    if (body.deliveryFee !== undefined && (body.deliveryFee < 0 || !Number.isFinite(body.deliveryFee))) {
      return NextResponse.json({ error: 'Invalid delivery fee' }, { status: 400 });
    }
    if (body.items !== undefined && !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
    }
    if (body.status !== undefined && !['pending', 'invoiced', 'cancelled'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status for edit endpoint' }, { status: 400 });
    }

    const result = await updateOrder(id, body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update order';
    const isClientErr = /not found|cannot edit/i.test(message);
    return NextResponse.json({ error: message }, { status: isClientErr ? 400 : 500 });
  }
}

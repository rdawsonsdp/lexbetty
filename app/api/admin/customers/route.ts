import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all orders with customer fields
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('customer_email, customer_name, customer_phone, customer_company, order_total, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Aggregate by email (lowercase for deduplication)
    const customerMap = new Map<string, {
      email: string;
      name: string;
      phone: string | null;
      company: string | null;
      total_orders: number;
      total_spent: number;
      first_order: string;
      last_order: string;
    }>();

    for (const order of orders || []) {
      const key = (order.customer_email || '').toLowerCase().trim();
      if (!key) continue;

      const existing = customerMap.get(key);
      if (existing) {
        existing.total_orders++;
        existing.total_spent += order.order_total || 0;
        // Use the most recent name/phone/company
        if (order.created_at > existing.last_order) {
          existing.name = order.customer_name || existing.name;
          existing.phone = order.customer_phone || existing.phone;
          existing.company = order.customer_company || existing.company;
          existing.last_order = order.created_at;
        }
        if (order.created_at < existing.first_order) {
          existing.first_order = order.created_at;
        }
      } else {
        customerMap.set(key, {
          email: order.customer_email,
          name: order.customer_name || '',
          phone: order.customer_phone,
          company: order.customer_company,
          total_orders: 1,
          total_spent: order.order_total || 0,
          first_order: order.created_at,
          last_order: order.created_at,
        });
      }
    }

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.last_order.localeCompare(a.last_order));

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

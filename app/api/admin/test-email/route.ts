import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { sendEmail } from '@/lib/email/send-email';
import { buildQuoteEmailHtml } from '@/lib/email/quote-template';
import { getEmailSettings } from '@/lib/email/email-settings';

export async function POST(request: NextRequest) {
  const authorized = await isAdminAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipientEmail, orderType = 'quote' } = await request.json();

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const settings = await getEmailSettings();

    const sampleData = {
      orderType: orderType as 'quote' | 'order',
      orderNumber: 'SD-TEST',
      contact: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: recipientEmail,
        phone: '(555) 123-4567',
        company: 'Acme Corp',
      },
      delivery: {
        address: '123 Main Street',
        address2: 'Suite 400',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
      },
      event: {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '11:30 AM',
        setupRequired: true,
        specialInstructions: 'Loading dock access on the east side of the building.',
      },
      items: [
        { title: 'Smoked Brisket', displayText: 'Full Pan — feeds 20-25', totalPrice: 189.99 },
        { title: 'Mac & Cheese', displayText: 'Half Pan — feeds 10-15', totalPrice: 59.99 },
        { title: 'Collard Greens', displayText: 'Half Pan — feeds 10-15', totalPrice: 49.99 },
        { title: 'Cornbread', displayText: '2 dozen', totalPrice: 35.99 },
      ],
      headcount: 25,
      eventType: 'lunch',
      subtotal: 335.96,
      deliveryFee: 75,
      orderTotal: 410.96,
      perPerson: 16.44,
      companyPhone: settings.company_phone,
      companyEmail: settings.company_email,
      companyAddress: settings.company_address,
    };

    const html = buildQuoteEmailHtml(sampleData);
    const subjectTemplate = orderType === 'quote'
      ? settings.email_subject_quote
      : settings.email_subject_order;
    const subject = subjectTemplate.replace('{orderNumber}', 'SD-TEST');

    await sendEmail({
      to: recipientEmail,
      subject,
      html,
      replyTo: settings.company_email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test email' },
      { status: 500 }
    );
  }
}

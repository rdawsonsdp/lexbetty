interface QuoteEmailData {
  orderType: 'quote' | 'order';
  orderNumber: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
  };
  delivery: {
    address: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
  };
  event: {
    date: string;
    time: string;
    setupRequired: boolean;
    specialInstructions: string;
  };
  items: Array<{
    title: string;
    displayText: string;
    totalPrice: number;
  }>;
  headcount: number;
  eventType: string;
  subtotal: number;
  deliveryFee: number;
  orderTotal: number;
  perPerson: number;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
}

function formatCurrency(cents: number): string {
  return '$' + cents.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function buildQuoteEmailHtml(data: QuoteEmailData): string {
  const isQuote = data.orderType === 'quote';
  const title = isQuote ? 'Your Catering Quote' : 'Your Catering Order';
  const prefix = isQuote ? 'Quote' : 'Order';
  const companyPhone = data.companyPhone || '(312) 600-8155';
  const companyEmail = data.companyEmail || 'orders@souldelivered.com';
  const companyAddress = data.companyAddress || 'Chicago, IL';

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #383838;">
          <strong>${item.title}</strong><br/>
          <span style="color: #888; font-size: 12px;">${item.displayText}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #383838; text-align: right; white-space: nowrap;">
          ${formatCurrency(item.totalPrice)}
        </td>
      </tr>`
    )
    .join('');

  const nextStepsQuote = `
    <tr><td style="padding: 0 24px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFF8F0; border-radius: 8px; padding: 20px;">
        <tr><td style="padding: 20px; font-family: Arial, Helvetica, sans-serif;">
          <h3 style="margin: 0 0 12px; font-size: 16px; color: #383838;">What Happens Next</h3>
          <ol style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
            <li>Our team will review your quote within 1 business day</li>
            <li>We'll reach out to confirm details and answer questions</li>
            <li>Once approved, we'll lock in your event date</li>
            <li>Payment is due 48 hours before the event</li>
          </ol>
          <p style="margin: 16px 0 0; font-size: 13px; color: #888;">This quote is valid for 7 days.</p>
        </td></tr>
      </table>
    </td></tr>`;

  const nextStepsOrder = `
    <tr><td style="padding: 0 24px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #F0FFF4; border-radius: 8px; padding: 20px;">
        <tr><td style="padding: 20px; font-family: Arial, Helvetica, sans-serif;">
          <h3 style="margin: 0 0 12px; font-size: 16px; color: #383838;">What Happens Next</h3>
          <ol style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;">
            <li>Our team will confirm your order within 1 business day</li>
            <li>We'll call 24 hours before to finalize details</li>
            <li>Your driver will text 30 minutes before arrival</li>
            <li>We set up everything fresh and ready to serve</li>
          </ol>
        </td></tr>
      </table>
    </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAFAFA; padding: 20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background-color: #383838; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 700; color: #FAFAFA; letter-spacing: 2px;">
            LEXINGTON BETTY SMOKEHOUSE
          </h1>
          <p style="margin: 8px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #E8621A; letter-spacing: 1px;">
            SMOKED LOW &amp; SLOW. SERVED WITH SOUL.
          </p>
        </td></tr>

        <!-- Title Bar -->
        <tr><td style="background-color: #E8621A; padding: 16px 24px; text-align: center;">
          <h2 style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; color: #383838; letter-spacing: 1px;">
            ${title.toUpperCase()}
          </h2>
          <p style="margin: 4px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #383838;">
            ${prefix} #${data.orderNumber}
          </p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding: 24px 24px 16px;">
          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #383838; line-height: 1.5;">
            Hi ${data.contact.firstName},
          </p>
          <p style="margin: 8px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #555; line-height: 1.6;">
            ${isQuote
              ? 'Thank you for your interest in Lexington Betty catering! Here are the details of your quote.'
              : 'Thank you for your order! We\'re excited to cater your event. Here\'s your order confirmation.'}
          </p>
        </td></tr>

        <!-- Event Details Card -->
        <tr><td style="padding: 0 24px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAFAFA; border-radius: 8px; border: 1px solid #eee;">
            <tr><td style="padding: 16px; font-family: Arial, Helvetica, sans-serif;">
              <h3 style="margin: 0 0 12px; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Event Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #888; width: 100px;">Date</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #383838; font-weight: 600;">${formatDate(data.event.date)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #888;">Time</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #383838; font-weight: 600;">${data.event.time}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #888;">Guests</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #383838; font-weight: 600;">${data.headcount}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #888;">Setup</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #383838; font-weight: 600;">${data.event.setupRequired ? 'Full setup included' : 'Drop-off only'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #888;">Address</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #383838;">${data.delivery.address}${data.delivery.address2 ? ', ' + data.delivery.address2 : ''}<br/>${data.delivery.city}, ${data.delivery.state} ${data.delivery.zip}</td>
                </tr>
                ${data.event.specialInstructions ? `
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #888; vertical-align: top;">Notes</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #383838; font-style: italic;">${data.event.specialInstructions}</td>
                </tr>` : ''}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Line Items -->
        <tr><td style="padding: 0 24px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 8px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #383838;">Item</td>
              <td style="padding: 8px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #383838; text-align: right;">Price</td>
            </tr>
            ${itemRows}
          </table>
        </td></tr>

        <!-- Totals -->
        <tr><td style="padding: 0 24px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #555;">Subtotal</td>
              <td style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #383838; text-align: right;">${formatCurrency(data.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #555;">Delivery</td>
              <td style="padding: 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #383838; text-align: right;">${formatCurrency(data.deliveryFee)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 6px; font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 700; color: #383838; border-top: 2px solid #383838;">Total</td>
              <td style="padding: 12px 0 6px; font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 700; color: #E8621A; border-top: 2px solid #383838; text-align: right;">${formatCurrency(data.orderTotal)}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #888;">Per person (${data.headcount} guests)</td>
              <td style="padding: 2px 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #888; text-align: right;">${formatCurrency(data.perPerson)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Next Steps -->
        ${isQuote ? nextStepsQuote : nextStepsOrder}

        <!-- Footer -->
        <tr><td style="background-color: #383838; padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #FAFAFA; font-weight: 700; letter-spacing: 1px;">
            LEXINGTON BETTY SMOKEHOUSE
          </p>
          <p style="margin: 0 0 4px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #ccc;">
            ${companyPhone} &bull; ${companyEmail}
          </p>
          <p style="margin: 0 0 12px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #ccc;">
            ${companyAddress}
          </p>
          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #888;">
            Questions? Reply to this email or call us anytime.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

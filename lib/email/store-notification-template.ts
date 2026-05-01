interface StoreNotificationData {
  orderType: 'quote' | 'order';
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  eventDate: string;
  eventTime: string;
  headcount: number;
  eventType: string;
  delivery: {
    address: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
  };
  setupRequired: boolean;
  specialInstructions: string;
  items: Array<{ title: string; displayText: string; totalPrice: number }>;
  subtotal: number;
  deliveryFee: number;
  orderTotal: number;
  perPerson: number;
}

function formatCurrency(amount: number): string {
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildStoreNotificationHtml(data: StoreNotificationData): string {
  const isQuote = data.orderType === 'quote';
  const phoneDigits = (data.customerPhone || '').replace(/[^0-9+]/g, '');
  const phoneTel = phoneDigits ? `tel:${phoneDigits}` : '#';
  const phoneDisplay = data.customerPhone || '— no phone provided —';
  const fullAddress = [
    data.delivery.address,
    data.delivery.address2,
    [data.delivery.city, data.delivery.state, data.delivery.zip].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(', ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New ${isQuote ? 'Quote' : 'Order'} #${data.orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- ACTION BANNER -->
          <tr>
            <td style="background:#E8621A;padding:20px 24px;color:#ffffff;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;margin-bottom:6px;">
                Action Required — Call Customer to Collect Payment
              </div>
              <div style="font-size:24px;font-weight:700;line-height:1.2;">
                ${escapeHtml(data.customerName)}
              </div>
              <div style="margin-top:8px;">
                <a href="${phoneTel}" style="display:inline-block;background:#1A1A1A;color:#ffffff;text-decoration:none;font-weight:700;font-size:18px;padding:10px 18px;border-radius:8px;letter-spacing:0.5px;">
                  📞 ${escapeHtml(phoneDisplay)}
                </a>
              </div>
              <div style="margin-top:12px;font-size:14px;opacity:0.95;">
                Total to collect: <strong style="font-size:18px;">${formatCurrency(data.orderTotal)}</strong>
                &nbsp;·&nbsp; ${data.headcount} guests
                &nbsp;·&nbsp; Event: <strong>${escapeHtml(formatDate(data.eventDate))}${data.eventTime ? ' @ ' + escapeHtml(data.eventTime) : ''}</strong>
              </div>
            </td>
          </tr>

          <!-- QUICK FACTS -->
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #f0f0f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;padding-bottom:6px;">${isQuote ? 'Quote' : 'Order'} #</td>
                  <td style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;padding-bottom:6px;">Email</td>
                  ${data.customerCompany ? '<td style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;padding-bottom:6px;">Company</td>' : ''}
                </tr>
                <tr>
                  <td style="font-size:14px;font-weight:700;color:#1A1A1A;padding-right:16px;">${escapeHtml(data.orderNumber)}</td>
                  <td style="font-size:14px;color:#1A1A1A;padding-right:16px;"><a href="mailto:${escapeHtml(data.customerEmail)}" style="color:#E8621A;text-decoration:none;">${escapeHtml(data.customerEmail)}</a></td>
                  ${data.customerCompany ? `<td style="font-size:14px;color:#1A1A1A;">${escapeHtml(data.customerCompany)}</td>` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- HOW TO HANDLE -->
          <tr>
            <td style="padding:16px 24px;background:#fef9f5;border-bottom:1px solid #f0e8e0;">
              <div style="font-size:13px;color:#1A1A1A;line-height:1.5;">
                <strong style="color:#E8621A;">Next steps:</strong>
                <ol style="margin:8px 0 0;padding-left:20px;">
                  <li>Call the customer to confirm the order and event details</li>
                  <li>Collect credit card info over the phone</li>
                  <li>Run the card in Clover and capture payment</li>
                  <li>Mark this ${isQuote ? 'quote' : 'order'} as <strong>Paid</strong> in <a href="${escapeHtml(process.env.NEXT_PUBLIC_BASE_URL || '')}/admin/orders" style="color:#E8621A;">/admin/orders</a></li>
                </ol>
              </div>
            </td>
          </tr>

          <!-- DELIVERY -->
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #f0f0f0;">
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Delivery</div>
              <div style="font-size:14px;color:#1A1A1A;line-height:1.5;">
                ${escapeHtml(fullAddress) || '— no address provided —'}<br>
                <span style="color:#666;font-size:13px;">${data.setupRequired ? 'Full setup included' : 'Drop-off only'}</span>
                ${data.specialInstructions ? `<div style="margin-top:8px;padding:10px 12px;background:#fffbe6;border-left:3px solid #E8621A;font-size:13px;color:#1A1A1A;"><strong>Notes:</strong> ${escapeHtml(data.specialInstructions)}</div>` : ''}
              </div>
            </td>
          </tr>

          <!-- ITEMS -->
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #f0f0f0;">
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:10px;">Order Items</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${data.items
                  .map(
                    (item) => `
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f5f5f5;">
                    <div style="font-size:14px;font-weight:600;color:#1A1A1A;">${escapeHtml(item.title)}</div>
                    <div style="font-size:12px;color:#888;margin-top:2px;">${escapeHtml(item.displayText)}</div>
                  </td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid #f5f5f5;font-size:14px;font-weight:600;color:#1A1A1A;white-space:nowrap;">${formatCurrency(item.totalPrice)}</td>
                </tr>
              `
                  )
                  .join('')}
              </table>
            </td>
          </tr>

          <!-- TOTALS -->
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#666;padding:4px 0;">Subtotal</td>
                  <td align="right" style="font-size:13px;color:#1A1A1A;padding:4px 0;">${formatCurrency(data.subtotal)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#666;padding:4px 0;">Delivery</td>
                  <td align="right" style="font-size:13px;color:#1A1A1A;padding:4px 0;">${formatCurrency(data.deliveryFee)}</td>
                </tr>
                <tr>
                  <td style="font-size:18px;font-weight:700;color:#1A1A1A;padding:10px 0 4px;border-top:2px solid #1A1A1A;">Total</td>
                  <td align="right" style="font-size:20px;font-weight:700;color:#E8621A;padding:10px 0 4px;border-top:2px solid #1A1A1A;">${formatCurrency(data.orderTotal)}</td>
                </tr>
                <tr>
                  <td style="font-size:11px;color:#888;padding:0;">Per person (${data.headcount} guests)</td>
                  <td align="right" style="font-size:11px;color:#888;padding:0;">${formatCurrency(data.perPerson)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div style="font-size:11px;color:#999;text-align:center;margin-top:16px;">
          Sent from the Lexington Betty Smokehouse catering site.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

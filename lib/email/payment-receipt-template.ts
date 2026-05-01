interface PaymentReceiptData {
  orderNumber: string;
  customerName: string;
  paymentMethod: string;
  paymentReference: string | null;
  paymentAmount: number;
  paymentDate: string;
  orderTotal: number;
  headcount: number;
  eventDate: string;
  eventTime: string;
  deliveryAddress: string;
  items: Array<{ title: string; displayText: string; totalPrice: number }>;
  subtotal: number;
  deliveryFee: number;
  companyPhone?: string;
  companyEmail?: string;
}

function formatCurrency(amount: number): string {
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatLongDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatPaidAt(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function methodLabel(m: string): string {
  switch (m) {
    case 'card': return 'Credit Card';
    case 'cash': return 'Cash';
    case 'check': return 'Check';
    case 'ach': return 'ACH / Bank Transfer';
    case 'other': return 'Other';
    default: return m.charAt(0).toUpperCase() + m.slice(1);
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPaymentReceiptHtml(data: PaymentReceiptData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt — Order #${data.orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#F5EDE0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EDE0;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- HERO -->
          <tr>
            <td style="background:#1A1A1A;padding:32px 24px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;background:#22c55e;border-radius:50%;line-height:56px;color:#ffffff;font-size:32px;margin-bottom:12px;">✓</div>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#F5EDE0;letter-spacing:1px;">PAYMENT RECEIVED</h1>
              <p style="margin:6px 0 0;font-size:14px;color:#E8621A;font-weight:600;">Order #${escapeHtml(data.orderNumber)}</p>
            </td>
          </tr>

          <!-- THANK YOU -->
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#1A1A1A;">
                Hi ${escapeHtml(data.customerName.split(' ')[0] || 'there')},
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#444;">
                Thank you! We&rsquo;ve received your payment of <strong style="color:#E8621A;">${formatCurrency(data.paymentAmount)}</strong> for your catering order. Your order is confirmed and we&rsquo;re looking forward to feeding your team.
              </p>
            </td>
          </tr>

          <!-- PAYMENT DETAILS -->
          <tr>
            <td style="padding:0 24px 20px;">
              <div style="background:#F5EDE0;border-left:4px solid #22c55e;border-radius:8px;padding:16px;">
                <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:10px;">Payment Details</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                  <tr>
                    <td style="padding:4px 0;color:#666;">Method</td>
                    <td align="right" style="padding:4px 0;color:#1A1A1A;font-weight:600;">${escapeHtml(methodLabel(data.paymentMethod))}</td>
                  </tr>
                  ${data.paymentReference ? `
                  <tr>
                    <td style="padding:4px 0;color:#666;">Reference</td>
                    <td align="right" style="padding:4px 0;color:#1A1A1A;font-family:monospace;font-size:13px;">${escapeHtml(data.paymentReference)}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:4px 0;color:#666;">Date</td>
                    <td align="right" style="padding:4px 0;color:#1A1A1A;">${escapeHtml(formatPaidAt(data.paymentDate))}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0 4px;color:#1A1A1A;font-weight:700;border-top:1px solid #e8d8c4;">Amount Paid</td>
                    <td align="right" style="padding:8px 0 4px;color:#22c55e;font-weight:700;font-size:18px;border-top:1px solid #e8d8c4;">${formatCurrency(data.paymentAmount)}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- EVENT DETAILS -->
          <tr>
            <td style="padding:0 24px 20px;">
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:8px;">Event</div>
              <div style="font-size:14px;color:#1A1A1A;line-height:1.6;">
                <strong>${escapeHtml(formatLongDate(data.eventDate))}</strong>${data.eventTime ? ' at ' + escapeHtml(data.eventTime) : ''}<br>
                ${data.headcount} guests<br>
                ${data.deliveryAddress ? escapeHtml(data.deliveryAddress) : ''}
              </div>
            </td>
          </tr>

          <!-- ORDER SUMMARY -->
          <tr>
            <td style="padding:0 24px 20px;">
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:10px;">Order Summary</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                ${data.items.map(item => `
                <tr>
                  <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
                    <div style="color:#1A1A1A;font-weight:600;">${escapeHtml(item.title)}</div>
                    <div style="color:#888;font-size:12px;">${escapeHtml(item.displayText)}</div>
                  </td>
                  <td align="right" style="padding:6px 0;border-bottom:1px solid #f0f0f0;color:#1A1A1A;font-weight:600;white-space:nowrap;">${formatCurrency(item.totalPrice)}</td>
                </tr>`).join('')}
                <tr>
                  <td style="padding:8px 0 4px;color:#666;">Subtotal</td>
                  <td align="right" style="padding:8px 0 4px;color:#1A1A1A;">${formatCurrency(data.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#666;">Delivery</td>
                  <td align="right" style="padding:4px 0;color:#1A1A1A;">${formatCurrency(data.deliveryFee)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0 0;color:#1A1A1A;font-weight:700;font-size:16px;border-top:2px solid #1A1A1A;">Order Total</td>
                  <td align="right" style="padding:8px 0 0;color:#E8621A;font-weight:700;font-size:18px;border-top:2px solid #1A1A1A;">${formatCurrency(data.orderTotal)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 24px;background:#F5EDE0;text-align:center;border-top:1px solid #e8d8c4;">
              <p style="margin:0 0 6px;font-size:13px;color:#1A1A1A;font-weight:600;">Lexington Betty Smokehouse</p>
              <p style="margin:0;font-size:12px;color:#666;">
                ${data.companyPhone ? escapeHtml(data.companyPhone) + ' &middot; ' : ''}${data.companyEmail ? `<a href="mailto:${escapeHtml(data.companyEmail)}" style="color:#E8621A;text-decoration:none;">${escapeHtml(data.companyEmail)}</a>` : ''}
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#999;">Save this email as your receipt.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

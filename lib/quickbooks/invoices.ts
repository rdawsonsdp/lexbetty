import { qbApiCall } from './client';
import { QBInvoice } from './types';

interface LineItem {
  description: string;
  amount: number;
  quantity?: number;
}

interface InvoiceInput {
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  lineItems: LineItem[];
  deliveryFee: number;
  eventDate?: string;
  eventTime?: string;
  headcount: number;
  specialInstructions?: string;
}

/**
 * Create a QuickBooks invoice with line items and online payment enabled.
 */
export async function createInvoice(input: InvoiceInput): Promise<{
  invoiceId: string;
  invoiceNumber: string;
  paymentLink: string | null;
}> {
  const lines = input.lineItems.map((item) => ({
    Amount: item.amount,
    DetailType: 'SalesItemLineDetail',
    Description: item.description,
    SalesItemLineDetail: {
      Qty: item.quantity || 1,
      UnitPrice: item.quantity ? item.amount / item.quantity : item.amount,
    },
  }));

  // Add delivery fee as a line item
  if (input.deliveryFee > 0) {
    lines.push({
      Amount: input.deliveryFee,
      DetailType: 'SalesItemLineDetail',
      Description: 'Delivery Fee',
      SalesItemLineDetail: {
        Qty: 1,
        UnitPrice: input.deliveryFee,
      },
    });
  }

  // Build memo with event details
  const memoParts: string[] = [];
  if (input.eventDate) memoParts.push(`Event Date: ${input.eventDate}`);
  if (input.eventTime) memoParts.push(`Event Time: ${input.eventTime}`);
  memoParts.push(`Headcount: ${input.headcount} guests`);
  if (input.specialInstructions) memoParts.push(`Notes: ${input.specialInstructions}`);

  const invoiceData = {
    DocNumber: input.orderNumber,
    Line: lines,
    CustomerRef: { value: input.customerId },
    BillEmail: { Address: input.customerEmail },
    AllowOnlineCreditCardPayment: true,
    AllowOnlineACHPayment: true,
    CustomerMemo: { value: memoParts.join(' | ') },
    PrivateNote: `Catering order ${input.orderNumber} for ${input.headcount} guests`,
  };

  const result = await qbApiCall('POST', 'invoice', invoiceData) as {
    Invoice: QBInvoice;
  };

  const invoiceId = result.Invoice.Id;
  const invoiceNumber = result.Invoice.DocNumber;

  // Fetch invoice with payment link
  let paymentLink: string | null = null;
  try {
    const invoiceWithLink = await qbApiCall(
      'GET',
      `invoice/${invoiceId}?include=invoiceLink`
    ) as { Invoice: QBInvoice };
    paymentLink = invoiceWithLink.Invoice.InvoiceLink || null;
  } catch {
    // Payment link may not be available if QB Payments isn't enabled
    console.warn('Could not retrieve QB payment link');
  }

  return { invoiceId, invoiceNumber, paymentLink };
}

/**
 * Send the invoice email via QuickBooks.
 */
export async function sendInvoiceEmail(invoiceId: string): Promise<void> {
  await qbApiCall('POST', `invoice/${invoiceId}/send`);
}

/**
 * Get the current status of an invoice.
 */
export async function getInvoiceStatus(invoiceId: string): Promise<{
  balance: number;
  totalAmt: number;
  isPaid: boolean;
}> {
  const result = await qbApiCall('GET', `invoice/${invoiceId}`) as {
    Invoice: QBInvoice;
  };

  return {
    balance: result.Invoice.Balance,
    totalAmt: result.Invoice.TotalAmt,
    isPaid: result.Invoice.Balance === 0,
  };
}

/**
 * Find payment(s) linked to an invoice via QB query.
 */
export async function getPaymentForInvoice(invoiceId: string): Promise<{
  paymentId: string;
  paymentMethod: string;
  paymentDate: string;
  totalAmount: number;
} | null> {
  try {
    const query = `SELECT * FROM Payment WHERE Line.LinkedTxn.TxnId = '${invoiceId}' AND Line.LinkedTxn.TxnType = 'Invoice'`;
    const result = await qbApiCall('GET', `query?query=${encodeURIComponent(query)}`) as {
      QueryResponse: { Payment?: Array<{
        Id: string;
        PaymentMethodRef?: { name: string };
        TxnDate: string;
        TotalAmt: number;
      }> };
    };

    if (result.QueryResponse.Payment && result.QueryResponse.Payment.length > 0) {
      const payment = result.QueryResponse.Payment[0];
      return {
        paymentId: payment.Id,
        paymentMethod: payment.PaymentMethodRef?.name || 'Online',
        paymentDate: payment.TxnDate,
        totalAmount: payment.TotalAmt,
      };
    }
    return null;
  } catch {
    console.warn(`Could not fetch payment for invoice ${invoiceId}`);
    return null;
  }
}

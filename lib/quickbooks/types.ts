export interface QBTokens {
  id: string;
  company_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
}

export interface QBCustomer {
  Id: string;
  DisplayName: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  CompanyName?: string;
}

export interface QBInvoiceLine {
  Amount: number;
  DetailType: 'SalesItemLineDetail' | 'DescriptionOnly';
  Description?: string;
  SalesItemLineDetail?: {
    Qty?: number;
    UnitPrice?: number;
  };
}

export interface QBInvoice {
  Id: string;
  DocNumber: string;
  TotalAmt: number;
  Balance: number;
  InvoiceLink?: string;
  EmailStatus?: string;
}

export interface QBWebhookEvent {
  realmId: string;
  name: string;
  id: string;
  operation: string;
  lastUpdated: string;
}

export interface QBWebhookPayload {
  eventNotifications: {
    realmId: string;
    dataChangeEvent: {
      entities: QBWebhookEvent[];
    };
  }[];
}

export interface OrderRecord {
  id: string;
  order_number: string;
  qb_invoice_id: string | null;
  qb_invoice_number: string | null;
  qb_customer_id: string | null;
  payment_link: string | null;
  status: 'pending' | 'invoiced' | 'paid' | 'cancelled';
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  delivery_address: string | null;
  event_date: string | null;
  event_time: string | null;
  headcount: number;
  event_type: string | null;
  setup_required: boolean;
  special_instructions: string | null;
  items: unknown;
  subtotal: number;
  delivery_fee: number;
  order_total: number;
  created_at: string;
  updated_at: string;
}

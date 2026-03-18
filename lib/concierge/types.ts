export interface ConciergeChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConciergeMatchedItem {
  product_id: string;
  quantity: number;
  size?: 'half' | 'full';
  notes?: string;
}

export interface ConciergeUnmatchedItem {
  requested: string;
  suggestion: string;
  suggested_product_id?: string;
}

export interface ConciergeEventDetails {
  headcount?: number;
  event_date?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  event_type?: string;
  delivery_time?: string;
  notes?: string;
}

export interface ConciergePackageSuggestion {
  package_id: string;
  reason: string;
}

export interface ConciergeResponse {
  matched_items: ConciergeMatchedItem[];
  unmatched_items: ConciergeUnmatchedItem[];
  event_details: ConciergeEventDetails;
  package_suggestion?: ConciergePackageSuggestion | null;
  follow_up_questions: string[];
  message: string;
  order_ready: boolean;
}

export interface ConciergeRequest {
  messages: ConciergeChatMessage[];
}

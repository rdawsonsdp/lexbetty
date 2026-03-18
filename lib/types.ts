// Event Types
export type EventType = 'breakfast' | 'lunch' | 'dessert' | 'alacarte' | 'other';

// Pricing Types
export type PricingType = 'tray' | 'pan' | 'per-person' | 'per-dozen' | 'per-each' | 'per-lb' | 'per-container' | 'flat';

// Size options for tray-based pricing
export interface TraySizeOption {
  size: 'small' | 'medium' | 'large';
  price: number;
  servesMin: number;
  servesMax: number;
}

// Size options for pan-based pricing
export interface PanSizeOption {
  size: 'half' | 'full';
  price: number;
  servesMin: number;
  servesMax: number;
  estimatedWeightOz?: number;
}

// Pricing configuration based on type
export interface TrayPricing {
  type: 'tray';
  sizes: TraySizeOption[];
}

export interface PanPricing {
  type: 'pan';
  sizes: PanSizeOption[];
}

export interface PerPersonPricing {
  type: 'per-person';
  pricePerPerson: number;
  minOrder?: number;
}

export interface PerDozenPricing {
  type: 'per-dozen';
  pricePerDozen: number;
  servesPerDozen: number; // typically 12
}

export interface PerEachPricing {
  type: 'per-each';
  priceEach: number;
  minOrder?: number;
  unit?: 'each' | 'lb';
}

export interface PerLbPricing {
  type: 'per-lb';
  pricePerLb: number;
  minOrder?: number;
}

export interface PerContainerPricing {
  type: 'per-container';
  pricePerContainer: number;
  servesPerContainer: number;
  estimatedWeightOz?: number;
}

export interface FlatPricing {
  type: 'flat';
  flatPrice: number;
}

export type ProductPricing =
  | TrayPricing
  | PanPricing
  | PerPersonPricing
  | PerDozenPricing
  | PerEachPricing
  | PerLbPricing
  | PerContainerPricing
  | FlatPricing;

// Budget Range
export interface BudgetRange {
  id: string;
  label: string;
  min: number;
  max: number;
  description: string;
  isCustom?: boolean;
}

// Catering Product with flexible pricing
export interface CateringProduct {
  id: string;
  title: string;
  description: string;
  image: string;
  categories: EventType[];
  pricing: ProductPricing;
  tags?: string[];
  featured?: boolean;
  variantId?: string;
  slug?: string;
  inventory?: number;
  minOrderQuantity?: number;
  specialOrder?: boolean;
}

// Calculated order item (what the customer actually gets)
export interface CalculatedOrderItem {
  product: CateringProduct;
  // For tray/pan items
  selectedSize?: 'small' | 'medium' | 'large' | 'half' | 'full';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  servesMin: number;
  servesMax: number;
  displayText: string; // e.g., "2 Half Pans - serves 20-30"
  itemQuantity: number; // how many of this product the user ordered (1, 2, 3, etc.)
}

// Selected item in the cart (simplified for state)
export interface SelectedCateringItem {
  product: CateringProduct;
  quantity: number;
  selectedSize?: 'small' | 'medium' | 'large' | 'half' | 'full';
}

// Event info collected during wizard
export interface EventInfo {
  eventName?: string;
  eventDate: string;
  eventTime: string;
  specialInstructions?: string;
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  setupRequired?: boolean;
}

// Buyer/Contact information
export interface BuyerInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
  eventDate: string;
  eventTime?: string;
  deliveryAddress?: string;
  notes?: string;
}

// Order type selection
export type OrderType = 'build-your-own' | 'packages';

// Catering Package (fixed per-person price)
export interface CateringPackage {
  id: string;
  title: string;
  description: string;
  pricePerPerson: number;
  image: string;
  items: string[];
  categories: EventType[];
  minHeadcount?: number;
  maxHeadcount?: number;
}

// Selected package in the cart
export interface SelectedPackage {
  package: CateringPackage;
  headcount: number;
}

// Main application state
export interface CateringState {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  eventType: EventType | null;
  eventInfo: EventInfo | null;
  orderMode: 'wizard' | 'alacarte' | null;
  budgetRange: BudgetRange | null;
  customBudget: number | null;
  orderType: OrderType | null;
  headcount: number;
  selectedItems: SelectedCateringItem[];
  selectedPackage: CateringPackage | null;
  buyerInfo: BuyerInfo | null;
}

// Action types for reducer
export type CateringAction =
  | { type: 'SET_EVENT_TYPE'; payload: EventType }
  | { type: 'SET_EVENT_INFO'; payload: EventInfo }
  | { type: 'SET_ORDER_MODE'; payload: 'wizard' | 'alacarte' }
  | { type: 'SET_BUDGET_RANGE'; payload: BudgetRange }
  | { type: 'SET_CUSTOM_BUDGET'; payload: number }
  | { type: 'SET_ORDER_TYPE'; payload: OrderType }
  | { type: 'SET_HEADCOUNT'; payload: number }
  | { type: 'ADD_ITEM'; payload: CateringProduct }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'SET_ITEM_SIZE'; payload: { productId: string; size: 'small' | 'medium' | 'large' | 'half' | 'full' } }
  | { type: 'CLEAR_ITEMS' }
  | { type: 'SELECT_PACKAGE'; payload: CateringPackage }
  | { type: 'CLEAR_PACKAGE' }
  | { type: 'SET_STEP'; payload: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: 'GO_BACK' }
  | { type: 'SET_BUYER_INFO'; payload: BuyerInfo }
  | { type: 'LOAD_CONCIERGE_ORDER'; payload: {
      items: SelectedCateringItem[];
      headcount: number;
      eventType: EventType;
    }}
  | { type: 'HYDRATE'; payload: CateringState }
  | { type: 'RESET' };

// Event type configuration
export interface EventTypeConfig {
  id: EventType;
  name: string;
  description: string;
  icon: string;
  suggestedItems: string[];
}

// Order status
export type OrderStatus = 'pending' | 'invoiced' | 'paid' | 'cancelled';

// API Response types
export interface ProductsResponse {
  products: CateringProduct[];
  error?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  invoiceNumber?: string;
  paymentLink?: string | null;
  error?: string;
  message?: string;
}

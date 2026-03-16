'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  CateringState,
  CateringAction,
  EventType,
  EventInfo,
  BudgetRange,
  CateringProduct,
  CateringPackage,
  SelectedCateringItem,
  OrderType,
} from '@/lib/types';
import {
  calculateTotalCost,
  calculatePerPersonCost,
  calculateTotalServings,
  calculateAllOrderItems,
} from '@/lib/pricing';
import { CalculatedOrderItem } from '@/lib/types';

const STORAGE_KEY = 'catering-state';

const initialState: CateringState = {
  currentStep: 1,
  eventType: null,
  eventInfo: null,
  orderMode: null,
  budgetRange: null,
  customBudget: null,
  orderType: null,
  headcount: 10,
  selectedItems: [],
  selectedPackage: null,
  buyerInfo: null,
};

function loadState(): CateringState {
  if (typeof window === 'undefined') return initialState;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore errors
  }
  return initialState;
}

function saveState(state: CateringState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

function cateringReducer(state: CateringState, action: CateringAction): CateringState {
  switch (action.type) {
    case 'SET_EVENT_TYPE': {
      return {
        ...state,
        eventType: action.payload,
        currentStep: 2, // advance to Event Info step
      };
    }

    case 'SET_EVENT_INFO': {
      return {
        ...state,
        eventInfo: action.payload,
        currentStep: 3, // advance to Headcount & Budget step
      };
    }

    case 'SET_ORDER_MODE': {
      return {
        ...state,
        orderMode: action.payload,
      };
    }

    case 'SET_BUDGET_RANGE': {
      return {
        ...state,
        budgetRange: action.payload,
        customBudget: action.payload.isCustom ? state.customBudget : null,
      };
    }

    case 'SET_CUSTOM_BUDGET': {
      return {
        ...state,
        customBudget: action.payload,
      };
    }

    case 'SET_ORDER_TYPE': {
      return {
        ...state,
        orderType: action.payload,
        currentStep: 5, // advance to product/package selection
        // Clear the opposite selection type to prevent stale totals
        ...(action.payload === 'build-your-own' ? { selectedPackage: null } : { selectedItems: [] }),
      };
    }

    case 'SET_HEADCOUNT': {
      return {
        ...state,
        headcount: Math.max(1, action.payload),
      };
    }

    case 'ADD_ITEM': {
      const existingIndex = state.selectedItems.findIndex(
        (item) => item.product.id === action.payload.id
      );

      if (existingIndex >= 0) {
        const updated = [...state.selectedItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return { ...state, selectedItems: updated, selectedPackage: null };
      }

      return {
        ...state,
        selectedPackage: null, // Clear any stale package so totalCost uses individual items
        selectedItems: [
          ...state.selectedItems,
          { product: action.payload, quantity: 1 },
        ],
      };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        selectedItems: state.selectedItems.filter(
          (item) => item.product.id !== action.payload
        ),
      };
    }

    case 'UPDATE_ITEM_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          selectedPackage: null,
          selectedItems: state.selectedItems.filter(
            (item) => item.product.id !== productId
          ),
        };
      }

      return {
        ...state,
        selectedPackage: null,
        selectedItems: state.selectedItems.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      };
    }

    case 'CLEAR_ITEMS': {
      return {
        ...state,
        selectedItems: [],
      };
    }

    case 'SELECT_PACKAGE': {
      return {
        ...state,
        selectedPackage: action.payload,
        selectedItems: [], // Clear individual items when selecting a package
      };
    }

    case 'CLEAR_PACKAGE': {
      return {
        ...state,
        selectedPackage: null,
      };
    }

    case 'SET_STEP': {
      return {
        ...state,
        currentStep: action.payload,
      };
    }

    case 'GO_BACK': {
      const prevStep = Math.max(1, state.currentStep - 1) as 1 | 2 | 3 | 4 | 5 | 6;
      return {
        ...state,
        currentStep: prevStep,
      };
    }

    case 'SET_BUYER_INFO': {
      return {
        ...state,
        buyerInfo: action.payload,
      };
    }

    case 'HYDRATE': {
      return action.payload;
    }

    case 'RESET': {
      saveState(initialState);
      return initialState;
    }

    default:
      return state;
  }
}

interface CateringContextType {
  state: CateringState;
  dispatch: React.Dispatch<CateringAction>;
  // Computed values
  totalCost: number;
  perPersonCost: number;
  totalServings: number;
  calculatedItems: CalculatedOrderItem[];
  // Helper functions
  getItemQuantity: (productId: string) => number;
  canProceedToCheckout: () => boolean;
  isItemInCart: (productId: string) => boolean;
}

const CateringContext = createContext<CateringContextType | undefined>(undefined);

export function CateringProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cateringReducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate state from sessionStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (
      saved &&
      (saved.eventType || saved.selectedItems.length > 0 || saved.currentStep > 1)
    ) {
      dispatch({ type: 'HYDRATE', payload: saved });
    }
    setHydrated(true);
  }, []);

  // Persist state to sessionStorage on every change (after hydration)
  useEffect(() => {
    if (hydrated) {
      saveState(state);
    }
  }, [state, hydrated]);

  // Computed values - differ based on order type
  const calculatedItems = calculateAllOrderItems(state.selectedItems, state.headcount);

  const totalCost = state.selectedPackage
    ? state.selectedPackage.pricePerPerson * state.headcount  // Package: fixed per-person × headcount
    : calculateTotalCost(state.selectedItems, state.headcount); // Build your own: calculated based on headcount

  const perPersonCost = state.selectedPackage
    ? state.selectedPackage.pricePerPerson                    // Package: fixed per-person price
    : calculatePerPersonCost(state.selectedItems, state.headcount); // Build your own: total / headcount

  const totalServings = calculateTotalServings(state.selectedItems, state.headcount);

  // Helper functions
  const getItemQuantity = (productId: string): number => {
    const item = state.selectedItems.find((i) => i.product.id === productId);
    return item?.quantity || 0;
  };

  const isItemInCart = (productId: string): boolean => {
    return state.selectedItems.some((item) => item.product.id === productId);
  };

  const canProceedToCheckout = (): boolean => {
    const hasSelection = state.selectedPackage !== null || state.selectedItems.length > 0;
    if (state.orderMode === 'alacarte') {
      return hasSelection && state.headcount > 0;
    }
    return (
      state.eventType !== null &&
      hasSelection &&
      state.headcount > 0
    );
  };

  return (
    <CateringContext.Provider
      value={{
        state,
        dispatch,
        totalCost,
        perPersonCost,
        totalServings,
        calculatedItems,
        getItemQuantity,
        canProceedToCheckout,
        isItemInCart,
      }}
    >
      {children}
    </CateringContext.Provider>
  );
}

export function useCatering() {
  const context = useContext(CateringContext);
  if (context === undefined) {
    throw new Error('useCatering must be used within a CateringProvider');
  }
  return context;
}

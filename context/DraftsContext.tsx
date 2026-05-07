'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useCatering } from './CateringContext';
import { useAuth } from './AuthContext';
import { CateringState } from '@/lib/types';
import { getOrCreateAnonSessionId } from '@/lib/anon-session';

export interface DraftCheckoutForm {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  eventName?: string;
  eventDate?: string;
  deliveryTime?: string;
  deliveryType?: 'delivery' | 'pickup';
  deliveryInstructions?: string;
  specialInstructions?: string;
  customerNotes?: string;
  taxExempt?: boolean;
}

export interface DraftStatePayload {
  catering: CateringState;
  checkoutForm?: DraftCheckoutForm;
}

export interface DraftRecord {
  id: string;
  name: string;
  state: DraftStatePayload;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  converted_order_id: string | null;
}

interface DraftsContextType {
  drafts: DraftRecord[];
  activeDraft: DraftRecord | null;
  loading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refresh: () => Promise<void>;
  startNewDraft: () => Promise<void>;
  resumeDraft: (id: string) => Promise<void>;
  duplicateDraft: (id: string) => Promise<void>;
  renameDraft: (id: string, name: string) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  markActiveConverted: (orderId: string) => Promise<void>;
  saveCheckoutForm: (form: DraftCheckoutForm) => void;
  getCheckoutForm: () => DraftCheckoutForm | null;
}

const DraftsContext = createContext<DraftsContextType | undefined>(undefined);

const SAVE_DEBOUNCE_MS = 1500;

function defaultDraftName(): string {
  const d = new Date();
  const month = d.toLocaleString(undefined, { month: 'short' });
  const day = d.getDate();
  return `Untitled — ${month} ${day}`;
}

function hasMeaningfulContent(state: CateringState): boolean {
  if (!state) return false;
  if (state.selectedItems?.length) return true;
  if (state.selectedPackage) return true;
  if (state.eventType) return true;
  if (state.eventInfo) return true;
  if (state.buyerInfo) return true;
  return false;
}

export function DraftsProvider({ children }: { children: ReactNode }) {
  const { state: cateringState, dispatch } = useCatering();
  const { user, loading: authLoading } = useAuth();

  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checkoutForm, setCheckoutFormState] = useState<DraftCheckoutForm | null>(null);

  // Refs that aren't reactive but feed the auto-save effect
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSerializedRef = useRef<string>('');
  const checkoutFormRef = useRef<DraftCheckoutForm | null>(null);
  const suppressAutoSaveRef = useRef(true); // suppressed until first list load completes
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    checkoutFormRef.current = checkoutForm;
  }, [checkoutForm]);

  // Bootstrap anon session on mount (client-side only).
  useEffect(() => {
    getOrCreateAnonSessionId();
  }, []);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/drafts', { credentials: 'include' });
      if (!res.ok) {
        setDrafts([]);
        return [] as DraftRecord[];
      }
      const data = await res.json();
      const list: DraftRecord[] = data.drafts ?? [];
      setDrafts(list);
      const active = list.find((d) => d.is_active) ?? null;
      setActiveId(active?.id ?? null);
      if (active?.state?.checkoutForm) {
        setCheckoutFormState(active.state.checkoutForm);
      }
      return list;
    } catch (err) {
      console.error('fetchDrafts error', err);
      setDrafts([]);
      return [] as DraftRecord[];
    }
  }, []);

  // Initial load (and re-load after auth state changes).
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    suppressAutoSaveRef.current = true;

    (async () => {
      // If a user just signed in, attempt to migrate any anon drafts first.
      if (user) {
        try {
          await fetch('/api/drafts/migrate', { method: 'POST', credentials: 'include' });
        } catch {
          // non-fatal
        }
      }

      const list = await fetchDrafts();
      if (cancelled) return;
      // Seed the last-saved snapshot from the active draft so auto-save doesn't
      // immediately resave the same content we just loaded.
      const active = list.find((d) => d.is_active);
      lastSavedSerializedRef.current = active
        ? JSON.stringify(active.state ?? {})
        : '';
      setLoading(false);
      // Allow auto-save now that initial state is established.
      suppressAutoSaveRef.current = false;
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchDrafts]);

  const upsertActiveDraft = useCallback(async (payload: DraftStatePayload, name?: string) => {
    const res = await fetch('/api/drafts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name ?? defaultDraftName(),
        state: payload,
        is_active: true,
      }),
    });
    if (!res.ok) throw new Error('Failed to create draft');
    const data = await res.json();
    return data.draft as DraftRecord;
  }, []);

  const patchDraft = useCallback(async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/drafts/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update draft');
    const data = await res.json();
    return data.draft as DraftRecord;
  }, []);

  // Debounced auto-save: serialize current catering+checkout snapshot, compare to last saved, send.
  useEffect(() => {
    if (loading || suppressAutoSaveRef.current) return;
    if (!hasMeaningfulContent(cateringState)) return;

    const payload: DraftStatePayload = {
      catering: cateringState,
      ...(checkoutForm ? { checkoutForm } : {}),
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedSerializedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        let draft: DraftRecord;
        const currentId = activeIdRef.current;
        if (currentId) {
          draft = await patchDraft(currentId, { state: payload });
        } else {
          draft = await upsertActiveDraft(payload);
          setActiveId(draft.id);
        }
        lastSavedSerializedRef.current = JSON.stringify(draft.state ?? {});
        setDrafts((prev) => {
          const idx = prev.findIndex((d) => d.id === draft.id);
          if (idx === -1) return [draft, ...prev];
          const next = [...prev];
          next[idx] = draft;
          return next.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        });
      } catch (err) {
        console.error('draft auto-save failed', err);
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [cateringState, checkoutForm, loading, patchDraft, upsertActiveDraft]);

  // beforeunload: best-effort flush via keepalive fetch.
  useEffect(() => {
    function flush() {
      if (suppressAutoSaveRef.current) return;
      if (!hasMeaningfulContent(cateringState)) return;
      const payload: DraftStatePayload = {
        catering: cateringState,
        ...(checkoutFormRef.current ? { checkoutForm: checkoutFormRef.current } : {}),
      };
      const serialized = JSON.stringify(payload);
      if (serialized === lastSavedSerializedRef.current) return;

      const body = JSON.stringify({
        name: defaultDraftName(),
        state: payload,
        is_active: true,
      });
      const url = activeIdRef.current ? `/api/drafts/${activeIdRef.current}` : '/api/drafts';
      const method = activeIdRef.current ? 'PATCH' : 'POST';
      try {
        fetch(url, {
          method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: activeIdRef.current ? JSON.stringify({ state: payload }) : body,
          keepalive: true,
        });
      } catch {
        // ignore
      }
    }

    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [cateringState]);

  const refresh = useCallback(async () => {
    await fetchDrafts();
  }, [fetchDrafts]);

  const startNewDraft = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    suppressAutoSaveRef.current = true;
    try {
      if (activeIdRef.current) {
        try {
          await patchDraft(activeIdRef.current, { is_active: false });
        } catch (err) {
          console.error(err);
        }
      }
      dispatch({ type: 'RESET' });
      setCheckoutFormState(null);
      setActiveId(null);
      lastSavedSerializedRef.current = '';
      await fetchDrafts();
    } finally {
      // Re-enable auto-save on next tick so the RESET dispatch settles first.
      setTimeout(() => {
        suppressAutoSaveRef.current = false;
      }, 0);
    }
  }, [dispatch, fetchDrafts, patchDraft]);

  const resumeDraft = useCallback(async (id: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    suppressAutoSaveRef.current = true;
    try {
      const draft = await patchDraft(id, { is_active: true });
      const cateringPayload = draft.state?.catering;
      if (cateringPayload) {
        dispatch({ type: 'HYDRATE', payload: cateringPayload });
      }
      setCheckoutFormState(draft.state?.checkoutForm ?? null);
      setActiveId(draft.id);
      lastSavedSerializedRef.current = JSON.stringify(draft.state ?? {});
      await fetchDrafts();
    } finally {
      // Allow auto-save again on the next tick so the dispatch above doesn't
      // immediately re-trigger a save with the same payload.
      setTimeout(() => {
        suppressAutoSaveRef.current = false;
      }, 0);
    }
  }, [dispatch, fetchDrafts, patchDraft]);

  const duplicateDraft = useCallback(async (id: string) => {
    const res = await fetch(`/api/drafts/${id}/duplicate`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to duplicate draft');
    await fetchDrafts();
  }, [fetchDrafts]);

  const renameDraft = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await patchDraft(id, { name: trimmed });
    await fetchDrafts();
  }, [fetchDrafts, patchDraft]);

  const deleteDraft = useCallback(async (id: string) => {
    const res = await fetch(`/api/drafts/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to delete draft');
    if (activeIdRef.current === id) {
      setActiveId(null);
      lastSavedSerializedRef.current = '';
    }
    await fetchDrafts();
  }, [fetchDrafts]);

  const markActiveConverted = useCallback(async (orderId: string) => {
    if (!activeIdRef.current) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    suppressAutoSaveRef.current = true;
    try {
      await patchDraft(activeIdRef.current, { converted_order_id: orderId });
      setActiveId(null);
      setCheckoutFormState(null);
      lastSavedSerializedRef.current = '';
      await fetchDrafts();
    } catch (err) {
      console.error('markActiveConverted failed', err);
    } finally {
      suppressAutoSaveRef.current = false;
    }
  }, [fetchDrafts, patchDraft]);

  const saveCheckoutForm = useCallback((form: DraftCheckoutForm) => {
    setCheckoutFormState((prev) => ({ ...(prev ?? {}), ...form }));
  }, []);

  const getCheckoutForm = useCallback((): DraftCheckoutForm | null => {
    return checkoutFormRef.current ?? null;
  }, []);

  const activeDraft = useMemo(
    () => drafts.find((d) => d.id === activeId) ?? null,
    [drafts, activeId]
  );

  const value: DraftsContextType = {
    drafts,
    activeDraft,
    loading,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    refresh,
    startNewDraft,
    resumeDraft,
    duplicateDraft,
    renameDraft,
    deleteDraft,
    markActiveConverted,
    saveCheckoutForm,
    getCheckoutForm,
  };

  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

export function useDrafts() {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error('useDrafts must be used within a DraftsProvider');
  return ctx;
}

'use client';

import { useRouter } from 'next/navigation';
import { useCatering } from '@/context/CateringContext';

export default function EditOrderBanner() {
  const { state, dispatch } = useCatering();
  const router = useRouter();

  if (!state.editingOrderId) return null;

  const handleCancel = () => {
    if (!confirm('Discard changes and exit edit mode?')) return;
    dispatch({ type: 'EXIT_EDIT_MODE' });
    router.push('/admin/orders');
  };

  return (
    <div className="sticky top-0 z-30 bg-[#E8621A] text-white">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="truncate">
            <span className="font-semibold">Editing order {state.editingOrderNumber}</span>
            <span className="hidden sm:inline opacity-90"> — adjust the cart, then continue to checkout to save.</span>
          </span>
        </div>
        <button
          onClick={handleCancel}
          className="shrink-0 px-3 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded transition-colors"
        >
          Cancel Edit
        </button>
      </div>
    </div>
  );
}

'use client';

import { useCatering } from '@/context/CateringContext';
import { hasEnoughServings, calculateServingCoverage } from '@/lib/pricing';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';

interface HaveEnoughFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMore: () => void;
  onReduceGuests: () => void;
  onContinue: () => void;
}

export default function HaveEnoughFoodModal({
  isOpen,
  onClose,
  onAddMore,
  onReduceGuests,
  onContinue,
}: HaveEnoughFoodModalProps) {
  const { state, totalServings } = useCatering();

  if (!isOpen) return null;

  const coverage = calculateServingCoverage(state.selectedItems, state.headcount);
  const coverageCapped = Math.min(coverage, 100);
  const variant = coverage >= 100 ? 'success' : coverage >= 70 ? 'warning' : 'error';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
          {/* Icon */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-oswald text-2xl font-bold text-[#383838] tracking-wide">
              HAVE ENOUGH FOOD?
            </h3>
          </div>

          {/* Coverage Info */}
          <div className="mb-6">
            <p className="text-center text-gray-600 mb-4">
              Your order covers <strong className="text-[#383838]">{coverage}%</strong> of {state.headcount} guests
            </p>

            <ProgressBar
              value={coverageCapped}
              max={100}
              variant={variant}
              showPercentage
            />

            <p className="text-center text-xs text-gray-500 mt-2">
              {totalServings} servings for {state.headcount} guests
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={onAddMore} className="w-full">
              Add More Items
            </Button>
            <Button onClick={onReduceGuests} variant="outline" className="w-full">
              Reduce Guest Count
            </Button>
            <button
              onClick={onContinue}
              className="w-full text-sm text-gray-500 hover:text-[#383838] transition-colors py-2"
            >
              Continue anyway
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

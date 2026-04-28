'use client';

import { useCatering } from '@/context/CateringContext';
import EventInfoStep from '@/components/catering/EventInfoStep';
import ProductSelectionStep from '@/components/catering/ProductSelectionStep';
import EquipmentStep from '@/components/catering/EquipmentStep';
import StepIndicator from '@/components/catering/StepIndicator';

export default function PlanPage() {
  const { state, dispatch } = useCatering();

  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      <StepIndicator />

      <EventInfoStep />

      {state.currentStep >= 5 && (
        <ProductSelectionStep />
      )}

      {state.currentStep >= 6 && state.orderType === 'build-your-own' && (
        <EquipmentStep />
      )}
    </div>
  );
}

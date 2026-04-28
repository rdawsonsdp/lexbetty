'use client';

import PackageSelectionStep from '@/components/catering/PackageSelectionStep';
import StepIndicator from '@/components/catering/StepIndicator';

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      <StepIndicator />
      <PackageSelectionStep />
    </div>
  );
}

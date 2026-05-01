'use client';

import PackageSelectionStep from '@/components/catering/PackageSelectionStep';
import StepIndicator from '@/components/catering/StepIndicator';

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      <StepIndicator />
      <PackageSelectionStep
        filter={(pkg) => pkg.id.startsWith('betty-box-')}
        title="CORPORATE BOX LUNCHES"
        subtitle="Boardroom-ready box lunches for your team events, client meetings, and conferences — slow-smoked by Chef Dominique, delivered fresh and ready to serve."
        heroImage="/images/corporate-box-lunches-hero.webp"
        showFeastUpsell={false}
      />
    </div>
  );
}

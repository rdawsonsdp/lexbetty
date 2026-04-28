'use client';

import { usePathname } from 'next/navigation';

const STEPS = [
  { id: 'plan', label: 'Plan', paths: ['/plan', '/'] },
  { id: 'order', label: 'Order', paths: ['/products', '/packages', '/food-truck', '/menus'] },
  { id: 'pay', label: 'Pay', paths: ['/checkout'] },
];

interface StepIndicatorProps {
  currentStep?: number;
  onNavigate?: (step: number) => void;
}

export default function StepIndicator({ currentStep, onNavigate }: StepIndicatorProps) {
  const pathname = usePathname();

  const activeIndex = STEPS.findIndex(step =>
    step.paths.some(p => pathname.startsWith(p) && p !== '/')
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-[52px] sm:top-[56px] z-30">
      <div className="container mx-auto px-4">
        <ol className="flex items-center justify-center gap-2 sm:gap-4 py-3 text-sm">
          {STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            const isCompleted = activeIndex > index;

            return (
              <li key={step.id} className="flex items-center shrink-0">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-300 mr-2 sm:mr-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <span
                  className={`
                    font-oswald tracking-wider text-base sm:text-lg
                    ${isActive
                      ? 'text-[#E8621A] font-bold'
                      : isCompleted
                      ? 'text-green-600 font-medium'
                      : 'text-gray-400 font-medium'
                    }
                  `}
                >
                  {isCompleted && (
                    <svg className="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {step.label}.
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

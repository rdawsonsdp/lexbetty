'use client';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  onNavigate: (step: number) => void;
}

const STEPS = [
  { number: 1, label: 'Order Type' },
  { number: 2, label: 'Event Details' },
  { number: 3, label: 'Guests & Budget' },
  { number: 4, label: 'Menu Style' },
  { number: 5, label: 'Build Order' },
  { number: 6, label: 'Extras' },
];

export default function StepIndicator({
  currentStep,
  onNavigate,
}: StepIndicatorProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <ol className="flex items-center gap-1 sm:gap-2 py-3 overflow-x-auto text-sm">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isClickable = isCompleted;

            return (
              <li key={step.number} className="flex items-center shrink-0">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-300 mx-1 sm:mx-2 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                <button
                  onClick={() => isClickable && onNavigate(step.number)}
                  disabled={!isClickable}
                  className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-md transition-all whitespace-nowrap
                    ${isCompleted
                      ? 'text-[#E8621A] hover:bg-[#E8621A]/10 cursor-pointer font-medium'
                      : isCurrent
                      ? 'text-[#1A1A1A] font-bold cursor-default'
                      : 'text-gray-400 cursor-default'
                    }
                  `}
                >
                  {isCompleted && (
                    <svg
                      className="w-4 h-4 text-green-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.number}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

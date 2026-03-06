'use client';

const PROCESS_STEPS = [
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    step: '1',
    title: 'Order Online',
    description: 'Browse our menu and build your order in minutes — no calls, no back-and-forth.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.5 11l1.5-1.5M19 9.5l2 2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9.5c0 0 1-2 2.5-2" />
      </svg>
    ),
    step: '2',
    title: 'We Confirm',
    description: 'Our team personally reviews your order and reaches out to confirm every detail.',
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    step: '3',
    title: 'Pay & You\'re Set',
    description: 'Finalize payment before your event and relax — we\'ve got it from here.',
  },
];

export default function TrustSignals() {
  return (
    <section className="bg-[#f7efd7] py-10 sm:py-14 border-y border-[#dabb64]/30">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#363333] mb-2">
          How It Works
        </h2>
        <p className="text-center text-sm sm:text-base text-[#363333]/60 mb-8 sm:mb-10">
          We make it easy so you can focus on everything else.
        </p>
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-8 sm:gap-6 lg:gap-12 max-w-4xl mx-auto">
          {PROCESS_STEPS.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center flex-1 max-w-[260px] relative">
              {index < PROCESS_STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-40px)] lg:w-[calc(100%-20px)]">
                  <svg className="w-full h-4 text-[#dabb64]/40" viewBox="0 0 100 16" preserveAspectRatio="none">
                    <path d="M0 8h90M85 3l7 5-7 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div className="w-16 h-16 rounded-full bg-[#363333] text-[#dabb64] flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <span className="text-xs font-bold text-[#dabb64] tracking-widest uppercase mb-1">
                Step {step.step}
              </span>
              <h3 className="text-lg font-bold text-[#363333] mb-2">{step.title}</h3>
              <p className="text-sm text-[#363333]/70 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

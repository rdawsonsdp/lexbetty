'use client';

const VALUE_PROPS = [
  {
    icon: (
      <svg className="w-5 h-5 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Plan.',
    description: 'Share your guest count, date, and dietary needs.',
  },
  {
    icon: (
      <svg className="w-5 h-5 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Order.',
    description: 'Right portions, calculated automatically.',
  },
  {
    icon: (
      <svg className="w-5 h-5 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Enjoy.',
    description: 'On time, set up, ready to serve.',
  },
];

export default function ValueProposition() {
  return (
    <section className="bg-white py-4 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-8 max-w-5xl mx-auto">
          {VALUE_PROPS.map((prop, index) => (
            <div
              key={index}
              className="text-center px-1 sm:px-4"
            >
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-[#E8621A]/20 text-[#1A1A1A] mb-1 sm:mb-4">
                {prop.icon}
              </div>
              <h3 className="font-oswald text-sm sm:text-xl font-bold text-[#1A1A1A] mb-0 sm:mb-2 tracking-wide">
                {prop.title}
              </h3>
              <p className="hidden sm:block text-sm text-gray-600 leading-relaxed">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

const USE_CASES = [
  'Corporate Events',
  'Office Catering',
  'Wedding Receptions',
  'Holiday Parties',
  'Board Meetings',
  'Team Lunches',
  'Company Retreats',
  'Client Dinners',
];

export default function ClientLogos() {
  return (
    <section className="bg-white py-8 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Trusted for
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {USE_CASES.map((useCase, index) => (
            <span
              key={index}
              className="px-4 py-1.5 rounded-full bg-[#F5EDE0] text-[#1A1A1A] text-xs sm:text-sm font-semibold"
            >
              {useCase}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

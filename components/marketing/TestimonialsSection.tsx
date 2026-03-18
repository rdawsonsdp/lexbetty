'use client';

import Card from '@/components/ui/Card';

const TESTIMONIALS = [
  {
    quote: 'Soul Delivered made our company holiday party unforgettable. The Shrimp & Grits were a huge hit, and the setup was flawless. We\'ll be ordering again for every event.',
    author: 'Jennifer M.',
    company: 'Marketing Director, Tech Startup',
    rating: 5,
  },
  {
    quote: 'We needed catering for 150 people with just 3 days notice. Soul Delivered not only delivered on time but the food was absolutely incredible. The mac & cheese alone was worth it.',
    author: 'David R.',
    company: 'Office Manager, Law Firm',
    rating: 5,
  },
  {
    quote: 'As someone who plans corporate events weekly, I\'ve tried every caterer in Chicago. Soul Delivered is our go-to now. Consistent quality, great prices, and they actually answer the phone.',
    author: 'Sarah K.',
    company: 'Event Coordinator',
    rating: 5,
  },
  {
    quote: 'The vegan options blew our team away. Finally a caterer that doesn\'t treat plant-based as an afterthought. The Vegan Scramble and Sunrise Wraps were devoured in minutes.',
    author: 'Marcus T.',
    company: 'HR Director, Creative Agency',
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-[#E8621A]' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="bg-[#F5EDE0] py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-oswald text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-wider mb-3">
            WHAT OUR CLIENTS SAY
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Trusted by companies across Chicago for their most important events
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((testimonial, index) => (
            <Card key={index} className="flex flex-col" hover={false}>
              <StarRating rating={testimonial.rating} />
              <p className="text-sm text-gray-700 mt-3 mb-4 flex-grow italic leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="border-t border-gray-200 pt-3">
                <p className="font-oswald font-bold text-[#1A1A1A] text-sm">
                  {testimonial.author}
                </p>
                <p className="text-xs text-gray-500">{testimonial.company}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

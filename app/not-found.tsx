import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="font-oswald text-4xl font-bold text-near-black mb-4">404</h2>
        <p className="text-warm-gray mb-6">Page not found.</p>
        <Link
          href="/"
          className="bg-smokehouse-orange text-white px-6 py-3 rounded-lg font-oswald font-semibold hover:bg-smokehouse-orange/90 transition-colors inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="font-oswald text-2xl font-bold text-near-black mb-4">
          Something went wrong
        </h2>
        <p className="text-warm-gray mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="bg-smokehouse-orange text-white px-6 py-3 rounded-lg font-oswald font-semibold hover:bg-smokehouse-orange/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

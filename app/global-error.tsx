'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#9B9189', marginBottom: '1.5rem' }}>{error.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={reset}
              style={{ backgroundColor: '#E8621A', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

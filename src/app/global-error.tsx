'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'sans-serif',
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <main>
          <h1>A critical error occurred</h1>
          <p>Please try again.</p>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              marginTop: '1rem',
            }}
          >
            <button type="button" onClick={() => reset()}>
              Try again
            </button>
            <Link href="/">Back to home</Link>
          </div>
        </main>
      </body>
    </html>
  );
}

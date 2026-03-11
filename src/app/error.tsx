'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
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
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div>
        <h1>Something went wrong</h1>
        <p>We couldn&apos;t load this page.</p>
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
      </div>
    </main>
  );
}

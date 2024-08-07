'use client';

import { useEffect } from 'react';
import RunGSAP from '@/helpers/runGSAP';

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {}, []);

  return (
    <>
      <RunGSAP />
      {children}
    </>
  );
}

'use client';

import { useEffect } from 'react';
import RunGSAP from '@/helpers/runGSAP';
import RunLaser from '@/helpers/runLaser';

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {}, []);

  return (
    <>
      <RunGSAP />
      <RunLaser />
      {children}
    </>
  );
}

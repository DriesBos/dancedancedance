'use client';

import { usePathname } from 'next/navigation';
import BlokFooter from '@/components/BlokFooter/BlokFooter';

export default function BlokFooterWrapper() {
  const pathname = usePathname();

  // Don't show footer on blurbs page
  if (pathname === '/blurbs') {
    return null;
  }

  return <BlokFooter />;
}

'use client';

import { usePathname } from 'next/navigation';
import BlokHead from '@/components/BlokHead';

export default function BlokHeadWrapper() {
  const pathname = usePathname();
  
  // Don't show header on blurbs page
  if (pathname === '/blurbs') {
    return null;
  }
  
  return <BlokHead />;
}


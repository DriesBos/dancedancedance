'use client';

import { usePathname } from 'next/navigation';
import BlokSidePanels from '@/components/BlokSidePanels';

const BlokHeadSidePanels = () => {
  const pathname = usePathname() || '/';
  const showTopPanelPortrait =
    pathname === '/about' || pathname.startsWith('/about/');

  return <BlokSidePanels showTopPanelPortrait={showTopPanelPortrait} />;
};

export default BlokHeadSidePanels;

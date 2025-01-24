'use client';

import { usePathname } from 'next/navigation';
import { useStore } from '@/store/store';

type Props = {
  children: React.ReactNode;
  className: string;
};

const AppInitializer = ({ children, className }: Props) => {
  const theme = useStore((state: any) => state.theme);
  const space = useStore((state: any) => state.space);
  const path = usePathname();
  const slug = path.split('/')[1] || 'home';

  return (
    <body
      className={`${className}`}
      data-theme={theme}
      data-space={space}
      data-page={slug}
    >
      {children}
    </body>
  );
};

export default AppInitializer;

'use client';

import { useStore } from '@/store/store';

type Props = {
  children: React.ReactNode;
  className: string;
};

const AppInitializer = ({ children, className }: Props) => {
  const theme = useStore((state: any) => state.theme);
  const space = useStore((state: any) => state.space);

  return (
    <body className={`${className}`} data-theme={theme} data-space={space}>
      {children}
    </body>
  );
};

export default AppInitializer;

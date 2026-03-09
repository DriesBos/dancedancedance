'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import styles from './TerrainDockedContent.module.sass';

type TerrainDockedContentProps = {
  children: React.ReactNode;
};

export default function TerrainDockedContent({
  children,
}: TerrainDockedContentProps) {
  const theme = useStore((state) => state.theme);
  const terrainDocked = useStore((state) => state.terrainDocked);
  const isTerrainDockTheme = theme === 'GLACIAL' || theme === 'GLACIAL_HD';
  const shouldRenderContent = !isTerrainDockTheme || terrainDocked;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!shouldRenderContent) {
      setIsVisible(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [shouldRenderContent]);

  if (!shouldRenderContent) {
    return null;
  }

  return (
    <div className={`${styles.root} ${isVisible ? styles.visible : ''}`}>
      {children}
    </div>
  );
}

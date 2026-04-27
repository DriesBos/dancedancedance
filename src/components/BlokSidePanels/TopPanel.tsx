'use client';

import { memo } from 'react';
import GrainyGradient from '../GrainyGradient/GrainyGradient';
import { useStore } from '@/store/store';
import { t } from '@/lib/locale';
import styles from './BlokSidePanels.module.sass';

interface TopPanelProps {
  showPortrait?: boolean;
}

const TopPanelComponent = ({ showPortrait = false }: TopPanelProps) => {
  const locale = useStore((state) => state.locale);
  const className = `${styles.side} ${styles.side_Top} ${
    showPortrait ? 'cursorMessage' : ''
  } side side_Top`;

  const sharedProps = {
    className,
    'data-cursor-message': showPortrait
      ? t('cursor.schedule', locale)
      : undefined,
  } as const;

  if (showPortrait) {
    return (
      <a
        {...sharedProps}
        href="https://calendly.com/info-b9c/30min"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GrainyGradient variant="blok" />
        {/* Dithered video portrait temporarily disabled. */}
      </a>
    );
  }

  return (
    <div {...sharedProps}>
      <GrainyGradient variant="blok" />
    </div>
  );
};

const TopPanel = memo(
  TopPanelComponent,
  (prevProps, nextProps) => prevProps.showPortrait === nextProps.showPortrait,
);

TopPanel.displayName = 'TopPanel';

export default TopPanel;

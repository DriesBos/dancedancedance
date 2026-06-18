'use client';

import { memo } from 'react';
import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

interface TopPanelProps {
  showPortrait?: boolean;
  surface?: 'default' | 'transparent';
}

const TopPanelComponent = ({
  showPortrait = false,
  surface = 'default',
}: TopPanelProps) => {
  const className = `${styles.side} ${styles.side_Top} side side_Top`;

  if (showPortrait) {
    return (
      <a
        className={className}
        data-surface={surface}
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
    <div className={className} data-surface={surface}>
      <GrainyGradient variant="blok" />
    </div>
  );
};

const TopPanel = memo(
  TopPanelComponent,
  (prevProps, nextProps) =>
    prevProps.showPortrait === nextProps.showPortrait &&
    prevProps.surface === nextProps.surface,
);

TopPanel.displayName = 'TopPanel';

export default TopPanel;

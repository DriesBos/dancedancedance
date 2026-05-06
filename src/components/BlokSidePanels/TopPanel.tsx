'use client';

import { memo } from 'react';
import GrainyGradient from '../GrainyGradient/GrainyGradient';
import styles from './BlokSidePanels.module.sass';

interface TopPanelProps {
  showPortrait?: boolean;
}

const TopPanelComponent = ({ showPortrait = false }: TopPanelProps) => {
  const className = `${styles.side} ${styles.side_Top} side side_Top`;

  if (showPortrait) {
    return (
      <a
        className={className}
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
    <div className={className}>
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

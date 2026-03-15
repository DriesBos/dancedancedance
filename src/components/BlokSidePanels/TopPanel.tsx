import { memo } from 'react';
import GrainyGradient from '../GrainyGradient/GrainyGradient';
import LazyDitheringVideoPortrait from '@/components/LazyDitheringVideoPortrait';
import IconFullscreen from '@/components/Icons/IconFullscreen';
import styles from './BlokSidePanels.module.sass';

interface TopPanelProps {
  showPortrait?: boolean;
}

const TopPanelComponent = ({ showPortrait = false }: TopPanelProps) => {
  const className = `${styles.side} ${styles.side_Top} ${
    showPortrait ? 'cursorMessage' : ''
  } side side_Top`;

  const sharedProps = {
    className,
    'data-cursor-message': showPortrait
      ? 'Schedule a discovery call'
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
        <LazyDitheringVideoPortrait
          /* MP4 source used as input for the dither pass. */
          src="/portraits/portrait_movie.mp4"
          /* Accessible label announced for the rendered canvas output. */
          alt="Dries Bos top panel dithered portrait"
          /* Uses absolute-fill panel sizing/styling for the top panel surface. */
          variant="panel"
          /* Hide debug controls in production; set true for live tuning. */
          showControls={false}
          /* Dither shape mode: "cross" (X marks) or "pixel" (filled blocks). */
          mode="cross"
          /* Approximate dither cell size in px (clamped to 2..8 in props). */
          pixelSize={2}
          /* Contrast multiplier before dithering (clamped to 0..2). */
          contrast={1.2}
          /* Luma cutoff (0..255): lower = denser dark marks. */
          threshold={138}
          /* Optional advanced knobs:
              maxFps={18}        // Frame processing cap (8..30).
              crossWeight={0.18} // Cross stroke thickness factor.
              crossInset={0.2}   // Cross line inset from cell edges.
              invert={false}     // Swap foreground/background roles.
              blackness={0.54}   // Alternate threshold control if threshold is unset.
              themeColors={{     // Per-theme color overrides for canvas draw.
                LIGHT: { foreground: '#000', background: '#fff' },
              }}
          */
        />
        {/* <span className={styles.topPanelFullscreenIcon} aria-hidden="true">
          <IconFullscreen />
        </span> */}
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

import { useEffect, useMemo, useState } from 'react';

export type IconAboutVariant = 'legs' | 'cross' | 'mixed';

export const ICON_ABOUT_FRAME_PATHS = {
  default:
    'M12.25 0c1.375 0 2.5 1.125 2.5 2.5S13.625 5 12.25 5a2.507 2.507 0 0 1-2.5-2.5c0-1.375 1.125-2.5 2.5-2.5M23.5 8.75H16V25h-2.5v-7.5H11V25H8.5V8.75H1v-2.5h22.5z',
  leftLeg:
    'M12.25 0c1.375 0 2.5 1.125 2.5 2.5S13.625 5 12.25 5a2.507 2.507 0 0 1-2.5-2.5c0-1.375 1.125-2.5 2.5-2.5M23.5 8.75H16V25h-2.5v-7.5h-5V8.75H1v-2.5h22.5z',
  rightLeg:
    'M12.25 0c1.375 0 2.5 1.125 2.5 2.5S13.625 5 12.25 5a2.507 2.507 0 0 1-2.5-2.5c0-1.375 1.125-2.5 2.5-2.5M23.5 8.75H16v8.75h-5V25H8.5V8.75H1v-2.5h22.5z',
  leftArmRightLeg:
    'M12.25 0c1.375 0 2.5 1.125 2.5 2.5S13.625 5 12.25 5a2.507 2.507 0 0 1-2.5-2.5c0-1.375 1.125-2.5 2.5-2.5M23.5 8.75H16v8.75h-5V25H8.5V6.25h15zM6 1.25h2.5v7.5H6z',
  rightArmLeftLeg:
    'M12.25 0c1.375 0 2.5 1.125 2.5 2.5S13.625 5 12.25 5a2.507 2.507 0 0 1-2.5-2.5c0-1.375 1.125-2.5 2.5-2.5M16 8.75V25h-2.5v-7.5h-5V8.75H1v-2.5h15zM16 1.25h2.5v7.5H16z',
} as const;

const ICON_ABOUT_FRAME_SEQUENCES: Record<
  IconAboutVariant,
  Array<keyof typeof ICON_ABOUT_FRAME_PATHS>
> = {
  legs: ['default', 'leftLeg', 'default', 'rightLeg'],
  cross: ['default', 'leftArmRightLeg', 'default', 'rightArmLeftLeg'],
  mixed: [
    'default',
    'rightArmLeftLeg',
    'default',
    'leftArmRightLeg',
    'default',
    'leftLeg',
    'default',
    'rightLeg',
  ],
};

interface IconAboutProps {
  variant?: IconAboutVariant;
  animate?: boolean;
  frameDurationMs?: number;
}

const IconAbout = ({
  variant = 'legs',
  animate = false,
  frameDurationMs = 500,
}: IconAboutProps) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const frameSequence = useMemo(
    () => ICON_ABOUT_FRAME_SEQUENCES[variant],
    [variant],
  );

  useEffect(() => {
    if (!animate) {
      setFrameIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frameSequence.length);
    }, frameDurationMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [animate, frameDurationMs, frameSequence]);

  const activeFrame = frameSequence[frameIndex];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 25 25">
      <path fill="currentColor" d={ICON_ABOUT_FRAME_PATHS[activeFrame]} />
    </svg>
  );
};

export default IconAbout;

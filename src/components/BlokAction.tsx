'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import Row from './Row';
import GrainyGradient from './GrainyGradient';
import IconAbout, { ICON_ABOUT_FRAME_SEQUENCES } from './Icons/IconAbout';
import { useStore } from '@/store/store';
import { t } from '@/lib/locale';

const MARQUEE_GROUP_COUNT = 1;
const MARQUEE_REPEATS_PER_GROUP = 50;
const ACTION_ICON_VARIANT = 'mixed';
const ACTION_ICON_FRAME_DURATION_MS = 500;
const ACTION_ICON_FRAME_COUNT =
  ICON_ABOUT_FRAME_SEQUENCES[ACTION_ICON_VARIANT].length;

export default function BlokAction() {
  const pathname = usePathname();
  const locale = useStore((state) => state.locale);
  const label = t('action.start', locale);
  const [iconFrameIndex, setIconFrameIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIconFrameIndex((prev) => (prev + 1) % ACTION_ICON_FRAME_COUNT);
    }, ACTION_ICON_FRAME_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  if (pathname !== '/') return null;

  return (
    <a
      href="mailto:hello@driesbos.com?subject=Let's Make Internet"
      target="_blank"
      rel="noopener noreferrer"
      className="blok blok-Action blok-Animate cursorMessage"
      data-cursor-message={t('cursor.talk', locale)}
    >
      <GrainyGradient variant="blok" />
      <Row>
        <div className="column column-AnimateSlideLeft">
          <div className="animateSlideLeftTrack">
            {Array.from({ length: MARQUEE_GROUP_COUNT }).map(
              (_, groupIndex) => {
                return (
                  <div
                    className="animateSlideLeftGroup"
                    key={groupIndex}
                    aria-hidden={groupIndex > 0}
                  >
                    {Array.from({ length: MARQUEE_REPEATS_PER_GROUP }).map(
                      (_, unitIndex) => (
                        <div className="animateSlideLeftUnit" key={unitIndex}>
                          <span>{label}</span>
                          <div className="icon">
                            <IconAbout
                              variant={ACTION_ICON_VARIANT}
                              frameIndex={iconFrameIndex}
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
        {/* <div className="column column-Icons">
          <div className="icon">
            <IconArrow />
          </div>
        </div> */}
      </Row>
    </a>
  );
}

'use client';

import Row from './Row';
import IconArrow from './Icons/IconArrow';
import GrainyGradient from './GrainyGradient';
import IconAbout from './Icons/IconAbout';

const MARQUEE_GROUP_COUNT = 1;
const MARQUEE_REPEATS_PER_GROUP = 50;

export default function BlokAction() {
  return (
    <a
      href="mailto:info@driesbos.com?subject=Let's Make Internet"
      target="_blank"
      rel="noopener noreferrer"
      className="blok blok-Action blok-Animate cursorMessage"
      data-cursor-message="Let's talk"
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
                          <span>Hire this guy</span>
                          <div className="icon">
                            <IconAbout variant="mixed" animate />
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

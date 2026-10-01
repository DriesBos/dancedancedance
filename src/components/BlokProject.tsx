'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';
import IconLinkOutside from './Icons/IconLinkOutside';
import BlokSidePanels from './BlokSidePanels/BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient/GrainyGradient';
import ColorBurstText from '@/components/ColorBurstTypography/ColorBurstText';
import BlurImage from '@/components/BlurImage';
import type { ProjectData } from '@/lib/fetch-projects';
import { getSafeExternalHref } from '@/lib/safe-url';
import {
  parseStoryblokImageDimensions,
  STORYBLOK_FALLBACK_IMAGE_DIMENSIONS,
} from '@/lib/storyblok-image';
import styles from './BlokProject.module.sass';

interface Props {
  slug?: string;
  year?: string;
  title?: string;
  category?: string[];
  thumbnail?: ProjectData['thumbnail'];
  thumbnailPriority?: boolean;
  stackTimelineItem?: boolean;
  external_link?: { cached_url: string };
  onProjectHover?: () => void;
  onProjectLeave?: () => void;
}

const BlokProject = ({
  slug,
  year,
  title,
  category,
  thumbnail,
  thumbnailPriority = false,
  stackTimelineItem = false,
  external_link,
  onProjectHover,
  onProjectLeave,
}: Props) => {
  const router = useRouter();
  const hasPrefetchedRef = useRef(false);
  const href = slug ? `/projects/${slug}` : null;
  const externalHref = getSafeExternalHref(external_link?.cached_url);
  const projectLabel = title || 'project';
  const thumbnailDimensions = thumbnail?.filename
    ? parseStoryblokImageDimensions(thumbnail.filename) ??
      STORYBLOK_FALLBACK_IMAGE_DIMENSIONS
    : null;

  const prefetchProject = useCallback(() => {
    if (!href || hasPrefetchedRef.current) return;
    router.prefetch(href);
    hasPrefetchedRef.current = true;
  }, [href, router]);

  const handleMouseEnter = () => {
    prefetchProject();
    onProjectHover?.();
  };

  // Leading four digits, not Date: "2023" parses as UTC midnight and reads as
  // 2022 in negative offsets, which also mismatched the UTC-rendered server HTML.
  const displayYear = year ? year.slice(0, 4) : null;
  const categoryLabel = category?.map((item) => item.toLowerCase()).join(', ');

  return (
    <div
      className="blok blok-Project"
      data-project-list-stack-item={stackTimelineItem ? true : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onProjectLeave}
      onTouchStart={prefetchProject}
    >
      <GrainyGradient variant="blok" />
      {stackTimelineItem ? <BlokSidePanels /> : null}
      {href && (
        <Link
          href={href}
          className="projectCardLink cursorInteract"
          aria-label={`View ${projectLabel}`}
          onFocus={prefetchProject}
        />
      )}
      {thumbnail?.filename && thumbnailDimensions ? (
        <div
          className={`${styles.projectThumbnail} ${
            thumbnailPriority ? styles.projectThumbnailFirst : ''
          }`}
        >
          <BlurImage
            src={thumbnail.filename}
            alt=""
            width={thumbnailDimensions.width}
            height={thumbnailDimensions.height}
            sizes="(orientation: portrait) and (pointer: coarse) and (max-width: 770px) calc(100vw - 2rem), (orientation: portrait) and (pointer: coarse) 88vw, 1px"
            className={styles.projectThumbnailImage}
            quality={70}
            loading={thumbnailPriority ? 'eager' : 'lazy'}
          />
        </div>
      ) : null}
      <Row>
        <GrainyGradient variant="blok" className="grainyInRow" />
        <div className="column column-Left">
          {displayYear && (
            <div className="column column-Year">
              <ColorBurstText>{displayYear.toString()}</ColorBurstText>
            </div>
          )}
          {title && (
            <div className="column column-Project">
              <ColorBurstText>{title}</ColorBurstText>
            </div>
          )}
        </div>
        <div className="column column-Right">
          {categoryLabel && (
            <div className="column column-Category">
              <ColorBurstText>{categoryLabel}</ColorBurstText>
            </div>
          )}
          <div className="column column-Icons">
            {externalHref && (
              <a
                className="icon icon-ExternalLink cursorMagnetic"
                href={externalHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${projectLabel} website`}
                data-active="true"
              >
                <IconLinkOutside />
              </a>
            )}
            <div className="icon" aria-hidden="true">
              <IconArrow />
            </div>
          </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokProject;

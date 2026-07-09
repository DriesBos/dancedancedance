'use client';

import { useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';
import type { MouseEvent } from 'react';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';
import IconLinkOutside from './Icons/IconLinkOutside';
import GrainyGradient from '@/components/GrainyGradient';
import BlokSidePanels from './BlokSidePanels';
import { transformStoryblokImageUrl } from '@/lib/storyblok-image';
import { getSafeExternalHref } from '@/lib/safe-url';

interface Props {
  slug?: string;
  year?: string;
  title?: string;
  category?: string[];
  external_link?: { cached_url: string };
  thumbnail?: { filename: string; alt?: string };
  stackIndex?: number;
  isHoverActive?: boolean;
  disableCursorPreview?: boolean;
  hideProjectCopy?: boolean;
  onProjectHover?: (element: HTMLDivElement) => void;
  onProjectLeave?: () => void;
}

export const getProjectThumbnailSrc = (
  thumbnail?: { filename: string; alt?: string },
) => {
  const base = thumbnail?.filename;
  if (!base) return undefined;

  return transformStoryblokImageUrl(base, {
    width: 640,
    height: 480,
    quality: 70,
    smart: true,
    noUpscale: true,
  });
};

const BlokProject = ({
  slug,
  year,
  title,
  category,
  external_link,
  thumbnail,
  stackIndex,
  isHoverActive,
  disableCursorPreview,
  hideProjectCopy,
  onProjectHover,
  onProjectLeave,
}: Props) => {
  const router = useRouter();
  const hasPrefetchedRef = useRef(false);
  const href = slug ? `/projects/${slug}` : null;
  const cursorPreviewImage = getProjectThumbnailSrc(thumbnail);
  const hasCursorPreview = !!cursorPreviewImage && !disableCursorPreview;
  const externalHref = getSafeExternalHref(external_link?.cached_url);

  const prefetchProject = useCallback(() => {
    if (!href || hasPrefetchedRef.current) return;
    router.prefetch(href);
    hasPrefetchedRef.current = true;
  }, [href, router]);

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    prefetchProject();
    onProjectHover?.(event.currentTarget);
  };

  const handleClick = () => {
    if (!href) return;
    router.push(href);
  };

  // Extract just the year from the date value
  const displayYear = year ? new Date(year).getFullYear() : null;

  return (
    <div
      className={`blok blok-Project cursorInteract ${
        hasCursorPreview ? 'cursorPreview' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onProjectLeave}
      onTouchStart={prefetchProject}
      data-cursor-preview={hasCursorPreview ? cursorPreviewImage : undefined}
      data-cursor-preview-alt={thumbnail?.alt || title || ''}
      data-hide-copy={hideProjectCopy ? true : undefined}
      style={{ cursor: 'pointer', zIndex: isHoverActive ? 9998 : stackIndex }}
    >
      <BlokSidePanels />
      <GrainyGradient variant="blok" />
      <Row>
        <GrainyGradient variant="blok" className="grainyInRow" />
        <div className="column column-Left">
          {displayYear && <div className="column column-Year">{displayYear}</div>}
          {title && <div className="column column-Project">{title}</div>}
        </div>
        <div className="column column-Right">
          {category && (
            <div className="column column-Category">{category.map((c) => c.toLowerCase()).join(', ')}</div>
          )}
          <div className="column column-Icons">
            <a
              className="icon icon-ExternalLink cursorMagnetic"
              href={externalHref || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              data-active={externalHref ? true : false}
            >
              <IconLinkOutside />
            </a>
            <div className="icon cursorMagnetic">
              <IconArrow />
            </div>
          </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokProject;

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';
import type { MouseEvent } from 'react';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';
import IconLinkOutside from './Icons/IconLinkOutside';
import GrainyGradient from '@/components/GrainyGradient';
import BlokSidePanels from '@/components/BlokSidePanels';
import { getSafeExternalHref } from '@/lib/safe-url';

interface Props {
  slug?: string;
  year?: string;
  title?: string;
  category?: string[];
  external_link?: { cached_url: string };
  stackIndex?: number;
  hideProjectCopy?: boolean;
  onProjectHover?: (element: HTMLDivElement) => void;
  onProjectLeave?: () => void;
}

const BlokProject = ({
  slug,
  year,
  title,
  category,
  external_link,
  stackIndex,
  hideProjectCopy,
  onProjectHover,
  onProjectLeave,
}: Props) => {
  const router = useRouter();
  const hasPrefetchedRef = useRef(false);
  const href = slug ? `/projects/${slug}` : null;
  const externalHref = getSafeExternalHref(external_link?.cached_url);
  const projectLabel = title || 'project';

  const prefetchProject = useCallback(() => {
    if (!href || hasPrefetchedRef.current) return;
    router.prefetch(href);
    hasPrefetchedRef.current = true;
  }, [href, router]);

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    prefetchProject();
    onProjectHover?.(event.currentTarget);
  };

  // Extract just the year from the date value
  const displayYear = year ? new Date(year).getFullYear() : null;

  return (
    <div
      className="blok blok-Project"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onProjectLeave}
      onTouchStart={prefetchProject}
      data-hide-copy={hideProjectCopy ? true : undefined}
      data-stack-item={stackIndex !== undefined ? true : undefined}
      style={{ zIndex: stackIndex }}
    >
      <GrainyGradient variant="blok" />
      {stackIndex !== undefined && <BlokSidePanels />}
      {href && (
        <Link
          href={href}
          className="projectCardLink cursorInteract"
          aria-label={`View ${projectLabel}`}
          onFocus={prefetchProject}
        />
      )}
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

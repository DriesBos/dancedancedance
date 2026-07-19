'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';
import type { MouseEvent } from 'react';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';
import IconLinkOutside from './Icons/IconLinkOutside';
import GrainyGradient from '@/components/GrainyGradient';
import { getSafeExternalHref } from '@/lib/safe-url';

interface Props {
  slug?: string;
  year?: string;
  title?: string;
  category?: string[];
  external_link?: { cached_url: string };
  stackIndex?: number;
  isHoverActive?: boolean;
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
  isHoverActive,
  hideProjectCopy,
  onProjectHover,
  onProjectLeave,
}: Props) => {
  const router = useRouter();
  const hasPrefetchedRef = useRef(false);
  const href = slug ? `/projects/${slug}` : null;
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

  // Extract just the year from the date value
  const displayYear = year ? new Date(year).getFullYear() : null;

  return (
    <div
      className="blok blok-Project"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onProjectLeave}
      onTouchStart={prefetchProject}
      data-hide-copy={hideProjectCopy ? true : undefined}
      style={{ zIndex: isHoverActive ? 9998 : stackIndex }}
    >
      <GrainyGradient variant="blok" />
      <Row>
        <GrainyGradient variant="blok" className="grainyInRow" />
        <div className="column column-Left">
          {displayYear && <div className="column column-Year">{displayYear}</div>}
          {title && (
            <div className="column column-Project">
              {href ? (
                <Link href={href} className="cursorInteract">
                  {title}
                </Link>
              ) : (
                title
              )}
            </div>
          )}
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
                aria-label={`Visit ${title || 'project'} website`}
                data-active="true"
              >
                <IconLinkOutside />
              </a>
            )}
            {href ? (
              <Link
                href={href}
                className="icon cursorMagnetic"
                aria-label={`View ${title || 'project'}`}
              >
                <IconArrow />
              </Link>
            ) : (
              <div className="icon">
                <IconArrow />
              </div>
            )}
          </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokProject;

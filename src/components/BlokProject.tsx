'use client';

import { useRouter } from 'next/navigation';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';
import IconLinkOutside from './Icons/IconLinkOutside';
import BlokSidePanels from './BlokSidePanels';

interface Props {
  slug?: String;
  year?: string;
  title?: string;
  category?: string[];
  external_link?: { cached_url: string };
  thumbnail?: { filename: string; alt?: string };
  stackIndex?: number;
}

const BlokProject = ({
  slug,
  year,
  title,
  category,
  external_link,
  thumbnail,
  stackIndex,
}: Props) => {
  const router = useRouter();
  const cursorPreviewImage = (() => {
    const base = thumbnail?.filename;
    if (!base) return undefined;

    const shouldTransform =
      base.includes('a.storyblok.com') || base.includes('img2.storyblok.com');
    if (!shouldTransform || base.includes('/m/')) return base;

    const [path, query] = base.split('?');
    const transformed = `${path}/m/640x480/smart/filters:format(webp):quality(70)`;

    return query ? `${transformed}?${query}` : transformed;
  })();

  const handleClick = () => {
    router.push(`/projects/${slug}`);
  };

  // Extract just the year from the date value
  const displayYear = year ? new Date(year).getFullYear() : null;

  return (
    <div
      className={`blok blok-Project blok-Animate cursorInteract ${
        cursorPreviewImage ? 'cursorPreview' : ''
      }`}
      onClick={handleClick}
      data-cursor-preview={cursorPreviewImage || undefined}
      data-cursor-preview-alt={thumbnail?.alt || title || ''}
      style={{ cursor: 'pointer', zIndex: stackIndex }}
    >
      <BlokSidePanels />
      <Row>
        {displayYear && <div className="column column-Year">{displayYear}</div>}
        {title && <div className="column column-Project">{title}</div>}
        {category && (
          <div className="column column-Category">{category.join(', ')}</div>
        )}
        <div className="column column-Icons">
          <a
            className="icon icon-ExternalLink cursorMagnetic"
            href={external_link?.cached_url ? external_link.cached_url : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            data-active={external_link?.cached_url ? true : false}
          >
            <IconLinkOutside />
          </a>
          <div className="icon cursorMagnetic">
            <IconArrow />
          </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokProject;

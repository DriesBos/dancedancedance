'use client';

import { useRouter } from 'next/navigation';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';
import IconLinkOutside from './Icons/IconLinkOutside';

interface Props {
  slug?: String;
  year?: string;
  title?: string;
  category?: string[];
  external_link?: { cached_url: string };
}

const BlokProject = ({ slug, year, title, category, external_link }: Props) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/projects/${slug}`);
  };

  console.log('BlokProject props:', {
    title,
    external_link,
  });
  return (
    <div
      className={`blok blok-Project blok-Animate}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <Row>
        {year && <div className="column column-Year">{year}</div>}
        {title && <div className="column column-Project">{title}</div>}
        {category && (
          <div className="column column-Category">{category.join(', ')}</div>
        )}
        <div className="column column-Icons">
          <a
            className="icon external-link"
            href={external_link?.cached_url ? external_link.cached_url : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            data-active={external_link?.cached_url ? true : false}
          >
            <IconLinkOutside />
          </a>
          <div className="icon">
            <IconArrow />
          </div>
        </div>
      </Row>
    </div>
  );
};

export default BlokProject;

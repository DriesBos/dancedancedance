import Link from 'next/link';
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
  console.log('BlokProject props:', {
    title,
    external_link,
  });
  return (
    <Link
      className={`blok blok-Project blok-Animate}`}
      href={`/projects/${slug}`}
    >
      <Row>
        {year && <div className="column column-Year">{year}</div>}
        {title && <div className="column column-Project">{title}</div>}
        {category && (
          <div className="column column-Category">{category.join(', ')}</div>
        )}
        <div className="column column-Icons">
          {external_link && (
            <a
              className="icon external-link"
              href={external_link.cached_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IconLinkOutside />
            </a>
          )}
          <div className="icon">
            <IconArrow />
          </div>
        </div>
      </Row>
    </Link>
  );
};

export default BlokProject;

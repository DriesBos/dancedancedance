import Link from 'next/link';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';

interface Props {
  key?: string | number;
  slug?: String;
  year?: string;
  title?: string;
  category?: string[];
}

const BlokProject = ({ slug, year, title, category, key }: Props) => {
  return (
    <Link
      className={`blok blok-Project blok-Animate}`}
      href={`/projects/${slug}`}
      key={key}
    >
      <Row>
        {year && <div className="column column-Year">{year}</div>}
        {title && <div className="column column-Project">{title}</div>}
        {category && (
          <div className="column column-Category">{category.join(', ')}</div>
        )}
        <div className="column column-Icons">
          <div className="icon">
            <IconArrow />
          </div>
        </div>
      </Row>
    </Link>
  );
};

export default BlokProject;

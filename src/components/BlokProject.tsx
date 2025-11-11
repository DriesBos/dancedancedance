import Link from 'next/link';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';

interface Props {
  slug?: String;
  year?: String;
  title?: String;
  category?: String;
  role?: String;
  location?: String;
  active?: Boolean;
  images?: Array<{
    filename: string;
    alt: string;
  }>;
}

const BlokProject = ({
  slug,
  year,
  title,
  category,
  role,
  location,
  active,
  images,
}: Props) => {
  return (
    <Link
      className={`blok blok-Project blok-Animate ${active ? '' : 'inActive'}`}
      href={`/projects/${slug}`}
    >
      <Row>
        <div className="column column-Year">{year}</div>
        <div className="column column-Project">{title}</div>
        <div className="column column-Category">{category}</div>
        <div className="column column-Role">{role}</div>
        <div className="column column-Location">{location}</div>
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

import Link from 'next/link';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';

interface Props {
  slug?: String;
  year?: String;
  title?: String;
  category?: String;
  agency?: String;
}

const BlokProject = ({ slug, year, title, category, agency }: Props) => {
  return (
    <Link
      className={`blok blok-Project blok-Animate}`}
      href={`/projects/${slug}`}
    >
      <Row>
        <div className="column column-Year">{year}</div>
        <div className="column column-Project">{title}</div>
        <div className="column column-Category">{category}</div>
        <div className="column column-Agency">{agency}</div>
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

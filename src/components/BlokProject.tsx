import Link from 'next/link';
import IconArrow from '@/components/Icons/IconArrow';

interface Props {
  slug?: String;
  year?: String;
  title?: String;
  active?: Boolean;
  client?: String;
  category?: String;
}

const BlokProject = ({
  slug,
  year,
  title,
  active,
  client,
  category,
}: Props) => {
  return (
    <Link
      className={`blok blok-Project ${active ? '' : 'inActive'}`}
      href={`/projects/${slug}`}
    >
      <div className="column column-Year">{year}</div>
      <div className="column column-Title">{title}</div>
      <div className="column column-Client">{client}</div>
      <div className="column column-Category">{category}</div>
      <div className="column column-Icons">
        <div className="icon">
          <IconArrow />
        </div>
      </div>
    </Link>
  );
};

export default BlokProject;

import Link from 'next/link';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';
import BlokSidePanels from './BlokSides';

interface Props {
  slug?: String;
  year?: String;
  title?: String;
  category?: String;
  role?: String;
  location?: String;
  active?: Boolean;
  images?: any;
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
  const arr = Array.from(images);
  const repeatedArr = Array(10)
    .fill(arr)
    .flatMap((x) => x);

  return (
    <Link
      className={`blok blok-Project blok-Animate ${active ? '' : 'inActive'}`}
      href={`/projects/${slug}`}
    >
      <Row>
        <div className="column column-Year">{year}</div>
        <div className="column column-Title">{title}</div>
        <div className="column column-Category">{category}</div>
        <div className="column column-Client">{role}</div>
        <div className="column column-Client">{location}</div>
        <div className="column column-Icons">
          <div className="icon">
            <IconArrow />
          </div>
        </div>
      </Row>
      {/* <Row>
        <div className="imageContainer">
          {repeatedArr.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
        </div>
      </Row> */}
    </Link>
  );
};

export default BlokProject;

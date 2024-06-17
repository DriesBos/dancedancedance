import Link from 'next/link';
import IconArrow from '@/components/Icons/IconArrow';
import Row from './Row';

interface Props {
  slug?: String;
  year?: String;
  title?: String;
  active?: Boolean;
  client?: String;
  category?: String;
  images?: any;
}

const BlokProject = ({
  slug,
  year,
  title,
  active,
  client,
  category,
  images,
}: Props) => {
  const array = Array.from(images);
  return (
    <Link
      className={`blok blok-Project ${active ? '' : 'inActive'}`}
      href={`/projects/${slug}`}
    >
      <Row>
        <div className="column column-Year">{year}</div>
        <div className="column column-Title">{title}</div>
        <div className="column column-Client">{client}</div>
        <div className="column column-Category">{category}</div>
        <div className="column column-Icons">
          <div className="icon">
            <IconArrow />
          </div>
        </div>
      </Row>
      <Row>
        <div className="imageContainer">
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
          {array.map((item: any, index: number) => (
            <img key={index} src={item.filename} alt={item.alt} />
          ))}
        </div>
      </Row>
    </Link>
  );
};

export default BlokProject;

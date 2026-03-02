import { SbBlokData, storyblokEditable } from '@storyblok/react/rsc';
import Image from 'next/image';
import Link from 'next/link';
import GrainyGradient from '@/components/GrainyGradient';
import BlokSidePanels from '@/components/BlokSidePanels';
import { fetchProjectData } from './projectsData';

interface BlokHighlightsProps {
  blok: SbBlokData;
}

const BlokHighlights = async ({ blok }: BlokHighlightsProps) => {
  const data = await fetchProjectData();
  const highlights = data.filter((item) => item.highlight === true);

  return (
    <div className="blok blok-Highlights" {...storyblokEditable(blok)}>
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      {highlights.map((item) => (
        <Link
          key={item.slug}
          className="blok blok-Highlights-Item blok-Animate"
          href={`/projects/${item.slug}`}
        >
          <div className="blok-Highlights-Item-Image cursorInteract">
            {item.thumbnail?.filename ? (
              <Image
                src={item.thumbnail.filename}
                alt={item.thumbnail.alt || item.title || 'Project Image'}
                width={0}
                height={0}
                sizes="50vw"
                quality={80}
                style={{ width: '100%', height: 'auto' }}
              />
            ) : null}
          </div>
          <div className="blok-Highlights-Item-Caption cursorInteract">
            <div className="blok-Highlights-Item-Title">{item.title}</div>
            <div className="blok-Highlights-Item-Year">
              {item.year ? new Date(item.year).getFullYear() : ''}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default BlokHighlights;

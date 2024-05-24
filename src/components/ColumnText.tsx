import { storyblokEditable } from '@storyblok/react/rsc';
import Markdown from 'marked-react';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface Props {
  blok: any;
}

const ColumnText = ({ blok }: Props) => {
  const container = useRef(null);

  useGSAP(
    () => {
      gsap.to('.column-Text', {
        '--var': '100%',
        duration: 0.66,
        delay: 0.33,
        ease: 'ease',
      });
    }
    // { scope: container }
  );
  return (
    <div
      className="column column-Text"
      ref={container}
      {...storyblokEditable(blok)}
    >
      <Markdown>{blok.text}</Markdown>
    </div>
  );
};

export default ColumnText;

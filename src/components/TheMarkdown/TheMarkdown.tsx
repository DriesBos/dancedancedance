'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import styles from './TheMarkdown.module.sass';

interface MarkdownProps {
  content: string;
  className?: string;
}

const Markdown: React.FunctionComponent<MarkdownProps> = ({
  content,
  className = '',
}) => {
  useGSAP(() => {
    gsap.to('.markdown', {
      '--var': '100%',
      duration: 0.66,
      delay: 0.33,
      ease: 'ease',
    });
  });

  if (!content) {
    return null;
  }

  return (
    <div className={`${className} ${styles.markdown} markdown`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;

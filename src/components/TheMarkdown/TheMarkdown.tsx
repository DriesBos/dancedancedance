'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import styles from './TheMarkdown.module.sass';

interface MarkdownProps {
  content: string;
  className?: string;
}

const Markdown: React.FunctionComponent<MarkdownProps> = ({
  content,
  className = '',
}) => {
  const markdownRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!markdownRef.current) return;

      gsap.to(markdownRef.current, {
        '--var': '100%',
        duration: 0.66,
        delay: 0.33,
        ease: 'ease',
      });
    },
    { scope: markdownRef, dependencies: [content], revertOnUpdate: true }
  );

  if (!content) {
    return null;
  }

  return (
    <div ref={markdownRef} className={`${className} ${styles.markdown} markdown`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;

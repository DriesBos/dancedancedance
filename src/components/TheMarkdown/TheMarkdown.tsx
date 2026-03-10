'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { renderWordSwapChildren } from '@/components/InlineWordSwapText';
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
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          p: ({ node: _node, children, ...props }) => (
            <p {...props}>{renderWordSwapChildren(children, 'md-p')}</p>
          ),
          li: ({ node: _node, children, ...props }) => (
            <li {...props}>{renderWordSwapChildren(children, 'md-li')}</li>
          ),
          blockquote: ({ node: _node, children, ...props }) => (
            <blockquote {...props}>
              {renderWordSwapChildren(children, 'md-quote')}
            </blockquote>
          ),
          h1: ({ node: _node, children, ...props }) => (
            <h1 {...props}>{renderWordSwapChildren(children, 'md-h1')}</h1>
          ),
          h2: ({ node: _node, children, ...props }) => (
            <h2 {...props}>{renderWordSwapChildren(children, 'md-h2')}</h2>
          ),
          h3: ({ node: _node, children, ...props }) => (
            <h3 {...props}>{renderWordSwapChildren(children, 'md-h3')}</h3>
          ),
          h4: ({ node: _node, children, ...props }) => (
            <h4 {...props}>{renderWordSwapChildren(children, 'md-h4')}</h4>
          ),
          h5: ({ node: _node, children, ...props }) => (
            <h5 {...props}>{renderWordSwapChildren(children, 'md-h5')}</h5>
          ),
          h6: ({ node: _node, children, ...props }) => (
            <h6 {...props}>{renderWordSwapChildren(children, 'md-h6')}</h6>
          ),
          strong: ({ node: _node, children, ...props }) => (
            <strong {...props}>{renderWordSwapChildren(children, 'md-strong')}</strong>
          ),
          em: ({ node: _node, children, ...props }) => (
            <em {...props}>{renderWordSwapChildren(children, 'md-em')}</em>
          ),
          del: ({ node: _node, children, ...props }) => (
            <del {...props}>{renderWordSwapChildren(children, 'md-del')}</del>
          ),
          a: ({ node: _node, href, className, children, ...props }) => {
            const isMailto =
              typeof href === 'string' && href.toLowerCase().startsWith('mailto:');
            const linkClassName = [className, isMailto ? 'cursorMessage' : null]
              .filter(Boolean)
              .join(' ');

            return (
              <a
                href={href}
                className={linkClassName || undefined}
                data-cursor-message={isMailto ? "Let's talk" : undefined}
                {...props}
              >
                {renderWordSwapChildren(children, 'md-link')}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;

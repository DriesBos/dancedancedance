import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';
import styles from './TheMarkdown.module.sass';

interface MarkdownProps {
  content: string;
  className?: string;
}

const Markdown: React.FunctionComponent<MarkdownProps> = ({
  content,
  className = '',
}) => {
  if (!content) {
    return null;
  }

  return (
    <div className={`${styles.markdown} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom heading components
          h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
          h4: ({ children }) => <h4 className={styles.h4}>{children}</h4>,
          h5: ({ children }) => <h5 className={styles.h5}>{children}</h5>,
          h6: ({ children }) => <h6 className={styles.h6}>{children}</h6>,

          // Custom paragraph component
          p: ({ children }) => <p className={styles.paragraph}>{children}</p>,

          // Custom list components
          ul: ({ children }) => (
            <ul className={styles.unorderedList}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className={styles.orderedList}>{children}</ol>
          ),
          li: ({ children }) => <li className={styles.listItem}>{children}</li>,

          // Custom link component
          a: ({ href, children }) => (
            <a
              href={href}
              className={styles.link}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),

          // Custom code components
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className={styles.inlineCode}>{children}</code>
            ) : (
              <code className={`${styles.codeBlock} ${className || ''}`}>
                {children}
              </code>
            );
          },

          // Custom pre component for code blocks
          pre: ({ children }) => (
            <pre className={styles.preBlock}>{children}</pre>
          ),

          // Custom blockquote component
          blockquote: ({ children }) => (
            <blockquote className={styles.blockquote}>{children}</blockquote>
          ),

          // Custom table components
          table: ({ children }) => (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={styles.tableHead}>{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className={styles.tableBody}>{children}</tbody>
          ),
          tr: ({ children }) => <tr className={styles.tableRow}>{children}</tr>,
          th: ({ children }) => (
            <th className={styles.tableHeader}>{children}</th>
          ),
          td: ({ children }) => (
            <td className={styles.tableCell}>{children}</td>
          ),

          // Custom horizontal rule
          hr: () => <hr className={styles.horizontalRule} />,

          // Custom image component
          img: ({ src, alt }) => {
            const imageSrc = typeof src === 'string' ? src : '';
            return imageSrc ? (
              <Image
                src={imageSrc}
                alt={alt || ''}
                className={styles.image}
                width={800}
                height={400}
                style={{ width: 'auto', height: 'auto' }}
              />
            ) : null;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;

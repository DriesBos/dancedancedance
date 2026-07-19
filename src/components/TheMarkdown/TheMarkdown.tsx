import { createElement, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { renderWordSwapChildren } from '@/components/InlineWordSwapText/renderWordSwap';
import styles from './TheMarkdown.module.sass';

interface MarkdownProps {
  content: string;
  className?: string;
}

type WordSwapComponentKey =
  | 'p'
  | 'li'
  | 'blockquote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'strong'
  | 'em'
  | 'del';

type MarkdownComponentProps = {
  node?: unknown;
  children?: ReactNode;
  [key: string]: unknown;
};

const wordSwapComponentEntries = [
  ['p', 'md-p'],
  ['li', 'md-li'],
  ['blockquote', 'md-quote'],
  ['h1', 'md-h1'],
  ['h2', 'md-h2'],
  ['h3', 'md-h3'],
  ['h4', 'md-h4'],
  ['h5', 'md-h5'],
  ['h6', 'md-h6'],
  ['strong', 'md-strong'],
  ['em', 'md-em'],
  ['del', 'md-del'],
] as const satisfies ReadonlyArray<readonly [WordSwapComponentKey, string]>;

const createWordSwapComponent = (
  tagName: WordSwapComponentKey,
  keyPrefix: string,
) => {
  const WordSwapComponent = ({
    node: _node,
    children,
    ...props
  }: MarkdownComponentProps) =>
    createElement(tagName, props, renderWordSwapChildren(children, keyPrefix));

  WordSwapComponent.displayName = `MarkdownWordSwap(${tagName})`;

  return WordSwapComponent;
};

const wordSwapComponents = Object.fromEntries(
  wordSwapComponentEntries.map(([tagName, keyPrefix]) => [
    tagName,
    createWordSwapComponent(tagName, keyPrefix),
  ]),
) as Components;

const Markdown = ({ content, className = '' }: MarkdownProps) => {
  if (!content) {
    return null;
  }

  const components: Components = {
    ...wordSwapComponents,
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
  };

  return (
    <div className={`${className} ${styles.markdown} markdown`}>
      <ReactMarkdown skipHtml components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

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
    <div className={`${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;

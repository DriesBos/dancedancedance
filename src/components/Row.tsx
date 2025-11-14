interface Props {
  children?: any;
  wideColumns?: boolean;
  className?: string;
}

const Row = ({ children, wideColumns, className }: Props) => (
  <div className={`row ${className || ''}`} data-wide-columns={wideColumns}>
    {children}
  </div>
);

export default Row;

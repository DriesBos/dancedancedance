interface Props {
  children?: any;
  wideColumns?: boolean;
}

const Row = ({ children, wideColumns }: Props) => (
  <div className="row" data-wide-columns={wideColumns}>
    {children}
  </div>
);

export default Row;

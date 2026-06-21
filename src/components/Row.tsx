import type { ReactNode } from 'react';

type ColumnBehaviour = 'none' | 'hide-first' | 'stack';

interface Props {
  children?: ReactNode;
  columnBehaviour?: ColumnBehaviour;
  className?: string;
}

const Row = ({ children, columnBehaviour, className }: Props) => (
  <div
    className={`row ${className || ''}`}
    data-column-behaviour={columnBehaviour || 'none'}
  >
    {children}
  </div>
);

export default Row;

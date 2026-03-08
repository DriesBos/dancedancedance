'use client';

import Row from './Row';
import BlokSidePanels from './BlokSidePanels';
import GrainyGradient from '@/components/GrainyGradient';
import SearchInput from './SearchInput';
import IconArrow from './Icons/IconArrow';

export type ProjectSortField = 'year' | 'title' | 'category';
export type ProjectSortDirection = 'asc' | 'desc';

interface BlokFilterProps {
  sortField: ProjectSortField;
  sortDirection: ProjectSortDirection;
  onSortChange: (field: ProjectSortField) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function BlokFilter({
  sortField,
  sortDirection,
  onSortChange,
  searchValue,
  onSearchChange,
}: BlokFilterProps) {
  const isSortActive = (field: ProjectSortField) => sortField === field;
  const sortIndicator = (field: ProjectSortField) =>
    isSortActive(field) ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="blok blok-Filter blok-Animate">
      <GrainyGradient variant="blok" />
      <BlokSidePanels />
      <Row>
        <button
          type="button"
          className="column column-Year cursorInteract desktop"
          data-active={isSortActive('year')}
          data-inactive={!isSortActive('year')}
          onClick={() => onSortChange('year')}
        >
          Year
        </button>
        <button
          type="button"
          className="column column-Project cursorInteract"
          data-active={isSortActive('title')}
          data-inactive={!isSortActive('title')}
          onClick={() => onSortChange('title')}
        >
          Selected work
        </button>
        <button
          type="button"
          className="column column-Category cursorInteract"
          data-active={isSortActive('category')}
          data-inactive={!isSortActive('category')}
          onClick={() => onSortChange('category')}
        >
          Category
        </button>
        <div className="column column-Icons">
          <div className="icon">
            <IconArrow />
          </div>
          <SearchInput value={searchValue} onChange={onSearchChange} />
        </div>
      </Row>
    </div>
  );
}

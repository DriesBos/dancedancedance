'use client';

import IconSearch from '@/components/Icons/IconSearch';
import { usePathname } from 'next/navigation';
import Row from './Row';
import BlokSidePanels from './BlokSides';

export default function BlokFilter() {
  const path = usePathname();
  return (
    <>
      {path === '/' && (
        <div className="blok blok-Filter blok-Animate">
          <BlokSidePanels />
          <Row>
            <div className="column column-Year" data-inactive={true}>
              Date
            </div>
            <div className="column column-Project" data-inactive={true}>
              Selected Projects
            </div>
            <div className="column column-Category" data-inactive={true}>
              Category
            </div>
            <div className="column column-Agency" data-inactive={true}>
              Agency
            </div>
            <div className="column column-Icons" data-inactive={true}>
              <div className="icon">
                <IconSearch />
              </div>
            </div>
          </Row>
        </div>
      )}
    </>
  );
}

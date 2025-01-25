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
            <div className="column column-Title" data-inactive={true}>
              Selected Projects
            </div>
            <div className="column column-Category" data-inactive={true}>
              Type
            </div>
            <div className="column column-Client" data-inactive={true}>
              Role
            </div>
            <div className="column" data-inactive={true}>
              Location
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

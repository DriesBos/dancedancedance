'use client';

import IconAbout from '@/components/Icons/IconAbout';
import { usePathname } from 'next/navigation';
import Row from './Row';
import BlokSidePanels from './BlokSides';

export default function BlokFilter() {
  const path = usePathname();
  return (
    <>
      {path === '/' && (
        <div className="blok blok-Filter">
          <BlokSidePanels />
          <Row>
            <div className="column column-Year" data-inactive={true}>
              Date
            </div>
            <div className="column column-Title" data-inactive={true}>
              Project
            </div>
            <div className="column column-Client" data-inactive={true}>
              Role
            </div>
            <div className="column column-Category" data-inactive={true}>
              Client type
            </div>
            {/* <div className="column" data-inactive={true}>
              Project Type
            </div>
            <div className="column" data-inactive={true}>
              Tech
            </div> */}
            <div className="column column-Icons" data-inactive={true}>
              <div className="icon">
                <IconAbout />
              </div>
            </div>
          </Row>
        </div>
      )}
    </>
  );
}

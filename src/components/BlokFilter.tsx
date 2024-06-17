'use client';

import IconAbout from '@/components/Icons/IconAbout';
import { usePathname } from 'next/navigation';
import Row from './Row';

export default function BlokFilter() {
  const path = usePathname();
  return (
    <div className={`blok blok-Filter ${path === '/' ? 'active' : 'inactive'}`}>
      <Row>
        <div className="column" data-inactive={true}>
          Date
        </div>
        <div className="column" data-inactive={true}>
          Project
        </div>
        <div className="column" data-inactive={true}>
          Role
        </div>
        <div className="column" data-inactive={true}>
          Client type
        </div>
        <div className="column" data-inactive={true}>
          Project Type
        </div>
        <div className="column" data-inactive={true}>
          Tech
        </div>
        <div className="column column-Icons" data-inactive={true}>
          <div className="icon">
            <IconAbout />
          </div>
        </div>
      </Row>
    </div>
  );
}

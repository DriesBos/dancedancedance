import IconAbout from '@/components/Icons/IconAbout';

interface Props {}

const BlokFilter = () => (
  <div className="blok blok-Filter">
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
  </div>
);

export default BlokFilter;

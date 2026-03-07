interface Props {
  className?: string;
}

const IconLocation = ({ className }: Props) => {
  return (
    <div className={`IconLocation${className ? ` ${className}` : ''}`}>
      <div className="IconLocation-Overlay" />
      <div className="IconLocation-Globe">
        <div className="IconLocation-GlobeWrap">
          <div className="IconLocation-Circle" />
          <div className="IconLocation-Circle" />
          <div className="IconLocation-Circle" />
          <div className="IconLocation-CircleHor" />
          <div className="IconLocation-CircleHorMiddle" />
        </div>
      </div>
    </div>
  );
};

export default IconLocation;

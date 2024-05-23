interface Props {
  blok?: any;
  float?: boolean;
}

const BlokHead = ({ blok, float }: Props) => (
  <div className={`blok blok-Head ${float ? 'float' : ''}`}>
    <p>BLOK HEAD</p>
  </div>
);

export default BlokHead;

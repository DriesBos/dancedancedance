import Image from 'next/image';
import backgroundImage from '../assets/images/rosanne.jpg';

export default function PaThemeBackgroundge() {
  return (
    <div className="themeBackground">
      <Image className="themeBackground-Image" src={backgroundImage} alt="" />
      <div className="themeBackground-Color"></div>
    </div>
  );
}

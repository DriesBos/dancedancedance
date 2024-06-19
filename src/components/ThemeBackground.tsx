import Image from 'next/image';
import backgroundImage from '../assets/images/rosanne.jpg';

export default function PaThemeBackgroundge() {
  return (
    <div className="themeBackground">
      <Image
        src={backgroundImage}
        alt=""
        // width={500} automatically provided
        // height={500} automatically provided
        // blurDataURL="data:..." automatically provided
        // placeholder="blur" // Optional blur-up while loading
      />
    </div>
  );
}

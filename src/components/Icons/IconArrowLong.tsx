interface Props {
  className?: string;
}

const IconArrowLong = ({ className }: Props) => {
  return (
    <svg viewBox="0 0 50 25" className={className ? className : ''}>
      <path
        d="M25.9820203,-12.5156254 L25.9816593,33.6823746 L35.5731342,24.0804887 L36.9843746,25.4935257 L26.3956593,36.0953746 L26.3969419,36.0968347 L24.9912325,37.5043407 L24.9896593,37.5023746 L24.9888313,37.5043407 L23.5775909,36.0913036 L23.5776593,36.0893746 L12.9956593,25.4935556 L14.4013687,24.0860496 L23.9856593,33.6823746 L23.986225,-12.5156254 L25.9820203,-12.5156254 Z"
        fill="currentColor"
        transform="translate(24.990017, 12.494358) scale(-1, 1) rotate(90.000000) translate(-24.990017, -12.494358)"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default IconArrowLong;

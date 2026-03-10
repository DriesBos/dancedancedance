interface Props {
  className?: string;
}

const IconRightSmall = ({ className }: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 25 12"
      className={className ? className : ''}
    >
      <path
        fill="currentColor"
        d="m23.54 4.535.05.044h.003L25 5.983l-.002.001H25l-.006.005.007.007-.002.002.006.006-5.656 5.656-1.415-1.414 3.054-3.055.19-.203H0V4.991h21.168L17.93 1.755 19.345.34z"
      />
    </svg>
  );
};

export default IconRightSmall;

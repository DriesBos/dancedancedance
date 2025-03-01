interface Props {
  className?: string;
}

const IconArrow = ({ className }: Props) => {
  return (
    <svg viewBox="0 0 25 25" className={className ? className : ''}>
      <path
        d="M13.4920033,-0.00564236857 L13.4916424,21.1723576 L23.0831172,11.5705056 L24.4943576,12.9835427 L13.9056424,23.5853576 L13.9069249,23.5868517 L12.5012156,24.9943576 L12.4996424,24.9923576 L12.4988143,24.9943576 L11.0875739,23.5813206 L11.0876424,23.5793576 L0.505642369,12.9835726 L1.91135168,11.5760666 L11.4956424,21.1723576 L11.496208,-0.00564236857 L13.4920033,-0.00564236857 Z"
        fill="currentColor"
        transform="translate(12.500000, 12.494358) scale(-1, 1) rotate(90.000000) translate(-12.500000, -12.494358)"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default IconArrow;

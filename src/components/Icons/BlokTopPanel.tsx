interface Props {
  className?: any;
}
const BlokTopPanel = ({ className }: Props) => {
  return (
    <div className={`blokTopPanel ${className}`}>
      <svg viewBox="0 0 1400 218">
        <path
          d="M140 0L1260 0 1400 218 0 218z"
          transform="translate(-250.000000, -250.000000) translate(250.000000, 250.000000)"
          fill="none"
          fillRule="evenodd"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
};

export default BlokTopPanel;

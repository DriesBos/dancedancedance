import styles from './IconFullscreen.module.sass';

interface Props {
  active?: boolean;
}

const IconFullscreen = ({ active = true }: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 25 25"
      className={styles.iconFullscreen}
      data-active={active}
    >
      <g fill="currentColor">
        <g className={styles.arrow}>
          <path d="M10.448 9.033l-1.414 1.415L-.707.707.707-.708z" />
          <path d="M8 0v2H2v6H0V0z" />
        </g>
        <g className={styles.arrow}>
          <path d="M25.707.707l-9.754 9.754-1.415-1.415 9.755-9.753z" />
          <path d="M25 0v8h-2V2h-6V0z" />
        </g>
        <g className={styles.arrow}>
          <path d="M10.466 15.948.708 25.707l-1.415-1.414 9.759-9.759z" />
          <path d="M2 23h6v2H0v-8h2z" />
        </g>
        <g className={styles.arrow}>
          <path d="M25.707 24.293l-1.414 1.414-9.771-9.772 1.413-1.414z" />
          <path d="M25 25h-8v-2h6v-6h2z" />
        </g>
      </g>
    </svg>
  );
};

export default IconFullscreen;

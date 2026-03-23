
import styles from './IconArrowLongUp.module.sass';

interface Props {
  className?: string;
}

const IconArrowLongUp = ({ className }: Props) => {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 25 50"
        className={styles.head}
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M11.503 3.822 1.91 13.424.501 12.01 11.088 1.409l-.002-.002L12.494 0l.002.002V0l1.412 1.413v.002L24.489 12.01l-1.406 1.407L13.5 3.822h-1.996Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
};

export default IconArrowLongUp;

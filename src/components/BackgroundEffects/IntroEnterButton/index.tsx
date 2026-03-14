'use client';

import styles from './IntroEnterButton.module.sass';

type IntroEnterButtonProps = {
  onClick: () => void;
  label?: string;
};

export default function IntroEnterButton({
  onClick,
  label = 'Enter',
}: IntroEnterButtonProps) {
  return (
    <div className={styles.layer}>
      <button
        type="button"
        className={`${styles.button} cursorInteract`}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
}

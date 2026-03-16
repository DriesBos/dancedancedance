'use client';

import { vibrate } from '@/lib/vibration';
import styles from './IntroEnterButton.module.sass';

type IntroEnterButtonProps = {
  onClick: () => void;
  label?: string;
};

export default function IntroEnterButton({
  onClick,
  label = 'Enter',
}: IntroEnterButtonProps) {
  const handleClick = () => {
    vibrate();
    onClick();
  };

  return (
    <div className={styles.layer}>
      <button
        type="button"
        className={`${styles.button} cursorInteract`}
        onClick={handleClick}
      >
        {label}
      </button>
    </div>
  );
}

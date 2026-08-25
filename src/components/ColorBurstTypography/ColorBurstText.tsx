import styles from './ColorBurstTypography.module.sass';

interface ColorBurstTextProps {
  children: string;
}

const ColorBurstText = ({ children }: ColorBurstTextProps) => (
  <span aria-label={children}>
    {Array.from(children).map((character, index) =>
      character === ' ' ? (
        ' '
      ) : (
        <span
          className={styles.character}
          data-color-burst-character
          aria-hidden="true"
          key={`${character}-${index}`}
        >
          {character}
        </span>
      ),
    )}
  </span>
);

export default ColorBurstText;

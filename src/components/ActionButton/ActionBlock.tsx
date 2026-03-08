import styles from './ActionBlock.module.sass';

type ActionBlockVariant = 'square' | 'round' | 'triangle';

interface ActionBlockProps {
  className?: string;
  variant?: ActionBlockVariant;
}

const ActionBlock = ({ className = '', variant = 'square' }: ActionBlockProps) => {
  const variantClassName =
    variant === 'round'
      ? styles.round
      : variant === 'triangle'
        ? styles.triangle
        : styles.square;

  return (
    <div
      className={`${styles.actionBlock} ${variantClassName} ${className}`.trim()}
      aria-hidden="true"
    />
  );
};

export default ActionBlock;

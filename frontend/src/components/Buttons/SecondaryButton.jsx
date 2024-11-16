import styles from './Buttons.module.css';

export default function SecondaryButton({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  className = ''
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.secondaryButton} ${className}`}
    >
      {children}
    </button>
  );
}
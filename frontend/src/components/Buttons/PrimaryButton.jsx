import styles from './Buttons.module.css';

export default function PrimaryButton({ 
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
      className={`${styles.primaryButton} ${className}`}
    >
      {children}
    </button>
  );
}
import styles from './FormFields.module.css';

export default function Icon({ children, onClick, className = '' }) {
  return (
    <div 
      className={`${styles.icon} ${className}`} 
      onClick={onClick}
    >
      {children}
    </div>
  );
}
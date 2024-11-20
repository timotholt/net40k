import { useState } from 'react';
import Icon from './Icon';
import styles from './FormFields.module.css';

export default function InputField({
  type = 'text',
  label,
  name,
  value,
  onChange,
  onBlur,
  leftIcon,
  rightIcon,
  placeholder = '',
  required = false,
  className = '',
}) {
  const [touched, setTouched] = useState(false);

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  return (
    <div className={styles.fieldContainer}>
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {leftIcon && (
          <Icon className={styles.leftIcon}>
            {leftIcon}
          </Icon>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={required ? `${placeholder || label} (required)` : placeholder || label}
          required={required}
          className={`${styles.input} ${className}`}
        />
        {rightIcon && (
          <Icon className={styles.rightIcon}>
            {rightIcon}
          </Icon>
        )}
      </div>
    </div>
  );
}
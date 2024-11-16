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
  error = '',
  className = '',
  validate,
}) {
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleBlur = (e) => {
    setTouched(true);
    if (validate) {
      const validationError = validate(value);
      setLocalError(validationError || '');
    }
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    if (onChange) onChange(e);
    if (touched && validate) {
      const validationError = validate(e.target.value);
      setLocalError(validationError || '');
    }
  };

  const displayError = touched && (error || localError);

  return (
    <div className={styles.fieldContainer}>
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}
      <div className={`${styles.inputWrapper} ${displayError ? styles.error : ''}`}>
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
          aria-invalid={!!displayError}
          aria-describedby={displayError ? `${name}-error` : undefined}
        />
        {rightIcon && (
          <Icon className={styles.rightIcon}>
            {rightIcon}
          </Icon>
        )}
        {displayError && (
          <div className={styles.tooltip}>
            {error || localError}
          </div>
        )}
      </div>
      {displayError && (
        <div 
          id={`${name}-error`}
          className={`${styles.errorMessage} ${displayError ? styles.visible : ''}`}
          role="alert"
        >
          <span className={styles.errorIcon}>⚠</span>
          {error || localError}
        </div>
      )}
    </div>
  );
}
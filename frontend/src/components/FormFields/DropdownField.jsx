import { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from './Icon';
import styles from './FormFields.module.css';

export default function DropdownField({
  label,
  name,
  value,
  onChange,
  onBlur,
  leftIcon,
  options = [],
  placeholder = 'Select an option',
  required = false,
  className = '',
  disabled = false,
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
        <select
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={required ? `${placeholder} (required)` : placeholder}
          required={required}
          disabled={disabled}
          className={`${styles.input} ${styles.dropdown} ${className}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option, index) => (
            <option 
              key={index} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <Icon className={styles.dropdownIcon}>
          ▼
        </Icon>
      </div>
    </div>
  );
}

// PropTypes for type checking
DropdownField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  leftIcon: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool
    })
  ),
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

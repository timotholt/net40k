import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './FormFields.module.css';
import ChapterIcon from './ChapterIcon';

const CustomSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Select an option',
  required = false,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const selectRef = useRef(null);
  const optionsRef = useRef([]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
      case ' ':
        if (selectedIndex >= 0 && selectedIndex < options.length) {
          handleSelect(options[selectedIndex]);
        }
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  const handleSelect = (option) => {
    if (option.disabled) return;
    
    const event = {
      target: {
        name,
        value: option.value
      }
    };
    
    onChange(event);
    setIsOpen(false);
    if (onBlur) onBlur(event);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`${styles.fieldContainer} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div 
        ref={selectRef}
        className={`${styles.inputWrapper} ${isOpen ? styles.dropdownOpen : ''}`}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${name}-label`}
      >
        <div 
          className={`${styles.customSelect} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className={styles.selectedValue}>
            {selectedOption?.icon && (
              <div className={styles.selectedIcon}>
                {selectedOption.icon.type === 'chapter' ? (
                  <ChapterIcon 
                    chapter={selectedOption.icon.value} 
                    size={selectedOption.icon.size || 'sm'}
                    style={selectedOption.icon.style}
                    alt=""
                  />
                ) : selectedOption.icon}
              </div>
            )}
            <span>{displayValue}</span>
          </div>
          <div className={styles.dropdownArrow}>
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {isOpen && (
          <div 
            className={styles.dropdownMenu}
            role="listbox"
            aria-labelledby={`${name}-label`}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                ref={el => optionsRef.current[index] = el}
                className={`${styles.dropdownItem} ${
                  option.value === value ? styles.selected : ''
                } ${option.disabled ? styles.disabled : ''}`}
                onClick={() => !option.disabled && handleSelect(option)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
              >
                {option.icon && (
                  <div className={styles.optionIcon}>
                    {option.icon.type === 'chapter' ? (
                      <ChapterIcon 
                        chapter={option.icon.value} 
                        size={option.icon.size || 'sm'}
                        style={option.icon.style}
                        alt=""
                      />
                    ) : option.icon}
                  </div>
                )}
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

CustomSelect.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.shape({
          type: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
          size: PropTypes.string,
          style: PropTypes.object
        })
      ]),
      disabled: PropTypes.bool
    })
  ),
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

export default CustomSelect;

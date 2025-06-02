import React from 'react';
import PropTypes from 'prop-types';
import CustomSelect from './CustomSelect';
import ChapterIcon from './ChapterIcon';

/**
 * A dropdown field that supports icons for each option
 * @param {Object} props - Component props
 * @param {string} [props.label] - Label for the dropdown
 * @param {string} props.name - Name attribute for the select element
 * @param {string} props.value - Current value of the dropdown
 * @param {Function} props.onChange - Change event handler
 * @param {Function} [props.onBlur] - Blur event handler
 * @param {Array} props.options - Array of option objects with value, label, and icon
 * @param {string} [props.placeholder] - Placeholder text when no option is selected
 * @param {boolean} [props.required] - Whether the field is required
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.disabled] - Whether the dropdown is disabled
 * @returns {JSX.Element} IconDropdownField component
 */
const IconDropdownField = ({
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
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) onBlur(e);
  };

  // Process options to ensure they have the right format for CustomSelect
  const processedOptions = options.map(option => ({
    ...option,
    // Ensure icon is properly formatted
    icon: option.icon || null
  }));

  return (
    <CustomSelect
      label={label}
      name={name}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      options={processedOptions}
      placeholder={placeholder}
      required={required}
      className={className}
      disabled={disabled}
    />
  );
};

IconDropdownField.propTypes = {
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
          type: PropTypes.string,
          value: PropTypes.string,
          size: PropTypes.string,
          style: PropTypes.object
        })
      ]),
      disabled: PropTypes.bool
    })
  ).isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

export default IconDropdownField;

import React from 'react';
import InputField from './InputField';
import Tooltip from '../Tooltip/Tooltip';

export default function SharedPasswordField({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  required = false,
  mode = 'copy' // 'copy' or 'paste'
}) {
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(value);
  };

  const handlePastePassword = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange({ target: { name, value: text } });
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const leftIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  const rightIcon = mode === 'copy' ? (
    <Tooltip text="Copy game password">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        onClick={handleCopyPassword}
        style={{ cursor: 'pointer', transform: 'translateY(0.2rem)' }}
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </Tooltip>
  ) : (
    <Tooltip text="Paste game password">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        onClick={handlePastePassword}
        style={{ cursor: 'pointer', transform: 'translateY(0.2rem)' }}
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
    </Tooltip>
  );

  return (
    <InputField
      type="text"
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      placeholder={placeholder}
      required={required}
    />
  );
}
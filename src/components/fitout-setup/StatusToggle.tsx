import React from 'react';

interface StatusToggleProps {
  checked: boolean;
  onChange: () => void;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
      checked ? 'bg-[#C72030]' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-7' : 'translate-x-1'
      }`}
    />
  </button>
);

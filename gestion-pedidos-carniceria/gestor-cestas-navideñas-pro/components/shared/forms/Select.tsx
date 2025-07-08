import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string; // Added this line
}

const Select: React.FC<SelectProps> = ({ label, id, error, containerClassName, className, options, ...props }) => {
  return (
    <div className={`mb-4 ${containerClassName || ''}`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
      <select
        id={id}
        className={`mt-1 block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-neutral-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-DEFAULT focus:border-primary-DEFAULT sm:text-sm ${className || ''}`}
        {...props}
      >
        {props.placeholder && <option value="">{props.placeholder}</option>}
        {options.map((option, idx) => (
          <option key={String(option.value) + '-' + idx} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  rightAdornment?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, id, error, containerClassName, className, rightAdornment, ...props }) => {
  return (
    <div className={`mb-4 ${containerClassName || ''} w-full`}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
      <div className="relative">
        <input
          id={id}
          className={`mt-1 block w-full px-3 py-2 bg-white border ${error ? 'border-red-500' : 'border-neutral-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-DEFAULT focus:border-primary-DEFAULT sm:text-sm ${className || ''} ${rightAdornment ? 'pr-10' : ''}`}
          {...props}
        />
        {rightAdornment && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightAdornment}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;

import React from 'react';
import { InputFieldProps } from '../types';

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  unit,
  placeholder,
  icon,
  onChange,
}) => {
  return (
    <div className="flex flex-col space-y-2 group">
      <label htmlFor={id} className="text-sm font-bold text-gray-800 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
        {icon && <span className="text-indigo-500 group-focus-within:text-indigo-600 transition-colors">{icon}</span>}
        {label}
      </label>
      <div className="relative rounded-xl shadow-sm">
        <input
          type="number"
          name={id}
          id={id}
          className="block w-full rounded-xl border-0 py-4 pl-4 pr-12 text-gray-900 bg-gray-50 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:bg-white sm:text-base sm:leading-6 transition-all duration-200 ease-in-out font-semibold"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <span className="text-gray-500 font-semibold sm:text-sm">{unit}</span>
        </div>
      </div>
    </div>
  );
};
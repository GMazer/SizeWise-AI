
import React from 'react';
import { InputFieldProps } from '../types';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  unit,
  placeholder,
  icon,
  onChange,
  nextField,
  onPaste,
}) => {
  
  const handleIncrement = () => {
    const currentVal = parseFloat(value) || 0;
    onChange(id, (currentVal + 1).toString());
  };

  const handleDecrement = () => {
    const currentVal = parseFloat(value) || 0;
    if (currentVal > 0) {
      onChange(id, (currentVal - 1).toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextField) {
        const nextElement = document.getElementById(nextField);
        if (nextElement) {
          nextElement.focus();
        }
      } else {
        // If no next field, blur the current one to hide keyboard on mobile
        // or just let default behavior happen
        e.currentTarget.blur();
      }
    }
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      {/* Label Section */}
      <label htmlFor={id} className="h-6 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 select-none cursor-pointer transition-colors">
         {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
         <span className="truncate">{label}</span>
      </label>
      
      {/* Input Group - Input Left | Unit | Buttons Stack Right */}
      <div className="flex items-center w-full rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-600 dark:focus-within:ring-indigo-500 transition-all overflow-hidden h-12 relative group">
        
        {/* Input chính - Chiếm phần lớn diện tích */}
        <input
          type="number"
          name={id}
          id={id}
          className="block w-full min-w-0 flex-1 border-0 bg-transparent py-0 pl-3 text-center text-lg font-bold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:ring-0 focus:outline-none appearance-none transition-colors"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
        />

        {/* Đơn vị hiển thị bên trong input */}
        <span className="text-gray-400 dark:text-gray-500 text-sm font-bold mr-3 select-none pointer-events-none transition-colors">
          {unit}
        </span>

        {/* Stacked Buttons Container - Nằm bên phải */}
        <div className="flex flex-col h-full w-9 border-l border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50/50 dark:bg-gray-700/30 transition-colors">
          {/* Nút Tăng (Up Arrow) */}
          <button 
            onClick={handleIncrement}
            className="flex-1 flex items-center justify-center text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 active:bg-indigo-100 dark:active:bg-indigo-900/50 transition-colors border-b border-gray-200 dark:border-gray-700 focus:outline-none"
            type="button"
            tabIndex={-1}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* Nút Giảm (Down Arrow) */}
          <button 
            onClick={handleDecrement}
            className="flex-1 flex items-center justify-center text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 active:bg-indigo-100 dark:active:bg-indigo-900/50 transition-colors focus:outline-none"
            type="button"
            tabIndex={-1}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

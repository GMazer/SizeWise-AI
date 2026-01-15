import React from 'react';
import { InputFieldProps } from '../types';
import { Minus, Plus } from 'lucide-react';

export const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  unit,
  placeholder,
  icon,
  onChange,
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

  return (
    <div className="flex flex-col space-y-2 group w-full">
      {/* Label & Unit - Thêm h-6 để cố định chiều cao dòng label, giúp các input thẳng hàng ngang */}
      <label htmlFor={id} className="h-6 text-sm font-bold text-gray-700 flex items-center justify-between transition-colors group-focus-within:text-indigo-600">
        <div className="flex items-center gap-2">
           {icon && <span className="text-gray-400 group-focus-within:text-indigo-500 transition-colors">{icon}</span>}
           <span className="truncate">{label}</span>
        </div>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap ml-2">
          {unit}
        </span>
      </label>
      
      <div className="relative flex items-center w-full">
        {/* Nút Giảm - Dùng absolute và translate-y-1/2 để căn giữa tuyệt đối theo chiều dọc */}
        <button 
          onClick={handleDecrement}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all active:scale-95 active:shadow-inner"
          type="button"
          tabIndex={-1}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Input chính */}
        <input
          type="number"
          name={id}
          id={id}
          className="block w-full rounded-xl border-0 py-3.5 px-12 text-center text-gray-900 bg-white ring-1 ring-inset ring-gray-200 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-lg font-bold shadow-sm transition-all duration-200"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
        />

        {/* Nút Tăng */}
        <button 
          onClick={handleIncrement}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all active:scale-95 active:shadow-inner"
          type="button"
          tabIndex={-1}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
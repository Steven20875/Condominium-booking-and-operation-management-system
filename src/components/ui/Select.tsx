import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  variant?: 'glass' | 'light' | 'solid';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variantStyles = {
  glass: 'bg-slate-950/40 border border-white/15 text-slate-50 placeholder:text-slate-400 focus:bg-slate-950/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
  light: 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
  solid: 'bg-slate-100 border border-slate-300 text-slate-900 placeholder:text-slate-500 focus:bg-slate-50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none',
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      variant = 'glass',
      fullWidth = false,
      icon,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantClass = variantStyles[variant];
    const widthClass = fullWidth ? 'w-full' : '';
    const errorClass = error ? 'border-rose-400/60 ring-2 ring-rose-400/20' : '';

    return (
      <div className={`flex flex-col gap-1 ${widthClass}`}>
        {label && (
          <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`${widthClass} px-4 py-2.5 text-sm rounded-xl transition-all duration-200 appearance-none cursor-pointer ${variantClass} ${errorClass} ${
              icon ? 'pl-10' : ''
            } pr-10 ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
        </div>
        {error && (
          <p className="text-xs text-rose-400 font-semibold">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-slate-300">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

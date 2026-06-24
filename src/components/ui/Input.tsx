import React from 'react';
import { LucideIcon } from 'lucide-react';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'glass' | 'light' | 'solid';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  size?: InputSize;
  variant?: InputVariant;
  fullWidth?: boolean;
  onClear?: () => void;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
};

const variantStyles: Record<InputVariant, string> = {
  glass: 'bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:bg-white/8 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
  light: 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
  solid: 'bg-slate-100 border border-slate-300 text-slate-900 placeholder:text-slate-500 focus:bg-slate-50 focus:border-blue-600 focus:outline-none',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      iconPosition = 'left',
      size = 'md',
      variant = 'glass',
      fullWidth = false,
      onClear,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClass = sizeStyles[size];
    const variantClass = variantStyles[variant];
    const widthClass = fullWidth ? 'w-full' : '';
    const errorClass = error ? 'border-rose-400/60 ring-2 ring-rose-400/20' : '';

    return (
      <div className={`flex flex-col gap-1 ${widthClass}`}>
        {label && (
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          )}
          <input
            ref={ref}
            className={`${widthClass} ${sizeClass} ${variantClass} ${errorClass} transition-all duration-200 ${
              Icon && iconPosition === 'left' ? 'pl-10' : ''
            } ${Icon && iconPosition === 'right' ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {Icon && iconPosition === 'right' && (
            <Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          )}
        </div>
        {error && (
          <p className="text-xs text-rose-400 font-semibold">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

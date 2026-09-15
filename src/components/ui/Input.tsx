/**
 * Input Component - Standardized Form Input with Validation
 * 
 * PROBLEM SOLVED: Before this component, every form had repetitive code:
 * - Manual label creation and association
 * - Duplicate error message styling
 * - Icon positioning logic repeated 20+ times
 * - No consistency in validation states
 * 
 * SOLUTION: Centralized input handling with built-in:
 * - Label rendering with proper htmlFor association (accessibility)
 * - Error display with visual feedback (red border + error text)
 * - Helper text for guidance
 * - Icon support with proper positioning
 * - Three variants to match app aesthetic (glass, light, solid)
 * 
 * VARIANTS EXPLANATION:
 * - glass: Premium dark-theme style (white/5 background, white/10 border)
 * - light: Bright, clean style (slate-50 background)
 * - solid: Standard form input
 * 
 * Used in: AuthPage (login, register, password reset), AdminDashboard (filters)
 * Reduced code: Eliminates ~40 lines per form using this component
 * 
 * Created by: [Student]
 */

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
  inputSize?: InputSize;
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
  glass: 'bg-slate-950/40 border border-white/15 text-slate-50 placeholder:text-slate-400 focus:bg-slate-950/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
  light: 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
  solid: 'bg-slate-100 border border-slate-300 text-slate-900 placeholder:text-slate-500 focus:bg-slate-50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      iconPosition = 'left',
      // keep default size internal as 'md'
      // inputSize prop removed to avoid clash with native HTML attribute
      // use `className` to adjust sizing if needed
      inputSize = 'md',
      variant = 'glass',
      fullWidth = false,
      onClear,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClass = sizeStyles[inputSize] ?? sizeStyles.md;
    const variantClass = variantStyles[variant] ?? variantStyles.glass;
    const widthClass = fullWidth ? 'w-full' : '';
    const errorClass = error ? 'border-rose-400/60 ring-2 ring-rose-400/20' : '';

    return (
      <div className={`flex flex-col gap-1 ${widthClass}`}>
        {label && (
          <label htmlFor={props.id} className={`text-xs font-semibold uppercase tracking-wider ${variant === 'glass' ? 'text-slate-200' : 'text-slate-700'}`}>
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
          <p className="text-xs text-rose-500 font-semibold">{error}</p>
        )}
        {helperText && !error && (
          <p className={`text-xs ${variant === 'glass' ? 'text-slate-300' : 'text-slate-500'}`}>{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

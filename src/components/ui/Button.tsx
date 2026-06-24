import React from 'react';
import { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-white/15 shadow-lg shadow-blue-500/20',
  secondary: 'bg-white/8 hover:bg-white/15 text-white border border-white/10 shadow-sm',
  tertiary: 'bg-transparent hover:bg-white/5 text-white border border-white/10',
  danger: 'bg-rose-600/80 hover:bg-rose-600 text-white border border-white/10 shadow-lg shadow-rose-500/20',
  success: 'bg-emerald-600/80 hover:bg-emerald-600 text-white border border-white/10 shadow-lg shadow-emerald-500/20',
  outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
  md: 'px-5 py-2.5 text-sm font-bold rounded-xl',
  lg: 'px-6 py-3.5 text-base font-bold rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading = false,
      loadingText,
      fullWidth = false,
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const baseStyles = 'inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider';
    const variantClass = variantStyles[variant];
    const sizeClass = sizeStyles[size];
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseStyles} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {!isLoading && Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
        <span>{isLoading && loadingText ? loadingText : children}</span>
        {!isLoading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
      </button>
    );
  }
);

Button.displayName = 'Button';

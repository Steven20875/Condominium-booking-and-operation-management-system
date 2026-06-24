import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'glass' | 'light' | 'solid';
  fullWidth?: boolean;
}

const variantStyles = {
  glass: 'bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:bg-white/8 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
  light: 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
  solid: 'bg-slate-100 border border-slate-300 text-slate-900 placeholder:text-slate-500 focus:bg-slate-50 focus:border-blue-600 focus:outline-none',
};

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'glass',
      fullWidth = false,
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
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`${widthClass} px-4 py-2.5 text-sm rounded-xl resize-none transition-all duration-200 ${variantClass} ${errorClass} ${className}`}
          {...props}
        />
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

TextArea.displayName = 'TextArea';

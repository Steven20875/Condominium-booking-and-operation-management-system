/**
 * Card Component System - Composable Card Layout
 * 
 * ARCHITECTURE PATTERN: Compound Components (similar to HTML table/thead/tbody)
 * - Card wrapper with variant styling
 * - CardHeader for title, subtitle, and action slots
 * - CardBody for main content
 * - CardFooter for buttons/actions
 * 
 * WHY COMPOUND COMPONENTS:
 * - Flexibility: compose in any order needed
 * - Maintainability: single styling source for all cards
 * - Consistency: prevents 20+ different card implementations
 * - Type-safe: TypeScript ensures proper nesting
 * 
 * BEFORE THIS COMPONENT:
 * <div className="rounded-xl border bg-white/5 border-white/10 backdrop-blur-md">
 *   <div className="p-6 border-b border-white/10">
 *     <h2 className="text-lg font-bold">{title}</h2>
 *   </div>
 *   <div className="p-6">{children}</div>
 * </div>
 * 
 * AFTER (using this component):
 * <Card>
 *   <CardHeader title={title} />
 *   <CardBody>{children}</CardBody>
 * </Card>
 * 
 * VARIANTS: glass (premium), light (bright), solid (standard)
 * HOVER EFFECT: Optional elevation on hover for interactivity
 * 
 * Used across: AdminDashboard (stat cards, data tables), ResidentDashboard (bookings, payments)
 * Created by: [Student]
 */

import React from 'react';

type CardVariant = 'glass' | 'light' | 'solid';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  children?: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center' | 'between';
}

const variantStyles: Record<CardVariant, string> = {
  glass: 'bg-white/4 border border-white/10 backdrop-blur-md',
  light: 'bg-white border border-slate-100 shadow-sm',
  solid: 'bg-slate-900 border border-slate-800 shadow-md',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'glass',
      hover = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantClass = variantStyles[variant];
    const hoverClass = hover ? 'hover:shadow-lg hover:border-white/15 transition-all hover:-translate-y-1' : '';

    return (
      <div
        ref={ref}
        className={`rounded-2xl p-6 ${variantClass} ${hoverClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    {
      title,
      subtitle,
      action,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={`flex items-start justify-between gap-4 pb-4 border-b border-white/10 ${className}`} {...props}>
        <div className="flex-1">
          {title && (
            <h3 className="font-serif font-bold text-lg text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  (
    {
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={`py-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  (
    {
      align = 'between',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const alignClass = {
      left: 'justify-start',
      right: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
    }[align];

    return (
      <div ref={ref} className={`flex items-center gap-3 pt-4 border-t border-white/10 ${alignClass} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

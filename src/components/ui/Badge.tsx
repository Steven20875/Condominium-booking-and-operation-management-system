import React from 'react';
import { LucideIcon } from 'lucide-react';

type BadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'default' | 'pending' | 'approved' | 'rejected' | 'inprogress' | 'completed';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  info: 'bg-blue-100 text-blue-800 border border-blue-200',
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  error: 'bg-rose-100 text-rose-800 border border-rose-200',
  default: 'bg-slate-100 text-slate-800 border border-slate-200',
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border border-rose-200',
  inprogress: 'bg-blue-100 text-blue-800 border border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[9px]',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      icon: Icon,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantClass = variantStyles[variant];
    const sizeClass = sizeStyles[size];

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold font-mono tracking-wider ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {Icon && <Icon className="h-3 w-3" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * Status badge utility - map status strings to Badge component
 */
export const StatusBadge = ({ status, size = 'md' }: { status: string; size?: BadgeSize }) => {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    'Pending': { variant: 'pending', label: 'Pending' },
    'Pending Approval': { variant: 'pending', label: 'Pending' },
    'Pending Payment': { variant: 'warning', label: 'Payment Pending' },
    'Approved': { variant: 'approved', label: 'Approved' },
    'Rejected': { variant: 'rejected', label: 'Rejected' },
    'In Progress': { variant: 'inprogress', label: 'In Progress' },
    'Completed': { variant: 'completed', label: 'Completed' },
    'Paid': { variant: 'success', label: 'Paid' },
    'Failed': { variant: 'error', label: 'Failed' },
    'Available': { variant: 'success', label: 'Available' },
    'Booked': { variant: 'warning', label: 'Booked' },
    'Maintenance': { variant: 'info', label: 'Maintenance' },
    'Cancelled': { variant: 'error', label: 'Cancelled' },
    'Closed': { variant: 'info', label: 'Closed' },
    'Open': { variant: 'warning', label: 'Open' },
    'Assigned': { variant: 'info', label: 'Assigned' },
    'Deferred': { variant: 'warning', label: 'Deferred' },
  };

  const config = statusMap[status] || { variant: 'default' as BadgeVariant, label: status };

  return <Badge variant={config.variant} size={size}>{config.label}</Badge>;
};

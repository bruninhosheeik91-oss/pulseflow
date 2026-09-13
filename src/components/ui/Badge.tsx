import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'score-excellent'
    | 'score-great'
    | 'score-good'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'shopee'
    | 'amazon';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  interactive?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  interactive = false,
  ...props
}) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs font-medium tracking-tight',
    sm: 'px-2 py-0.5 text-xs font-medium tracking-tight',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-wide',
  };

  const variantClasses = {
    default: 'bg-[#E2E8F0] text-[#172033] border border-[#E2E8F0]',
    'score-excellent':
      'bg-[#2563EB]/15 text-[#2563EB] border border-[#2563EB]/40 font-semibold',
    'score-great':
      'bg-[#2563EB]/10 text-[#3B82F6] border border-[#2563EB]/30 font-semibold',
    'score-good':
      'bg-amber-500/10 text-amber-700 border border-amber-500/30 font-semibold',
    success:
      'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-medium',
    warning:
      'bg-amber-500/15 text-amber-700 border border-amber-500/30 font-medium',
    danger:
      'bg-red-500/15 text-red-700 border border-red-500/30 font-medium',
    info: 'bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/40 font-medium',
    neutral: 'bg-[#F1F5F9] text-[#64748B] border border-[#BFDBFE] font-medium',
    shopee: 'bg-[#FF5722]/10 text-[#FF6B4A] border border-[#FF5722]/30 font-medium',
    amazon: 'bg-[#FF9900]/10 text-[#FFB03A] border border-[#FF9900]/30 font-medium',
  };

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:brightness-110 active:brightness-95'
    : '';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-sans whitespace-nowrap transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

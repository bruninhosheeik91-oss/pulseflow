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
    default: 'bg-[#152243] text-[#E6E8EC] border border-[#223561]',
    'score-excellent':
      'bg-[#1E5EFF]/15 text-[#00C2FF] border border-[#1E5EFF]/40 font-semibold',
    'score-great':
      'bg-[#00C2FF]/10 text-[#38BDF8] border border-[#00C2FF]/30 font-semibold',
    'score-good':
      'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold',
    success:
      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium',
    warning:
      'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium',
    danger:
      'bg-red-500/15 text-red-400 border border-red-500/30 font-medium',
    info: 'bg-[#1E5EFF]/20 text-[#70A1FF] border border-[#1E5EFF]/40 font-medium',
    neutral: 'bg-[#121C33] text-[#8E9BAE] border border-[#1E2E50] font-medium',
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

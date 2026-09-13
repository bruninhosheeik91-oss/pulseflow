import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 focus:ring-offset-2 focus:ring-offset-[#F4F7FB] disabled:opacity-45 disabled:pointer-events-none select-none';

  const sizeClasses = {
    xs: 'h-7 px-2.5 text-xs rounded-md gap-1.5',
    sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
    md: 'h-9 px-4 text-sm rounded-lg gap-2',
    lg: 'h-11 px-5 text-sm rounded-lg gap-2.5 font-semibold',
    icon: 'h-8 w-8 rounded-lg p-0',
  };

  const variantClasses = {
    primary:
      'bg-[#2563EB] text-white hover:bg-[#F8FAFC] active:bg-[#F8FAFC] border border-transparent shadow-sm shadow-[#2563EB]/20',
    secondary:
      'bg-[#EFF6FF] text-[#172033] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] border border-[#94A3B8] hover:border-[#E2E8F0]',
    outline:
      'bg-transparent text-[#172033] hover:bg-[#EFF6FF]/50 active:bg-[#EFF6FF] border border-[#BFDBFE] hover:border-[#93C5FD]',
    ghost:
      'bg-transparent text-[#64748B] hover:text-[#172033] hover:bg-[#EFF6FF]/80 active:bg-[#DBEAFE]',
    danger:
      'bg-red-500/10 text-red-700 hover:bg-red-500/20 active:bg-red-500/25 border border-red-500/25',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
};

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
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/50 focus:ring-offset-2 focus:ring-offset-[#0A0F1C] disabled:opacity-45 disabled:pointer-events-none select-none';

  const sizeClasses = {
    xs: 'h-7 px-2.5 text-xs rounded-md gap-1.5',
    sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
    md: 'h-9 px-4 text-sm rounded-lg gap-2',
    lg: 'h-11 px-5 text-sm rounded-lg gap-2.5 font-semibold',
    icon: 'h-8 w-8 rounded-lg p-0',
  };

  const variantClasses = {
    primary:
      'bg-[#1E5EFF] text-white hover:bg-[#184FD6] active:bg-[#133FA8] border border-transparent shadow-sm shadow-[#1E5EFF]/20',
    secondary:
      'bg-[#131E38] text-[#E6E8EC] hover:bg-[#18284B] active:bg-[#10192F] border border-[#22355F] hover:border-[#2C4378]',
    outline:
      'bg-transparent text-[#E6E8EC] hover:bg-[#131F3B]/50 active:bg-[#131F3B] border border-[#1E2E52] hover:border-[#2A4072]',
    ghost:
      'bg-transparent text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#131E38]/80 active:bg-[#152345]',
    danger:
      'bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/25 border border-red-500/25',
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

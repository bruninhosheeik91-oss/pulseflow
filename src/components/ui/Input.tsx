import React from 'react';
import { Loader2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  error?: string;
  helperText?: string;
  sizeVariant?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      leftIcon,
      rightIcon,
      loading = false,
      error,
      helperText,
      disabled,
      sizeVariant = 'sm',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 text-xs',
      md: 'h-9 text-xs',
      lg: 'h-10 text-sm',
    };

    return (
      <div className="relative w-full">
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span className="absolute left-2.5 flex items-center pointer-events-none text-[#8E9BAE]">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled || loading}
            className={`w-full bg-[#0A1020] border text-[#E6E8EC] placeholder:text-[#5A6470] rounded-lg transition-all duration-150
              hover:border-[#2A3E6D] hover:bg-[#0D152A]
              focus:outline-none focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF]
              active:bg-[#080D1A]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#1B2947]
              ${error ? 'border-red-500/60 text-red-300' : 'border-[#1B2947]'}
              ${sizeClasses[sizeVariant]}
              ${leftIcon ? 'pl-8' : 'pl-3'}
              ${rightIcon || loading ? 'pr-8' : 'pr-3'}
              ${className}`}
            {...props}
          />

          {loading ? (
            <span className="absolute right-2.5 flex items-center pointer-events-none text-[#00C2FF]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </span>
          ) : rightIcon ? (
            <span className="absolute right-2.5 flex items-center text-[#8E9BAE]">
              {rightIcon}
            </span>
          ) : null}
        </div>

        {error && (
          <p className="text-[11px] text-red-400 mt-1 pl-1">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-[11px] text-[#8E9BAE] mt-1 pl-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

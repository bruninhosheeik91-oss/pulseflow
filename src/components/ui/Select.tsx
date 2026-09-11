import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  sizeVariant?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      sizeVariant = 'sm',
      loading = false,
      leftIcon,
      error,
      helperText,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 text-xs pl-3 pr-8',
      md: 'h-9 text-xs pl-3 pr-8',
      lg: 'h-10 text-sm pl-3.5 pr-9',
    };

    return (
      <div className="relative w-full">
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span className="absolute left-2.5 flex items-center pointer-events-none text-[#8E9BAE]">
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            disabled={disabled || loading}
            className={`w-full appearance-none bg-[#0A1020] border text-[#E6E8EC] rounded-lg transition-all duration-150 cursor-pointer
              hover:border-[#2A3E6D] hover:bg-[#0D152A]
              focus:outline-none focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF]
              active:bg-[#090E1C]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#1B2947]
              ${error ? 'border-red-500/60 text-red-300' : 'border-[#1B2947]'}
              ${sizeClasses[sizeVariant]}
              ${leftIcon ? 'pl-8' : ''}
              ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[#0E1628] text-[#E6E8EC] py-1"
              >
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          {/* Right Indicator (Loading Spinner or Chevron) */}
          <span className="absolute right-2.5 flex items-center pointer-events-none text-[#8E9BAE]">
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00C2FF]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#8E9BAE]" />
            )}
          </span>
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

Select.displayName = 'Select';

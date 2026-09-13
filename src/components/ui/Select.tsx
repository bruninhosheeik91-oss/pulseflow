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
            <span className="absolute left-2.5 flex items-center pointer-events-none text-[#64748B]">
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            disabled={disabled || loading}
            className={`w-full appearance-none bg-[#F8FAFC] border text-[#172033] rounded-lg transition-all duration-150 cursor-pointer
              hover:border-[#93C5FD] hover:bg-[#F1F5F9]
              focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]
              active:bg-[#F8FAFC]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#DCE3EC]
              ${error ? 'border-red-500/60 text-red-700' : 'border-[#DCE3EC]'}
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
                className="bg-[#FFFFFF] text-[#172033] py-1"
              >
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          {/* Right Indicator (Loading Spinner or Chevron) */}
          <span className="absolute right-2.5 flex items-center pointer-events-none text-[#64748B]">
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
            )}
          </span>
        </div>

        {error && (
          <p className="text-[11px] text-red-700 mt-1 pl-1">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-[11px] text-[#64748B] mt-1 pl-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

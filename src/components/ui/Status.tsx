import React from 'react';

export type StatusVariant = 'active' | 'idle' | 'syncing' | 'warning' | 'error';
export type StatusSize = 'xs' | 'sm' | 'md';

export interface StatusProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: StatusVariant;
  size?: StatusSize;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export const Status: React.FC<StatusProps> = ({
  variant = 'active',
  size = 'sm',
  label,
  pulse = true,
  className = '',
  ...props
}) => {
  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  };

  const textSizes = {
    xs: 'text-[11px]',
    sm: 'text-xs',
    md: 'text-sm',
  };

  const variantConfig = {
    active: {
      bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700',
      dotColor: 'bg-emerald-500',
      pingColor: 'bg-emerald-400',
      defaultLabel: 'Ativo',
    },
    syncing: {
      bg: 'bg-[#2563EB]/15 border-[#2563EB]/30 text-[#2563EB]',
      dotColor: 'bg-[#2563EB]',
      pingColor: 'bg-[#2563EB]',
      defaultLabel: 'Sincronizando',
    },
    idle: {
      bg: 'bg-[#EFF6FF] border-[#CBD5E1] text-[#64748B]',
      dotColor: 'bg-[#94A3B8]',
      pingColor: 'bg-[#64748B]',
      defaultLabel: 'Em espera',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/25 text-amber-700',
      dotColor: 'bg-amber-500',
      pingColor: 'bg-amber-400',
      defaultLabel: 'Atenção',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/25 text-red-700',
      dotColor: 'bg-red-500',
      pingColor: 'bg-red-400',
      defaultLabel: 'Erro',
    },
  };

  const config = variantConfig[variant];
  const displayLabel = label ?? config.defaultLabel;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all duration-150 font-medium select-none ${config.bg} ${textSizes[size]} ${className}`}
      {...props}
    >
      <span className="relative flex items-center justify-center">
        {pulse && (variant === 'active' || variant === 'syncing') && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingColor}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSizes[size]} ${config.dotColor}`}
        />
      </span>
      {displayLabel && <span>{displayLabel}</span>}
    </div>
  );
};

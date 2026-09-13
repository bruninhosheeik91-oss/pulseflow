import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  active?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  active = false,
  ...props
}) => {
  return (
    <div
      className={`bg-[#FFFFFF] border rounded-xl transition-all duration-200 ${
        active
          ? 'border-[#FCA5A5] bg-[#FFF1F2] shadow-sm shadow-red-500/10'
          : 'border-[#DCE3EC]'
      } ${
        hoverable
          ? 'hover:-translate-y-1 hover:border-[#FECACA] hover:bg-[#FFF7F7] hover:shadow-lg hover:shadow-red-500/10 active:translate-y-[-1px] active:scale-[0.99] active:border-[#FCA5A5] active:bg-[#FFF1F2] active:shadow-sm active:shadow-red-500/10 cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => (
  <div
    className={`flex items-start justify-between gap-4 p-5 pb-4 border-b border-[#E2E8F0] ${className}`}
  >
    <div>
      <h3 className="text-base font-semibold text-[#172033] tracking-tight">
        {title}
      </h3>
      {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex items-center gap-2">{action}</div>}
  </div>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`p-5 pt-3 border-t border-[#E2E8F0] ${className}`}>
    {children}
  </div>
);

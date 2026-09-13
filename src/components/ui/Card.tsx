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
      className={`bg-[#FFFFFF] border rounded-xl transition-all duration-150 ${
        active
          ? 'border-[#2563EB] shadow-sm shadow-[#2563EB]/10'
          : 'border-[#DCE3EC]'
      } ${
        hoverable
          ? 'hover:border-[#93C5FD] hover:bg-[#F1F5F9] active:bg-[#F8FAFC] cursor-pointer'
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

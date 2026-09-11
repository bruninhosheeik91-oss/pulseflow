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
      className={`bg-[#0E1628] border rounded-xl transition-all duration-150 ${
        active
          ? 'border-[#1E5EFF] shadow-sm shadow-[#1E5EFF]/10'
          : 'border-[#1B2947]'
      } ${
        hoverable
          ? 'hover:border-[#283C66] hover:bg-[#10192F] active:bg-[#0D1528] cursor-pointer'
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
    className={`flex items-start justify-between gap-4 p-5 pb-4 border-b border-[#162442] ${className}`}
  >
    <div>
      <h3 className="text-base font-semibold text-[#E6E8EC] tracking-tight">
        {title}
      </h3>
      {subtitle && <p className="text-xs text-[#8E9BAE] mt-0.5">{subtitle}</p>}
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
  <div className={`p-5 pt-3 border-t border-[#162442] ${className}`}>
    {children}
  </div>
);

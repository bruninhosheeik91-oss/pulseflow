import React from 'react';
import { Marketplace } from '../../types';

interface MarketplaceBadgeProps {
  marketplace: Marketplace | string;
  size?: 'xs' | 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export const MarketplaceBadge: React.FC<MarketplaceBadgeProps> = ({
  marketplace,
  size = 'xs',
  showDot = true,
  className = '',
}) => {
  const getTheme = (mp: string) => {
    switch (mp) {
      case 'Shopee':
        return {
          bg: 'bg-[#FF5722]/10',
          border: 'border-[#FF5722]/25',
          text: 'text-[#FF7A59]',
          dot: 'bg-[#FF5722]',
        };
      case 'Mercado Livre':
        return {
          bg: 'bg-[#FFE600]/10',
          border: 'border-[#FFE600]/20',
          text: 'text-[#FACC15]',
          dot: 'bg-[#FACC15]',
        };
      case 'Amazon':
        return {
          bg: 'bg-[#FF9900]/10',
          border: 'border-[#FF9900]/25',
          text: 'text-[#FFB03A]',
          dot: 'bg-[#FF9900]',
        };
      case 'AliExpress':
        return {
          bg: 'bg-[#FF4747]/10',
          border: 'border-[#FF4747]/25',
          text: 'text-[#FF6B6B]',
          dot: 'bg-[#FF4747]',
        };
      case 'Magalu':
        return {
          bg: 'bg-[#F8FAFC]/10',
          border: 'border-[#E2E8F0]/25',
          text: 'text-[#3B82F6]',
          dot: 'bg-[#F8FAFC]',
        };
      case 'TikTok Shop':
        return {
          bg: 'bg-[#FE2C55]/10',
          border: 'border-[#FE2C55]/25',
          text: 'text-[#FF637F]',
          dot: 'bg-[#FE2C55]',
        };
      default:
        return {
          bg: 'bg-[#F1F5F9]',
          border: 'border-[#E2E8F0]',
          text: 'text-[#94A3B8]',
          dot: 'bg-[#94A3B8]',
        };
    }
  };

  const theme = getTheme(marketplace);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] font-medium tracking-tight',
    sm: 'px-2 py-0.5 text-xs font-medium tracking-tight',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-normal',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-sans whitespace-nowrap transition-colors select-none ${sizeClasses[size]} ${theme.bg} ${theme.border} ${theme.text} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{marketplace}</span>
    </span>
  );
};

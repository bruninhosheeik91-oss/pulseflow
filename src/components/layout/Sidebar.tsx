import React from 'react';
import { NAV_ITEMS, NavItem } from './navConfig';

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

const SUPPORT_ID = 'Suporte';

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem = 'Dashboard',
  onNavigate,
}) => {
  const navItems = NAV_ITEMS.filter((item) => item.id !== SUPPORT_ID);
  const supportItem = NAV_ITEMS.find((item) => item.id === SUPPORT_ID);

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate?.(item.id)}
        className={`w-full h-[26px] flex items-center gap-2.5 px-2.5 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
          isActive
            ? 'bg-[#1E5EFF]/20 border-[#1E5EFF]/45 text-[#E6E8EC] shadow-[0_0_14px_rgba(30,94,255,0.28)]'
            : 'border-transparent text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#0D162B]'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-[#00C2FF]' : 'text-[#5A6470]'
          }`}
        />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-40 shrink-0 bg-[#0A0F1C] border-r border-[#14203B]/50 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand */}
      <div className="h-12 px-3 flex items-center border-b border-[#14203B]/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#1E5EFF] to-[#00C2FF] flex items-center justify-center shrink-0">
            <span className="font-extrabold text-white text-[9px] tracking-wider">
              DX
            </span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold tracking-widest text-[#E6E8EC] text-[11px]">
              DOMNEX
            </span>
            <span className="font-bold text-[9px] text-[#00C2FF] tracking-widest mt-0.5">
              DEALS
            </span>
          </div>
        </div>
      </div>

      {/* Flat navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-px scrollbar-thin scrollbar-thumb-[#14203B] scrollbar-track-transparent">
        {navItems.map(renderItem)}
      </nav>

      {/* Support pinned to bottom */}
      <div className="shrink-0 p-2 border-t border-[#14203B]/50">
        {supportItem && renderItem(supportItem)}
      </div>
    </aside>
  );
};
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
        className={`group w-full h-[26px] flex items-center gap-2.5 px-2.5 rounded-md text-[11px] font-medium transition-all duration-150 border ${
          isActive
            ? 'bg-[#EAF2FF] border-[#BFDBFE] text-[#1D4ED8] shadow-sm'
            : 'border-transparent text-[#5F6B7A] hover:text-[#172033] hover:bg-[#F1F5F9]'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-[#2563EB]' : 'text-[#8793A3] group-hover:text-[#475569]'
          }`}
        />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="w-40 shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 select-none z-30 shadow-[2px_0_12px_rgba(15,23,42,0.03)]">
      {/* Brand */}
      <div className="h-12 px-3 flex items-center border-b border-[#E2E8F0] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#1E5EFF] flex items-center justify-center shrink-0">
            <span className="font-extrabold text-white text-[9px] tracking-wider">
              PF
            </span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold tracking-widest text-[#172033] text-[11px]">
              PULSE
            </span>
            <span className="font-bold text-[9px] text-[#2563EB] tracking-widest mt-0.5">
              FLOW
            </span>
          </div>
        </div>
      </div>

      {/* Flat navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-px scrollbar-thin scrollbar-thumb-[#CBD5E1] scrollbar-track-transparent">
        {navItems.map(renderItem)}
      </nav>

      {/* Support pinned to bottom */}
      <div className="shrink-0 p-2 border-t border-[#E2E8F0]">
        {supportItem && renderItem(supportItem)}
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import { Search, Bell, Plus, User, CheckCheck, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { notificationsMock } from '../../data/mockData';

interface TopbarProps {
  onOpenNewCampaign: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  pageTitle?: string;
  pageSubtitle?: string;
  icon?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenNewCampaign,
  searchQuery,
  onSearchChange,
  pageTitle = 'Dashboard',
  pageSubtitle = 'Visão geral da sua operação de afiliados',
  icon,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(notificationsMock);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_8px_rgba(15,23,42,0.03)]">
      {/* Left Title & Subtext */}
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-[#172033] tracking-tight leading-tight">
            {pageTitle}
          </h1>
          <p className="text-xs text-[#64748B] font-medium truncate">
            {pageSubtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Search, Notifications, New Campaign, User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-64 md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar ofertas, produtos, campanhas..."
            className="w-full h-9 pl-9 pr-8 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg text-xs text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#334155]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] border border-[#DCE3EC] transition-colors focus:outline-none"
            title="Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-xl shadow-slate-900/10 p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-2">
                <span className="font-semibold text-[#172033]">Notificações</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar como lidas
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-center">
                    <Bell className="w-6 h-6 text-[#5A6470]" />
                    <p className="text-xs text-[#64748B]">
                      Nenhuma notificação
                    </p>
                  </div>
                )}
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      item.unread
                        ? 'bg-[#EFF6FF] border-[#BFDBFE]'
                        : 'bg-[#F8FAFC] border-transparent opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-[#172033] text-xs leading-snug">
                        {item.title}
                      </p>
                      <span className="text-xs text-[#64748B] shrink-0 font-mono-numeric">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action: + Nova campanha */}
        <Button
          onClick={onOpenNewCampaign}
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm shadow-[#1E5EFF]/30 text-xs font-semibold"
        >
          Nova campanha
        </Button>

        {/* User / Org Avatar */}
        <div
          className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#DCE3EC] flex items-center justify-center text-xs font-semibold text-[#334155] cursor-pointer hover:border-[#93C5FD] hover:bg-[#EFF6FF] transition-colors"
          title="Conta Domnex Tech"
        >
          <User className="w-4 h-4 text-[#64748B]" />
        </div>
      </div>
    </header>
  );
};

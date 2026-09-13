import React from 'react';
import {
  MessageCircle,
  RefreshCw,
  Link2,
  LogOut,
  Phone,
  User,
  CalendarClock,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Status } from '../ui/Status';
import {
  WhatsAppAccount,
  WhatsAppConnectionStatus,
  WHATSAPP_STATUS_LABELS,
} from '../../types/whatsApp';

interface WhatsAppConnectionCardProps {
  status: WhatsAppConnectionStatus;
  account: WhatsAppAccount | null;
  isSyncing: boolean;
  onConnect: () => void;
  onSyncGroups: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
}

const DETAILS: {
  label: string;
  key: 'number' | 'name' | 'connectionStatus' | 'lastSyncAt';
  icon: React.FC<{ className?: string }>;
}[] = [
  { label: 'Número', key: 'number', icon: Phone },
  { label: 'Nome', key: 'name', icon: User },
  { label: 'Status', key: 'connectionStatus', icon: ShieldAlert },
  { label: 'Última sincronização', key: 'lastSyncAt', icon: CalendarClock },
];

export const WhatsAppConnectionCard: React.FC<
  WhatsAppConnectionCardProps
> = ({
  status,
  account,
  isSyncing,
  onConnect,
  onSyncGroups,
  onReconnect,
  onDisconnect,
}) => {
  const isConnected = status === 'connected';

  if (isConnected) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#172033] tracking-tight">
                Conta conectada
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {account?.name || 'WhatsApp'}
              </p>
            </div>
          </div>
          <Status variant="active" size="sm" label="Conectado" />
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {DETAILS.map(({ label, key, icon: Icon }) => (
              <div
                key={key}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <Icon className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                    {label}
                  </span>
                  <span className="text-xs font-medium text-[#172033] block mt-0.5">
                    {key === 'connectionStatus'
                      ? WHATSAPP_STATUS_LABELS[account?.connectionStatus ?? status]
                      : account?.[key] || '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onSyncGroups}
              loading={isSyncing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-medium"
            >
              Sincronizar grupos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReconnect}
              leftIcon={<Link2 className="w-3.5 h-3.5" />}
              className="text-xs font-medium"
            >
              Reconectar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              className="text-xs text-red-700 hover:text-red-700"
            >
              Desconectar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6">
      <div className="flex items-start gap-4 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center shrink-0">
          <MessageCircle className="w-6 h-6 text-[#2563EB]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[#172033] tracking-tight">
            Conecte seu WhatsApp
          </h2>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            Conecte uma conta para importar seus grupos e habilitar as
            automações de distribuição.
          </p>
          <div className="mt-3">
            <Status variant="idle" size="xs" label="Desconectado" pulse={false} />
          </div>
        </div>
      </div>
      <Button
        variant="primary"
        size="md"
        onClick={onConnect}
        leftIcon={<MessageCircle className="w-4 h-4" />}
        className="shrink-0 font-semibold"
      >
        Conectar WhatsApp
      </Button>
    </div>
  );
};
import React from 'react';
import {
  Radio,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Users,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface ChannelsHeaderProps {
  totalCount: number;
  onlineCount: number;
  totalAudience: number;
  isTestingConnections: boolean;
  onTestConnections: () => void;
  onOpenConnectModal: () => void;
}

export const ChannelsHeader: React.FC<ChannelsHeaderProps> = ({
  totalCount,
  onlineCount,
  totalAudience,
  isTestingConnections,
  onTestConnections,
  onOpenConnectModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1 border-b border-[#14203B]/60">
      {/* Title and Subtitle */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#102347] to-[#0A162C] border border-[#1E3A6E] flex items-center justify-center text-[#00C2FF] shadow-sm">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
                Canais e Grupos
              </h1>
              {/* Online indicator */}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} de {totalCount} canais online
              </span>
            </div>
            <p className="text-xs text-[#8E9BAE]">
              Gerenciamento de canais de distribuição, instâncias WhatsApp, bots do Telegram e status de entrega.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onTestConnections}
          disabled={isTestingConnections}
          leftIcon={
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isTestingConnections ? 'animate-spin text-[#00C2FF]' : 'text-[#8E9BAE]'
              }`}
            />
          }
          className="text-xs border-[#182747] text-[#E6E8EC] hover:text-[#00C2FF] cursor-pointer"
        >
          {isTestingConnections ? 'Testando Conexões...' : 'Testar Conexões'}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenConnectModal}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs font-semibold px-4 cursor-pointer"
        >
          Conectar Novo Canal
        </Button>
      </div>
    </div>
  );
};

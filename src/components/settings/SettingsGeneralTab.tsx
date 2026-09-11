import React, { useState } from 'react';
import {
  Sliders,
  Bell,
  Volume2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Save,
  Clock,
  Mail,
} from 'lucide-react';
import { SystemGeneralSettings } from '../../types';
import { Button } from '../ui/Button';

interface SettingsGeneralTabProps {
  settings: SystemGeneralSettings;
  onSave: (newSettings: SystemGeneralSettings) => void;
  onResetFactory: () => void;
}

export const SettingsGeneralTab: React.FC<SettingsGeneralTabProps> = ({
  settings,
  onSave,
  onResetFactory,
}) => {
  const [formData, setFormData] = useState<SystemGeneralSettings>(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Informações do Workspace */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[#14203B] pb-2.5">
            <Globe className="w-4 h-4 text-[#00C2FF]" />
            <h4 className="font-bold text-white text-xs">
              Identificação do Sistema & Localização
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Nome da Operação / Workspace:
              </label>
              <input
                type="text"
                value={formData.workspaceName}
                onChange={(e) =>
                  setFormData({ ...formData, workspaceName: e.target.value })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                E-mail do Administrador (Alertas de Falha):
              </label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) =>
                  setFormData({ ...formData, adminEmail: e.target.value })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#8E9BAE] text-[11px] block mb-1">
                  Fuso Horário:
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) =>
                    setFormData({ ...formData, timezone: e.target.value })
                  }
                  className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
                >
                  <option value="America/Sao_Paulo (UTC-03:00)">São Paulo (UTC-03:00)</option>
                  <option value="America/Manaus (UTC-04:00)">Manaus (UTC-04:00)</option>
                  <option value="UTC">UTC Padrão</option>
                </select>
              </div>

              <div>
                <label className="text-[#8E9BAE] text-[11px] block mb-1">
                  Moeda Padrão:
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.currency}
                  className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-2.5 py-1.5 text-xs text-[#8E9BAE] opacity-70"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Alertas & Retenção de Dados */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[#14203B] pb-2.5">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-white text-xs">
              Notificações do Painel & Retenção
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-2.5 bg-[#0B1220] rounded-lg border border-[#16233B] cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[#00C2FF]" />
                <div>
                  <span className="text-white font-medium block">
                    Notificações do Navegador
                  </span>
                  <span className="text-[11px] text-[#8E9BAE]">
                    Avisar em tempo real quando uma oferta crítica for aprovada
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enableDesktopNotifications}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    enableDesktopNotifications: e.target.checked,
                  })
                }
                className="rounded border-[#192747] text-[#1E5EFF] focus:ring-0 bg-[#0E1628]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-[#0B1220] rounded-lg border border-[#16233B] cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-white font-medium block">
                    Sons de Confirmação de Disparo
                  </span>
                  <span className="text-[11px] text-[#8E9BAE]">
                    Tocar aviso sonoro sutil quando um disparo for entregue
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enableSoundAlerts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    enableSoundAlerts: e.target.checked,
                  })
                }
                className="rounded border-[#192747] text-[#1E5EFF] focus:ring-0 bg-[#0E1628]"
              />
            </label>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Retenção Automática de Registros de Histórico:
              </label>
              <select
                value={formData.autoCleanHistoryDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoCleanHistoryDays: parseInt(e.target.value),
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              >
                <option value="30">Limpar logs mais antigos que 30 dias</option>
                <option value="90">Limpar logs mais antigos que 90 dias (Padrão)</option>
                <option value="180">Limpar logs mais antigos que 180 dias</option>
                <option value="365">Manter logs por 1 ano</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h4 className="font-bold text-rose-300 text-xs">
              Zona de Redefinição do Sistema
            </h4>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-[#94A3B8]">
            Restaura todas as configurações, regras de corte, gateways e templates para os padrões recomendados de fábrica.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFactory}
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 shrink-0"
          >
            Redefinir para Padrão de Fábrica
          </Button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" className="flex items-center gap-2 shadow-md">
          <Save className="w-4 h-4" />
          <span>Salvar Configurações Gerais</span>
        </Button>
      </div>
    </form>
  );
};

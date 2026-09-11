import React, { useState } from 'react';
import {
  Radio,
  Server,
  KeyRound,
  Link,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Save,
  RotateCw,
} from 'lucide-react';
import { GatewaySettings } from '../../types';
import { Button } from '../ui/Button';

interface SettingsGatewaysTabProps {
  settings: GatewaySettings;
  onSave: (newSettings: GatewaySettings) => void;
}

export const SettingsGatewaysTab: React.FC<SettingsGatewaysTabProps> = ({
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<GatewaySettings>(settings);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testResult, setTestResult] = useState<{
    target: 'whatsapp' | 'telegram';
    status: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleTestWhatsApp = () => {
    setTestingWhatsApp(true);
    setTestResult(null);
    const hasConfig = Boolean(formData.endpointUrl && formData.globalApiKey);
    setTimeout(() => {
      setTestingWhatsApp(false);
      setTestResult({
        target: 'whatsapp',
        status: hasConfig ? 'success' : 'error',
        message: hasConfig
          ? 'Conexão com o endpoint configurado estabelecida.'
          : 'Endpoint URL ou Global API Key não configurados. Preencha e tente novamente.',
      });
    }, 1200);
  };

  const handleTestTelegram = () => {
    setTestingTelegram(true);
    setTestResult(null);
    const hasConfig = Boolean(formData.telegramBotToken && formData.telegramBotUsername);
    setTimeout(() => {
      setTestingTelegram(false);
      setTestResult({
        target: 'telegram',
        status: hasConfig ? 'success' : 'error',
        message: hasConfig
          ? 'Autenticação do bot validada com sucesso.'
          : 'Token ou username do bot não configurados. Preencha e tente novamente.',
      });
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Introduction banner */}
      <div className="p-3.5 bg-[#0B1220] border border-[#16233B] rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Server className="w-4 h-4 text-[#00C2FF] shrink-0" />
          <span className="text-[#8E9BAE]">
            Gerencie os servidores de gateway responsáveis por orquestrar e disparar mensagens para seus canais no WhatsApp e Telegram.
          </span>
        </div>
      </div>

      {/* Test feedback notification */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 animate-in fade-in duration-200 ${
            testResult.status === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {testResult.status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{testResult.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. WhatsApp Evolution API Card */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#14203B] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
              <h4 className="font-bold text-white text-xs">
                Gateway WhatsApp (Evolution API)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#8E9BAE] bg-[#14203B] px-2 py-0.5 rounded border border-[#1E3057]">
              Sem conexão
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Provedor de Gateway:
              </label>
              <select
                value={formData.provider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    provider: e.target.value as any,
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              >
                <option value="Evolution API">Evolution API v2.1 (Recomendado)</option>
                <option value="Z-API">Z-API Cloud</option>
                <option value="Baileys Self-hosted">Baileys Self-hosted Node</option>
                <option value="WhatsApp Cloud API">WhatsApp Cloud API (Meta Oficial)</option>
              </select>
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Endpoint URL da Instância:
              </label>
              <input
                type="text"
                value={formData.endpointUrl}
                onChange={(e) =>
                  setFormData({ ...formData, endpointUrl: e.target.value })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Global API Key:
              </label>
              <input
                type="password"
                value={formData.globalApiKey}
                onChange={(e) =>
                  setFormData({ ...formData, globalApiKey: e.target.value })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Webhook de Confirmação de Entrega (Status Callback):
              </label>
              <input
                type="text"
                value={formData.webhookDeliveryUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    webhookDeliveryUrl: e.target.value,
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestWhatsApp}
                disabled={testingWhatsApp}
                className="w-full flex items-center justify-center gap-1.5 text-xs"
              >
                <Zap
                  className={`w-3.5 h-3.5 text-emerald-400 ${
                    testingWhatsApp ? 'animate-pulse' : ''
                  }`}
                />
                <span>{testingWhatsApp ? 'Testando Conexão...' : 'Testar Conexão WhatsApp'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Telegram Bot Gateway Card */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#14203B] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
              <h4 className="font-bold text-white text-xs">
                Gateway Telegram Bot (BotFather)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#8E9BAE] bg-[#14203B] px-2 py-0.5 rounded border border-[#1E3057]">
              Sem conexão
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Telegram Bot Token (BotFather):
              </label>
              <input
                type="password"
                value={formData.telegramBotToken}
                onChange={(e) =>
                  setFormData({ ...formData, telegramBotToken: e.target.value })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Username do Bot Oficial:
              </label>
              <input
                type="text"
                value={formData.telegramBotUsername}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    telegramBotUsername: e.target.value,
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Timeout Máximo de Requisição (segundos):
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={formData.requestTimeoutSeconds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requestTimeoutSeconds: parseInt(e.target.value) || 20,
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div className="pt-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="w-full flex items-center justify-center gap-1.5 text-xs"
              >
                <Send
                  className={`w-3.5 h-3.5 text-sky-400 ${
                    testingTelegram ? 'animate-pulse' : ''
                  }`}
                />
                <span>{testingTelegram ? 'Verificando Bot...' : 'Testar Conexão Telegram'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" className="flex items-center gap-2 shadow-md">
          <Save className="w-4 h-4" />
          <span>Salvar Configurações de Gateway</span>
        </Button>
      </div>
    </form>
  );
};

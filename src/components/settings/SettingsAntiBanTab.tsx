import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  Shuffle,
  Moon,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Save,
  ZapOff,
} from 'lucide-react';
import { AntiBanSettings } from '../../types';
import { Button } from '../ui/Button';

interface SettingsAntiBanTabProps {
  settings: AntiBanSettings;
  onSave: (newSettings: AntiBanSettings) => void;
}

export const SettingsAntiBanTab: React.FC<SettingsAntiBanTabProps> = ({
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<AntiBanSettings>(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Safeguard status alert */}
      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Proteção Ativa contra Bloqueios:</strong> Algoritmos de espaçamento dinâmico e humanização de tráfego protegem seus números de WhatsApp contra banimentos do Meta e suspensões de canais.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Cadência & Espaçamento */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[#14203B] pb-2.5">
            <Clock className="w-4 h-4 text-[#00C2FF]" />
            <h4 className="font-bold text-white text-xs">
              Cadência e Espaçamento Inteligente
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#8E9BAE] text-[11px]">
                  Intervalo Mínimo Entre Disparos (no mesmo canal):
                </label>
                <span className="font-mono text-white font-bold">
                  {formData.minIntervalMinutes} minutos
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={formData.minIntervalMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minIntervalMinutes: parseInt(e.target.value),
                  })
                }
                className="w-full accent-[#1E5EFF] bg-[#14203B] rounded-lg h-2"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Recomendado: mínimo de 15 minutos para manter alta taxa de entrega e zero denúncias de spam.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#8E9BAE] text-[11px]">
                  Variação Aleatória (Jitter Anti-Bot):
                </label>
                <span className="font-mono text-[#00C2FF] font-bold">
                  &plusmn;{formData.randomJitterMinutes} min aleatórios
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={formData.randomJitterMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    randomJitterMinutes: parseInt(e.target.value),
                  })
                }
                className="w-full accent-[#00C2FF] bg-[#14203B] rounded-lg h-2"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Adiciona variação randômica ao horário previsto para que os disparos não ocorram sempre em minutos fixos (ex: 10:00:00).
              </p>
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Limite Máximo de Mensagens por Canal / Dia:
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={formData.maxDailyMessagesPerChannel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxDailyMessagesPerChannel: parseInt(e.target.value) || 24,
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>
          </div>
        </div>

        {/* 2. Horário de Silêncio & Humanização */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[#14203B] pb-2.5">
            <Moon className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-white text-xs">
              Horário de Silêncio Noturno (Quiet Hours)
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#0B1220] rounded-lg border border-[#16233B]">
              <div>
                <span className="text-white font-medium block">
                  Pausar Disparos na Madrugada
                </span>
                <span className="text-[11px] text-[#8E9BAE]">
                  Evita incomodar membros e previne saídas em massa do grupo
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.quietHoursEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quietHoursEnabled: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#14203B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1E5EFF]" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#8E9BAE] text-[11px] block mb-1">
                  Início do Silêncio:
                </label>
                <input
                  type="time"
                  value={formData.quietHoursStart}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quietHoursStart: e.target.value,
                    })
                  }
                  disabled={!formData.quietHoursEnabled}
                  className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[#8E9BAE] text-[11px] block mb-1">
                  Término do Silêncio:
                </label>
                <input
                  type="time"
                  value={formData.quietHoursEnd}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quietHoursEnd: e.target.value,
                    })
                  }
                  disabled={!formData.quietHoursEnabled}
                  className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF] disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#8E9BAE] text-[11px]">
                  Simulação de Presença ("Digitando..."):
                </label>
                <span className="font-mono text-emerald-400 font-bold">
                  {formData.simulateTypingSeconds}s antes do envio
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={formData.simulateTypingSeconds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    simulateTypingSeconds: parseInt(e.target.value),
                  })
                }
                className="w-full accent-emerald-400 bg-[#14203B] rounded-lg h-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Circuit Breaker */}
      <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-[#14203B] pb-2.5">
          <ZapOff className="w-4 h-4 text-amber-400" />
          <h4 className="font-bold text-white text-xs">
            Disjuntor de Emergência (Circuit Breaker)
          </h4>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-white font-medium block">
              Pausar fila de disparos automaticamente se houver falhas consecutivas
            </span>
            <span className="text-[11px] text-[#8E9BAE]">
              Evita que instâncias desconectadas acumulem erros ou disparem rajadas fora de hora
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-[#8E9BAE]">Pausar após:</span>
            <select
              value={formData.maxConsecutiveFails}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxConsecutiveFails: parseInt(e.target.value),
                })
              }
              className="bg-[#0E1628] border border-[#182642] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
            >
              <option value="2">2 falhas</option>
              <option value="3">3 falhas (Padrão)</option>
              <option value="5">5 falhas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" className="flex items-center gap-2 shadow-md">
          <Save className="w-4 h-4" />
          <span>Salvar Regras Anti-Ban</span>
        </Button>
      </div>
    </form>
  );
};

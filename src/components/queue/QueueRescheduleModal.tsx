import React, { useState } from 'react';
import { Clock, Calendar, ShieldCheck, Flame, Zap } from 'lucide-react';
import { QueueItem, QueuePriority } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface QueueRescheduleModalProps {
  isOpen: boolean;
  item: QueueItem | null;
  onClose: () => void;
  onSaveReschedule: (
    itemId: string,
    newTime: string,
    priority: QueuePriority,
    delayMinutes: number
  ) => void;
}

export const QueueRescheduleModal: React.FC<QueueRescheduleModalProps> = ({
  isOpen,
  item,
  onClose,
  onSaveReschedule,
}) => {
  if (!item) return null;

  const [time, setTime] = useState(item.time || '12:00');
  const [priority, setPriority] = useState<QueuePriority>(
    item.priority || 'Normal'
  );
  const [additionalDelay, setAdditionalDelay] = useState<number>(15);

  const quickPresets = [
    { label: '+10 min', minutes: 10 },
    { label: '+20 min', minutes: 20 },
    { label: '+30 min', minutes: 30 },
    { label: '+1 hora', minutes: 60 },
  ];

  const handleApplyPreset = (minutes: number) => {
    // calculate new time based on current item time
    const [hours, mins] = (item.time || '11:00').split(':').map(Number);
    if (!isNaN(hours) && !isNaN(mins)) {
      const totalMins = hours * 60 + mins + minutes;
      const newH = Math.floor(totalMins / 60) % 24;
      const newM = totalMins % 60;
      const formatted = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
      setTime(formatted);
      setAdditionalDelay(minutes);
    }
  };

  const handleSave = () => {
    onSaveReschedule(item.id, time, priority, additionalDelay);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reagendar Horário de Publicação"
      subtitle={`Oferta: ${item.productName.substring(0, 45)}...`}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Current info pill */}
        <div className="p-3 bg-[#0E1628] border border-[#1B2947] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[#8E9BAE]">Canal de Destino:</span>
            <p className="font-semibold text-white mt-0.5">{item.channel}</p>
          </div>
          <div className="text-right">
            <span className="text-[#8E9BAE]">Horário Atual:</span>
            <p className="font-mono-numeric font-bold text-[#00C2FF] mt-0.5">
              {item.time}
            </p>
          </div>
        </div>

        {/* Quick presets */}
        <div>
          <label className="block font-medium text-[#CBD5E1] mb-1.5">
            Adicionar Intervalo Rápido
          </label>
          <div className="grid grid-cols-4 gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset.minutes)}
                className="py-2 px-2.5 bg-[#121E38] hover:bg-[#1A2B50] border border-[#1E3360] rounded-lg font-medium text-[#E6E8EC] transition-colors text-center"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Specific time input */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-[#CBD5E1] mb-1.5">
              Horário Específico (HH:MM)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#0A1020] border border-[#192747] rounded-lg pl-9 pr-3 py-2 text-xs text-[#E6E8EC] font-mono focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#CBD5E1] mb-1.5">
              Prioridade da Fila
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as QueuePriority)}
              className="w-full bg-[#0A1020] border border-[#192747] rounded-lg px-3 py-2 text-xs text-[#E6E8EC] focus:outline-none focus:border-[#1E5EFF]"
            >
              <option value="Alta">Alta (Disparo prioritário)</option>
              <option value="Normal">Normal (Ordem cronológica)</option>
              <option value="Baixa">Baixa (Preenchimento de grade)</option>
            </select>
          </div>
        </div>

        {/* Anti-flood warning */}
        <div className="p-2.5 bg-[#0E1B33] border border-[#1C3A6D] rounded-lg flex items-center gap-2.5 text-[#94A3B8]">
          <ShieldCheck className="w-4 h-4 text-[#00C2FF] shrink-0" />
          <span className="text-[11px] leading-relaxed">
            O algoritmo garante um espaçamento mínimo seguro de 15 minutos entre mensagens no mesmo canal para blindar suas instâncias contra banimentos.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#16233B]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Confirmar Reagendamento
          </Button>
        </div>
      </div>
    </Modal>
  );
};

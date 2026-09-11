import React, { useState } from 'react';
import { Calendar, Clock, Radio, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProductOffer } from '../../types';

interface ScheduleOfferModalProps {
  offer: ProductOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSchedule: (offer: ProductOffer, date: string, time: string, channel: string) => void;
}

export const ScheduleOfferModal: React.FC<ScheduleOfferModalProps> = ({
  offer,
  isOpen,
  onClose,
  onConfirmSchedule,
}) => {
  const [dateOption, setDateOption] = useState('Hoje');
  const [time, setTime] = useState('14:30');
  const [channel, setChannel] = useState('Ofertas Gerais (Telegram)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!offer) return null;

  const channels = [
    'Ofertas Gerais (Telegram)',
    'Eletrônicos & Tech (WhatsApp)',
    'Casa & Cozinha (WhatsApp)',
    'Achadinhos VIP (Telegram)',
  ];

  const quickTimes = ['11:00', '13:30', '16:00', '18:45', '20:30'];

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmSchedule(offer, dateOption, time, channel);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agendar Publicação"
      subtitle="Defina o canal e o melhor horário de conversão"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Compact Product Bar */}
        <div className="flex items-center gap-3 p-2.5 bg-[#0B1224] border border-[#162340] rounded-lg">
          <img
            src={offer.imageUrl}
            alt={offer.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-md object-cover border border-[#1A284A]"
          />
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-semibold text-[#E6E8EC] truncate">
              {offer.name}
            </h5>
            <div className="flex items-center gap-2 text-xs text-[#8E9BAE] mt-0.5">
              <span className="font-mono-numeric font-bold text-emerald-400">
                R$ {offer.price.toFixed(2).replace('.', ',')}
              </span>
              <span>•</span>
              <span className="font-mono-numeric">Score {offer.score.total} pts</span>
            </div>
          </div>
        </div>

        {/* Data Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#E6E8EC]">
            Data de envio
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Hoje', 'Amanhã', 'Personalizada'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDateOption(d)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium text-center transition-all ${
                  dateOption === d
                    ? 'bg-[#152345] border-[#1E5EFF] text-[#00C2FF]'
                    : 'bg-[#0A1020] border-[#162340] text-[#8E9BAE] hover:border-[#22355C]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Horário */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#E6E8EC]">
              Horário de disparo
            </label>
            <span className="text-[11px] text-[#8E9BAE]">
              Intervalo anti-spam ativo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-[#0A1020] border border-[#162340] rounded-lg text-xs font-mono-numeric text-[#E6E8EC] focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>
            <div className="flex items-center gap-1">
              {quickTimes.slice(0, 3).map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => setTime(qt)}
                  className={`px-2 py-2 rounded-lg border text-xs font-mono-numeric transition-colors ${
                    time === qt
                      ? 'bg-[#152345] border-[#1E5EFF] text-[#00C2FF]'
                      : 'bg-[#0A1020] border-[#162340] text-[#8E9BAE] hover:border-[#203254]'
                  }`}
                >
                  {qt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canal / Grupo */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#E6E8EC]">
            Canal ou Grupo de destino
          </label>
          <div className="space-y-1.5">
            {channels.map((ch) => {
              const active = channel === ch;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    active
                      ? 'bg-[#152345] border-[#1E5EFF] text-[#E6E8EC]'
                      : 'bg-[#0A1020] border-[#162340] text-[#8E9BAE] hover:border-[#22355C]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Radio className={`w-3.5 h-3.5 ${active ? 'text-[#00C2FF]' : 'text-[#5A6470]'}`} />
                    <span className="text-xs font-medium">{ch}</span>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full border ${
                      active
                        ? 'border-[#00C2FF] bg-[#00C2FF]'
                        : 'border-[#26375E] bg-[#0A1020]'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#162340]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            loading={isSubmitting}
            leftIcon={<Calendar className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Agendar publicação
          </Button>
        </div>
      </div>
    </Modal>
  );
};

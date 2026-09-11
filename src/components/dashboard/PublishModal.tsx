import React, { useState } from 'react';
import { Send, Clock, Radio, CheckCircle2 } from 'lucide-react';
import { ProductOffer } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PublishModalProps {
  offer: ProductOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: (offer: ProductOffer, channel: string, time: string) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  offer,
  isOpen,
  onClose,
  onConfirmPublish,
}) => {
  const [selectedChannel, setSelectedChannel] = useState(
    'Ofertas Gerais (Telegram)'
  );
  const [mode, setMode] = useState<'immediate' | 'schedule'>('immediate');
  const [scheduledTime, setScheduledTime] = useState('11:50');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedDone, setPublishedDone] = useState(false);

  if (!offer) return null;

  const channels = [
    { id: 'Ofertas Gerais (Telegram)', name: 'Ofertas Gerais', platform: 'Telegram', members: '14.200 membros' },
    { id: 'Eletrônicos & Tech (WhatsApp)', name: 'Eletrônicos & Tech', platform: 'WhatsApp', members: '980 membros' },
    { id: 'Casa & Achadinhos (Telegram)', name: 'Casa & Achadinhos', platform: 'Telegram', members: '8.450 membros' },
    { id: 'Promo Tech (WhatsApp)', name: 'Promo Tech', platform: 'WhatsApp', members: '1.020 membros' },
  ];

  const handleConfirm = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishedDone(true);
      onConfirmPublish(
        offer,
        selectedChannel,
        mode === 'immediate' ? 'Agora' : scheduledTime
      );
      setTimeout(() => {
        setPublishedDone(false);
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publicar Oferta"
      subtitle="Envio inteligente para canais e grupos de afiliados"
      maxWidth="md"
    >
      <div className="space-y-4">
        {publishedDone ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#E6E8EC]">
              {mode === 'immediate'
                ? 'Publicação disparada com sucesso!'
                : `Oferta agendada para ${scheduledTime}!`}
            </h4>
            <p className="text-xs text-[#8E9BAE]">
              Acompanhe o engajamento na aba de Analytics.
            </p>
          </div>
        ) : (
          <>
            {/* Offer Summary */}
            <div className="p-3 bg-[#0A1020] border border-[#162340] rounded-lg flex items-center gap-3">
              <img
                src={offer.imageUrl}
                alt={offer.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#E6E8EC] truncate">
                  {offer.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#8E9BAE]">
                  <span className="font-mono-numeric font-medium text-[#E6E8EC]">
                    R$ {offer.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span>•</span>
                  <span className="text-[#00C2FF] font-medium">
                    Deal Score {offer.score.total}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Channel Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#E6E8EC]">
                Canal ou Grupo de Destino
              </label>
              <div className="grid grid-cols-1 gap-2">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      selectedChannel === ch.id
                        ? 'bg-[#152345] border-[#1E5EFF] text-[#E6E8EC]'
                        : 'bg-[#0A1020] border-[#162340] text-[#8E9BAE] hover:border-[#22355C]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Radio
                        className={`w-3.5 h-3.5 ${
                          selectedChannel === ch.id
                            ? 'text-[#00C2FF]'
                            : 'text-[#8E9BAE]'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-medium text-[#E6E8EC]">
                          {ch.name}
                        </div>
                        <div className="text-xs text-[#8E9BAE]">
                          {ch.platform} • {ch.members}
                        </div>
                      </div>
                    </div>
                    {selectedChannel === ch.id && (
                      <span className="w-2 h-2 rounded-full bg-[#00C2FF]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Publication Mode: Immediate vs Scheduled */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-[#E6E8EC]">
                Momento do Disparo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('immediate')}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    mode === 'immediate'
                      ? 'bg-[#152345] border-[#1E5EFF] text-[#E6E8EC]'
                      : 'bg-[#0A1020] border-[#162340] text-[#8E9BAE]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-[#00C2FF]" />
                  Disparo Imediato
                </button>

                <button
                  type="button"
                  onClick={() => setMode('schedule')}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                    mode === 'schedule'
                      ? 'bg-[#152345] border-[#1E5EFF] text-[#E6E8EC]'
                      : 'bg-[#0A1020] border-[#162340] text-[#8E9BAE]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-[#1E5EFF]" />
                  Agendar Horário
                </button>
              </div>

              {mode === 'schedule' && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs text-[#8E9BAE]">Horário sugerido:</span>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-[#0A1020] border border-[#1B2947] rounded-md px-2 py-1 text-xs text-[#E6E8EC] font-mono-numeric focus:outline-none focus:border-[#1E5EFF]"
                  />
                  <span className="text-xs text-[#8E9BAE]">
                    (Respeita intervalo anti-spam de 20 min)
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#162340]">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isPublishing}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isPublishing}
                onClick={handleConfirm}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {mode === 'immediate' ? 'Enviar Agora' : 'Adicionar à Fila'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

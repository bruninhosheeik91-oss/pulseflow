import React, { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProductOffer } from '../../types';

interface RejectOfferModalProps {
  offer: ProductOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReject: (offer: ProductOffer, reason: string) => void;
}

export const RejectOfferModal: React.FC<RejectOfferModalProps> = ({
  offer,
  isOpen,
  onClose,
  onConfirmReject,
}) => {
  const [reason, setReason] = useState('Score baixo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!offer) return null;

  const reasons = [
    'Score baixo',
    'Preço pouco atrativo',
    'Comissão baixa',
    'Produto inadequado para os canais',
    'Oferta duplicada',
    'Outro',
  ];

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmReject(offer, reason);
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rejeitar Oferta?"
      subtitle="A oferta sairá da esteira ativa e irá para o histórico de rejeitadas"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Product Box */}
        <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          <img
            src={offer.imageUrl}
            alt={offer.name}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-md object-cover border border-[#CBD5E1]"
          />
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-semibold text-[#172033] line-clamp-1">
              {offer.name}
            </h5>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
              <span>{offer.category}</span>
              <span>•</span>
              <span className="font-mono-numeric">Score: {offer.score.total}</span>
            </div>
          </div>
        </div>

        {/* Reason Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#172033]">
            Motivo da rejeição (opcional)
          </label>
          <div className="space-y-1.5">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium flex items-center justify-between transition-all ${
                  reason === r
                    ? 'bg-[#F8FAFC] border-rose-500/50 text-rose-700'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'
                }`}
              >
                <span>{r}</span>
                <div
                  className={`w-3.5 h-3.5 rounded-full border ${
                    reason === r
                      ? 'border-rose-500 bg-rose-500'
                      : 'border-[#93C5FD] bg-[#F8FAFC]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            loading={isSubmitting}
            leftIcon={<XCircle className="w-3.5 h-3.5" />}
            className="text-xs font-semibold bg-rose-600 hover:bg-rose-500"
          >
            Rejeitar oferta
          </Button>
        </div>
      </div>
    </Modal>
  );
};

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
        <div className="flex items-center gap-3 p-3 bg-[#0B1224] border border-[#162340] rounded-lg">
          <img
            src={offer.imageUrl}
            alt={offer.name}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-md object-cover border border-[#1A284A]"
          />
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-semibold text-[#E6E8EC] line-clamp-1">
              {offer.name}
            </h5>
            <div className="flex items-center gap-2 text-xs text-[#8E9BAE] mt-0.5">
              <span>{offer.category}</span>
              <span>•</span>
              <span className="font-mono-numeric">Score: {offer.score.total}</span>
            </div>
          </div>
        </div>

        {/* Reason Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#E6E8EC]">
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
                    ? 'bg-[#1D161B] border-rose-500/50 text-[#FCA5A5]'
                    : 'bg-[#0A1020] border-[#162340] text-[#8E9BAE] hover:border-[#22355C]'
                }`}
              >
                <span>{r}</span>
                <div
                  className={`w-3.5 h-3.5 rounded-full border ${
                    reason === r
                      ? 'border-rose-500 bg-rose-500'
                      : 'border-[#26375E] bg-[#0A1020]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#162340]">
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

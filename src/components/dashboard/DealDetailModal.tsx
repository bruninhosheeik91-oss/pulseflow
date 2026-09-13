import React, { useState } from 'react';
import {
  Star,
  Sparkles,
  TrendingDown,
  Zap,
  DollarSign,
  Copy,
  Check,
  Send,
  ExternalLink,
} from 'lucide-react';
import { ProductOffer } from '../../types';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { Button } from '../ui/Button';

interface DealDetailModalProps {
  offer: ProductOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onPublish: (offer: ProductOffer) => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
  offer,
  isOpen,
  onClose,
  onApprove,
  onPublish,
}) => {
  const [copied, setCopied] = useState(false);

  if (!offer) return null;

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const generatedPostCopy = `🔥 SUPER OFERTA DETECTADA!

${offer.name}
💥 De: ${formatBRL(offer.originalPrice)}
👉 Por apenas: ${formatBRL(offer.price)} (${offer.discountPercentage}% OFF!)

⭐ Avaliação: ${offer.rating} (${offer.reviewCount} avaliações)
📦 Mais de ${offer.salesVolume} pedidos entregues!
${offer.cupom ? `🏷️ Cupom exclusivo: ${offer.cupom}` : ''}

🛒 Compre com segurança no link:
${offer.linkAfiliado}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPostCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Análise Detalhada do Deal Score"
      subtitle="Avaliação algorítmica de potencial de conversão e rentabilidade"
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Product Overview Bar */}
        <div className="flex gap-4 p-4 bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl">
          <div className="w-16 h-16 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={offer.imageUrl}
              alt={offer.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <MarketplaceBadge marketplace={offer.marketplace} size="sm" />
              <span className="text-xs text-[#64748B]">{offer.category}</span>
              <span className="text-xs text-[#64748B]">• {offer.foundAt}</span>
            </div>
            <h4 className="text-sm font-semibold text-[#172033] mt-1 leading-snug">
              {offer.name}
            </h4>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-base font-bold font-mono-numeric text-[#172033]">
                {formatBRL(offer.price)}
              </span>
              <span className="text-xs text-emerald-700 font-mono-numeric font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                -{offer.discountPercentage}%
              </span>
              <span className="text-xs text-[#2563EB] font-mono-numeric font-semibold ml-auto">
                Comissão: {formatBRL(offer.commissionAmount)} ({offer.commissionPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Deal Score Breakdown Matrix */}
        <div className="bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center font-mono-numeric font-extrabold text-base w-9 h-9 rounded-lg bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/40">
                {offer.score.total}
              </div>
              <div>
                <span className="text-sm font-semibold text-[#172033]">
                  Deal Score: {offer.score.label}
                </span>
                <p className="text-xs text-[#64748B]">
                  Probabilidade de conversão calculada em 94,2%
                </p>
              </div>
            </div>

            <Badge variant="score-excellent">Recomendado para Disparo</Badge>
          </div>

          {/* 4 Score Pillars */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Queda de Preço */}
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-[#2563EB]" />
                  Queda de Preço Real
                </span>
                <span className="font-mono-numeric font-semibold text-[#172033]">
                  {offer.score.priceDropScore}/100
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 mt-2">
                <div
                  className="bg-[#2563EB] h-full rounded-full"
                  style={{ width: `${offer.score.priceDropScore}%` }}
                />
              </div>
              <span className="text-xs text-[#64748B] mt-1.5 block">
                Menor preço dos últimos 30 dias
              </span>
            </div>

            {/* Reputação */}
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-700" />
                  Qualidade da Loja
                </span>
                <span className="font-mono-numeric font-semibold text-[#172033]">
                  {offer.score.ratingScore}/100
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 mt-2">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: `${offer.score.ratingScore}%` }}
                />
              </div>
              <span className="text-xs text-[#64748B] mt-1.5 block">
                ★ {offer.rating} com {offer.reviewCount.toLocaleString('pt-BR')} avaliações
              </span>
            </div>

            {/* Velocidade de Vendas */}
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
                  Velocidade de Saída
                </span>
                <span className="font-mono-numeric font-semibold text-[#172033]">
                  {offer.score.salesVelocityScore}/100
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 mt-2">
                <div
                  className="bg-[#2563EB] h-full rounded-full"
                  style={{ width: `${offer.score.salesVelocityScore}%` }}
                />
              </div>
              <span className="text-xs text-[#64748B] mt-1.5 block">
                {offer.salesVolume} unidades vendidas recentemente
              </span>
            </div>

            {/* Rentabilidade de Margem */}
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  Margem de Comissão
                </span>
                <span className="font-mono-numeric font-semibold text-[#172033]">
                  {offer.score.marginScore}/100
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 mt-2">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${offer.score.marginScore}%` }}
                />
              </div>
              <span className="text-xs text-[#64748B] mt-1.5 block">
                {formatBRL(offer.commissionAmount)} líquidos por pedido
              </span>
            </div>
          </div>
        </div>

        {/* Copy Ready For Telegram / WhatsApp */}
        <div className="bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-2">
            <span className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              Texto Formatado para Publicação
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-[#2563EB] hover:text-[#3B82F6] flex items-center gap-1 transition-colors font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span className="text-emerald-700">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar mensagem</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-xs font-mono text-[#64748B] whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto bg-[#FFFFFF] p-3 rounded-lg border border-[#F1F5F9]">
            {generatedPostCopy}
          </pre>
        </div>

        {/* Footer Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <a
            href={offer.linkAfiliado}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#64748B] hover:text-[#172033] flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Testar link de afiliado
          </a>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
            {offer.status !== 'Aprovada' && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Check className="w-3.5 h-3.5 text-emerald-700" />}
                onClick={() => {
                  onApprove(offer.id);
                  onClose();
                }}
              >
                Aprovar Oferta
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={() => {
                onPublish(offer);
                onClose();
              }}
            >
              Publicar Agora
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

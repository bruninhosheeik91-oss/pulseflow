import React, { useState } from 'react';
import {
  Plus,
  Clock,
  Radio,
  Tag,
  Zap,
  Sparkles,
  Search,
  Check,
  Ticket,
} from 'lucide-react';
import {
  QueueItem,
  QueuePriority,
  ProductOffer,
  DistributionChannel,
  Marketplace,
} from '../../types';
import { initialOffers } from '../../data/mockData';
import { initialChannels } from '../../data/mockChannels';
import { formatMemberCount } from '../../types/whatsApp';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface QueueNewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToQueue: (newItem: QueueItem) => void;
}

export const QueueNewItemModal: React.FC<QueueNewItemModalProps> = ({
  isOpen,
  onClose,
  onAddToQueue,
}) => {
  const [selectedOfferId, setSelectedOfferId] = useState<string>(
    initialOffers[0]?.id || ''
  );
  const [useCustomProduct, setUseCustomProduct] = useState(false);

  // Custom product inputs
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customOriginalPrice, setCustomOriginalPrice] = useState('');
  const [customMarketplace, setCustomMarketplace] =
    useState<Marketplace>('Amazon');
  const [customAffiliateUrl, setCustomAffiliateUrl] = useState('');
  const [customCoupon, setCustomCoupon] = useState('');
  const [customImage, setCustomImage] = useState('');

  // Scheduling options
  const [scheduleType, setScheduleType] = useState<
    'auto_next' | 'immediate' | 'specific'
  >('auto_next');
  const [specificTime, setSpecificTime] = useState('');
  const [priority, setPriority] = useState<QueuePriority>('Normal');

  // Destination channel
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    initialChannels[0]?.id || ''
  );

  // Search in offers
  const [offerSearch, setOfferSearch] = useState('');

  const selectedOffer = initialOffers.find((o) => o.id === selectedOfferId);
  const selectedChannel = initialChannels.find((c) => c.id === selectedChannelId);

  const filteredOffers = initialOffers.filter(
    (o) =>
      o.name.toLowerCase().includes(offerSearch.toLowerCase()) ||
      o.category.toLowerCase().includes(offerSearch.toLowerCase()) ||
      o.marketplace.toLowerCase().includes(offerSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetChannel = selectedChannel || initialChannels[0] || null;

    if (!targetChannel) {
      return;
    }

    let computedTime = specificTime;
    let computedStatus: QueueItem['status'] = 'Agendado';
    let estimatedMinutes: number | undefined = undefined;

    if (scheduleType === 'immediate') {
      computedTime = 'Agora';
      computedStatus = 'Publicando';
      estimatedMinutes = 0;
    } else if (scheduleType === 'auto_next') {
      computedTime = 'Próximo slot';
      computedStatus = 'Em fila';
      estimatedMinutes = undefined;
    }

    let name = '';
    let price = 0;
    let originalPrice: number | undefined = undefined;
    let discount = 0;
    let image = '';
    let marketplace: Marketplace = 'Amazon';
    let dealScore: number | undefined = 0;
    let affiliateUrl = '';
    let coupon = '';
    let category = 'Geral';

    if (useCustomProduct) {
      name = customName || 'Produto personalizado';
      price = parseFloat(customPrice) || 0;
      originalPrice = customOriginalPrice ? parseFloat(customOriginalPrice) : undefined;
      discount = originalPrice
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
      image = customImage;
      marketplace = customMarketplace;
      dealScore = 0;
      affiliateUrl = customAffiliateUrl;
      coupon = customCoupon;
      category = 'Geral';
    } else if (selectedOffer) {
      name = selectedOffer.name;
      price = selectedOffer.price;
      originalPrice = selectedOffer.originalPrice;
      discount = selectedOffer.discountPercentage;
      image = selectedOffer.imageUrl;
      marketplace = selectedOffer.marketplace;
      dealScore = selectedOffer.score.total;
      affiliateUrl = selectedOffer.linkAfiliado;
      coupon = selectedOffer.cupom || '';
      category = selectedOffer.category;
    }

    const copy = `🚨 *OFERTA RECOMENDADA PULSE FLOW!* 🚨
*${name}*
${originalPrice ? `De ~R$ ${originalPrice.toFixed(2).replace('.', ',')}~ por ` : ''}*R$ ${price.toFixed(2).replace('.', ',')}* (${discount}% OFF)!

${coupon ? `🎟️ Use o cupom: *${coupon}*\n` : ''}📦 Aproveite enquanto durar o estoque!

👉 *Compre pelo link verificado:*
${affiliateUrl}`;

    const newItem: QueueItem = {
      id: `Q-${Date.now().toString().slice(-4)}`,
      time: computedTime,
      scheduledDate: 'Hoje',
      productName: name,
      productImage: image,
      price: price,
      originalPrice: originalPrice,
      discountPercentage: discount,
      channel: targetChannel.name,
      channelId: targetChannel.id,
      channelPlatform: targetChannel.platform,
      status: computedStatus,
      category: category,
      marketplace: marketplace,
      campaignName: 'Disparo Manual',
      dealScore: dealScore,
      coupon: coupon || undefined,
      affiliateUrl: affiliateUrl,
      customCopy: copy,
      priority: priority,
      estimatedInMinutes: estimatedMinutes,
    };

    onAddToQueue(newItem);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Nova Publicação à Fila"
      subtitle="Programe disparos manuais com cadência anti-flood para WhatsApp ou Telegram"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Source Toggle: Selecionar de Ofertas Aprovadas vs Produto Avulso */}
        <div className="flex items-center gap-2 p-1 bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg">
          <button
            type="button"
            onClick={() => setUseCustomProduct(false)}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
              !useCustomProduct
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#94A3B8] hover:text-[#172033]'
            }`}
          >
            Selecionar do Catálogo de Ofertas ({initialOffers.length})
          </button>
          <button
            type="button"
            onClick={() => setUseCustomProduct(true)}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
              useCustomProduct
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-[#94A3B8] hover:text-[#172033]'
            }`}
          >
            Cadastrar Produto Avulso
          </button>
        </div>

        {/* Catalog Selector */}
        {!useCustomProduct ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-[#CBD5E1]">
                Escolha a Oferta para Disparo
              </label>
              <span className="text-[11px] text-[#64748B]">
                Ordenado por maior Deal Score
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filtrar ofertas por título ou loja..."
                value={offerSearch}
                onChange={(e) => setOfferSearch(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Offer List */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-[#E2E8F0] rounded-lg p-1.5 bg-[#F8FAFC]">
              {filteredOffers.length === 0 && (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-center">
                  <Tag className="w-5 h-5 text-[#94A3B8]" />
                  <p className="text-[11px] text-[#64748B]">
                    Nenhuma oferta disponível no catálogo
                  </p>
                </div>
              )}
              {filteredOffers.slice(0, 7).map((off) => {
                const isSelected = off.id === selectedOfferId;
                return (
                  <div
                    key={off.id}
                    onClick={() => setSelectedOfferId(off.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                      isSelected
                        ? 'bg-[#E2E8F0] border-[#2563EB]'
                        : 'hover:bg-[#F1F5F9] border-transparent'
                    }`}
                  >
                    <img
                      src={off.imageUrl}
                      alt=""
                      className="w-9 h-9 rounded object-cover bg-[#E2E8F0] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#172033] truncate">
                        {off.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                        <span className="text-[#2563EB]">{off.marketplace}</span>
                        <span>&bull;</span>
                        <span className="font-semibold text-[#172033]">
                          R$ {off.price.toFixed(2).replace('.', ',')}
                        </span>
                        {off.discountPercentage && (
                          <span className="text-[#2563EB] font-bold">
                            -{off.discountPercentage}%
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center text-white shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Custom Product Inputs */
          <div className="space-y-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
            <div>
              <label className="block font-medium text-[#CBD5E1] mb-1">
                Título do Produto
              </label>
              <input
                type="text"
                placeholder="Ex: Teclado Sem Fio Mecânico Bluetooth"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-medium text-[#CBD5E1] mb-1">
                  Preço Oferta (R$)
                </label>
                <input
                  type="text"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#CBD5E1] mb-1">
                  Preço Original
                </label>
                <input
                  type="text"
                  value={customOriginalPrice}
                  onChange={(e) => setCustomOriginalPrice(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#CBD5E1] mb-1">
                  Marketplace
                </label>
                <select
                  value={customMarketplace}
                  onChange={(e) =>
                    setCustomMarketplace(e.target.value as Marketplace)
                  }
                  className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg px-2.5 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Amazon">Amazon</option>
                  <option value="Mercado Livre">Mercado Livre</option>
                  <option value="Shopee">Shopee</option>
                  <option value="AliExpress">AliExpress</option>
                  <option value="Magalu">Magalu</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-medium text-[#CBD5E1] mb-1">
                  Link de Afiliado
                </label>
                <input
                  type="url"
                  value={customAffiliateUrl}
                  onChange={(e) => setCustomAffiliateUrl(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#CBD5E1] mb-1">
                  Cupom de Desconto (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: PROMO15"
                  value={customCoupon}
                  onChange={(e) => setCustomCoupon(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Destination Channel Selector */}
        <div>
          <label className="block font-medium text-[#CBD5E1] mb-1.5">
            Canal ou Grupo de Destino
          </label>
          <select
            value={selectedChannelId}
            onChange={(e) => setSelectedChannelId(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
          >
            {initialChannels.length === 0 && (
              <option value="">Nenhum canal de destino configurado</option>
            )}
            {initialChannels.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.platform}] {c.name} ({formatMemberCount(c.membersCount)} membros)
              </option>
            ))}
          </select>
          {initialChannels.length === 0 && (
            <p className="text-[11px] text-amber-700/90 mt-1">
              Cadastre um canal em Canais e Grupos antes de adicionar à fila.
            </p>
          )}
        </div>

        {/* Scheduling Logic */}
        <div className="space-y-2">
          <label className="block font-medium text-[#CBD5E1]">
            Programação do Disparo
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setScheduleType('auto_next')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                scheduleType === 'auto_next'
                  ? 'bg-[#E2E8F0] border-[#2563EB] text-[#172033]'
                  : 'bg-[#F8FAFC] border-[#DCE3EC] text-[#94A3B8] hover:text-[#172033]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[#2563EB]">
                <Sparkles className="w-3.5 h-3.5" />
                Slot Inteligente
              </div>
              <p className="text-[10px] text-[#64748B] mt-1">
                Calcula o próximo intervalo seguro anti-ban (~15 min)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScheduleType('immediate')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                scheduleType === 'immediate'
                  ? 'bg-[#E2E8F0] border-[#2563EB] text-[#172033]'
                  : 'bg-[#F8FAFC] border-[#DCE3EC] text-[#94A3B8] hover:text-[#172033]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-700">
                <Zap className="w-3.5 h-3.5" />
                Disparo Imediato
              </div>
              <p className="text-[10px] text-[#64748B] mt-1">
                Envia instantaneamente para o canal conectado
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScheduleType('specific')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                scheduleType === 'specific'
                  ? 'bg-[#E2E8F0] border-[#2563EB] text-[#172033]'
                  : 'bg-[#F8FAFC] border-[#DCE3EC] text-[#94A3B8] hover:text-[#172033]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-[#172033]">
                <Clock className="w-3.5 h-3.5" />
                Horário Específico
              </div>
              <p className="text-[10px] text-[#64748B] mt-1">
                Define uma hora fixa da grade de postagens
              </p>
            </button>
          </div>

          {scheduleType === 'specific' && (
            <div className="pt-1 flex items-center gap-3">
              <input
                type="time"
                value={specificTime}
                onChange={(e) => setSpecificTime(e.target.value)}
                className="bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#2563EB]"
              />
              <span className="text-[11px] text-[#64748B]">
                Horário programado para hoje
              </span>
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-[#CBD5E1] mb-1">
              Prioridade na Fila
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as QueuePriority)}
              className="w-full bg-[#F8FAFC] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="Normal">Normal</option>
              <option value="Alta">Alta (Pula na frente de ofertas comuns)</option>
              <option value="Baixa">Baixa (Apenas se o canal estiver ocioso)</option>
            </select>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!selectedChannel && initialChannels.length === 0} className="shadow-lg shadow-[#2563EB]/15">
            Adicionar à Fila de Disparos
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import {
  X,
  Zap,
  Clock,
  Radio,
  Sliders,
  TrendingUp,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Play,
  Pause,
  Edit3,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { Campaign, CampaignDispatchedOffer } from '../../types';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';
import { Button } from '../ui/Button';

interface CampaignDetailDrawerProps {
  campaign: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (campaign: Campaign) => void;
  onRunNow: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
}

export const CampaignDetailDrawer: React.FC<CampaignDetailDrawerProps> = ({
  campaign,
  isOpen,
  onClose,
  onToggleStatus,
  onRunNow,
  onEdit,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'preview' | 'history'>('rules');

  if (!isOpen || !campaign) return null;

  const isRunning = campaign.status === 'Ativa';

  const copySampleText = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-[#FFFFFF] border-l border-[#E2E8F0] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono-numeric text-xs font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                {campaign.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isRunning
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {campaign.status}
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                  campaign.executionMode === 'Automático'
                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#E2E8F0]'
                    : 'bg-[#F1F5F9] text-[#94A3B8] border-[#CBD5E1]'
                }`}
              >
                {campaign.executionMode}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#172033] truncate">
              {campaign.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleStatus(campaign)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isRunning
                  ? 'bg-[#F1F5F9] border-[#DCE3EC] text-[#64748B] hover:text-amber-700 hover:border-amber-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Ativar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#EFF6FF] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 border-b border-[#E2E8F0] bg-[#F8FAFC] gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'rules'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Regras & Critérios
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            Modelo de Mensagem (Copy)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <span>Histórico de Disparos</span>
            <span className="font-mono-numeric text-[10px] px-1.5 py-0.2 rounded bg-[#F1F5F9] text-[#2563EB]">
              {campaign.recentDispatches.length}
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Performance Summary Strip */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Performance Consolidada
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Disparos
                </span>
                <span className="text-sm font-bold font-mono-numeric text-[#172033]">
                  {campaign.stats.dispatchesToday}
                  <span className="text-xs text-[#64748B] font-normal ml-1">
                    / {campaign.stats.dispatchesTotal}
                  </span>
                </span>
              </div>

              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Cliques Totais
                </span>
                <span className="text-sm font-bold font-mono-numeric text-[#2563EB]">
                  {campaign.stats.clicksTotal.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Taxa Conversão
                </span>
                <span className="text-sm font-bold font-mono-numeric text-[#3B82F6]">
                  {campaign.stats.conversionRate}%
                </span>
              </div>

              <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Comissão Total
                </span>
                <span className="text-sm font-bold font-mono-numeric text-emerald-700">
                  R$ {campaign.stats.commissionTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* TAB 1: Regras & Critérios */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Marketplaces */}
              <div className="p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl space-y-2">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                  Marketplaces Conectados
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {campaign.marketplaces.map((mp) => (
                    <MarketplaceBadge key={mp} marketplace={mp} size="sm" />
                  ))}
                </div>
              </div>

              {/* Categorias */}
              <div className="p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl space-y-2">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                  Categorias Filtradas
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {campaign.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#172033]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Parâmetros do Algoritmo */}
              <div className="p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl space-y-3">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                  Parâmetros de Aprovação do Deal Score
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[11px] text-[#64748B] block">
                      Deal Score Mínimo
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base font-bold font-mono-numeric text-[#2563EB]">
                        {campaign.minScore} pts
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD]">
                        {campaign.minScore >= 90 ? 'Excelente' : 'Muito Bom'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[11px] text-[#64748B] block">
                      Desconto Mínimo Exigido
                    </span>
                    <span className="text-base font-bold font-mono-numeric text-[#3B82F6] mt-1 block">
                      ≥ {campaign.minDiscount}% OFF
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[11px] text-[#64748B] block">
                      Faixa de Preço Válida
                    </span>
                    <span className="text-xs font-bold font-mono-numeric text-[#172033] mt-1 block">
                      {campaign.minPrice || campaign.maxPrice
                        ? `R$ ${campaign.minPrice || 0} até R$ ${campaign.maxPrice || 'Sem limite'}`
                        : 'Qualquer valor'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[11px] text-[#64748B] block">
                      Exigências Adicionais
                    </span>
                    <div className="text-xs text-[#334155] mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            campaign.requireFreeShipping
                              ? 'text-emerald-700'
                              : 'text-[#475569]'
                          }`}
                        />
                        <span>Frete grátis obrigatório</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            campaign.requireCoupon
                              ? 'text-emerald-700'
                              : 'text-[#475569]'
                          }`}
                        />
                        <span>Cupom de desconto ativo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Canais e Horários */}
              <div className="p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl space-y-3">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                  Distribuição & Anti-Spam
                </span>

                <div className="space-y-2">
                  <span className="text-[11px] text-[#64748B]">
                    Canais de Destino:
                  </span>
                  <div className="space-y-1.5">
                    {campaign.channels.length === 0 ? (
                      <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
                        Nenhum canal de destino configurado
                      </div>
                    ) : (
                      campaign.channels.map((ch) => (
                      <div
                        key={ch}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
                      >
                        <div className="flex items-center gap-2 text-[#172033]">
                          <Radio className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{ch}</span>
                        </div>
                        <span className="text-[10px] text-[#64748B] font-medium">
                          — 
                        </span>
                      </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block uppercase">
                      Intervalo Anti-Spam
                    </span>
                    <span className="text-xs font-bold text-[#172033] mt-0.5 block">
                      {campaign.frequencyLabel}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block uppercase">
                      Janela Ativa
                    </span>
                    <span className="text-xs font-bold text-[#172033] mt-0.5 block">
                      {campaign.activeHours.start} às {campaign.activeHours.end}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Preview da Mensagem (Copy) */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#172033]">
                    Template: {campaign.copyTemplate}
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    Simulação visual da mensagem formatada para envio no WhatsApp e Telegram.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copySampleText}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#93C5FD] bg-[#EFF6FF] text-[#2563EB] text-xs font-medium hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar modelo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Chat Message Box Mock */}
              <div className="max-w-md mx-auto p-4 bg-[#F8FAFC] border border-[#BFDBFE] rounded-2xl shadow-xl space-y-3">
                {/* Image Placeholder */}
                <div className="h-44 w-full bg-[#F8FAFC] rounded-xl overflow-hidden relative border border-[#E2E8F0] flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-[#45618F]" />
                </div>

                {/* Formatted Text */}
                <div className="text-xs text-[#172033] font-sans space-y-2 leading-relaxed bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <p className="font-bold text-[#FACC15]">
                    🚨 NOVA OPORTUNIDADE DETECTADA!
                  </p>
                  <p className="font-semibold text-[#172033]">
                    {campaign.name}
                  </p>
                  <p className="text-[#64748B]">
                    ❌ De: <span className="line-through">R$ {'{preço_anterior}'}</span>
                    <br />
                    🔥 <span className="text-emerald-700 font-bold text-sm">Por apenas R$ {'{preço}'}</span> ({'{desconto}'}% de desconto)
                  </p>
                  <p className="text-xs text-[#2563EB]">
                    ⭐ {'{avaliação}'} | {'{vendedor}'}
                    <br />
                    🚚 {'{frete}'}
                  </p>
                  <div className="pt-1">
                    <p className="text-[#64748B] text-[11px]">🛒 Link exclusivo de compra:</p>
                    <p className="text-[#2563EB] font-mono-numeric font-medium underline">
                      {'{link_afiliado}'}
                    </p>
                  </div>
                  <p className="text-[10px] text-[#64748B] pt-1">
                    ⚡ Mensagem preenchida automaticamente pelo Motor de Ofertas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Histórico de Disparos */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
                Últimos Disparos Desta Campanha
              </span>

              {campaign.recentDispatches.length === 0 ? (
                <div className="p-8 text-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl">
                  <Clock className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                  <p className="text-xs text-[#64748B]">
                    Nenhum disparo registrado ainda para esta campanha.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {campaign.recentDispatches.map((disp) => (
                    <div
                      key={disp.id}
                      className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={disp.productImage}
                          alt={disp.productName}
                          className="w-12 h-12 rounded-lg object-cover bg-[#F8FAFC] border border-[#E2E8F0] shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-[#172033] truncate">
                            {disp.productName}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B]">
                            <MarketplaceBadge marketplace={disp.marketplace} size="xs" />
                            <span>{disp.time}</span>
                            <span className="text-[#334155]">•</span>
                            <span className="text-[#2563EB] truncate">
                              {disp.channel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono-numeric text-xs font-bold text-emerald-700">
                          R$ {disp.commission.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#64748B] font-mono-numeric">
                          {disp.clicks} cliques ({disp.orders} vendas)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(campaign)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            className="text-xs border-[#DCE3EC] text-[#172033]"
          >
            Editar Parâmetros
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onRunNow(campaign)}
            leftIcon={<Zap className="w-3.5 h-3.5" />}
            className="text-xs font-semibold px-4"
          >
            Executar Varredura Agora
          </Button>
        </div>
      </div>
    </div>
  );
};

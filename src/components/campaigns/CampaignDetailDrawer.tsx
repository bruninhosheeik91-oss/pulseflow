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
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-[#070C18] border-l border-[#162340] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#14203B] bg-[#0A1020] flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono-numeric text-xs font-semibold px-2 py-0.5 rounded bg-[#101F3D] text-[#00C2FF] border border-[#1C3A6E]">
                {campaign.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isRunning
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
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
                    ? 'bg-[#0E203B] text-[#00C2FF] border-[#18366A]'
                    : 'bg-[#151D2E] text-[#94A3B8] border-[#1C2C47]'
                }`}
              >
                {campaign.executionMode}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#E6E8EC] truncate">
              {campaign.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleStatus(campaign)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isRunning
                  ? 'bg-[#0E1A33] border-[#182B4E] text-[#8E9BAE] hover:text-amber-400 hover:border-amber-500/30'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
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
              className="p-1.5 rounded-lg text-[#8E9BAE] hover:text-[#E6E8EC] hover:bg-[#121E38] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 border-b border-[#14203B] bg-[#080E1C] gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'rules'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-[#8E9BAE] hover:text-[#E6E8EC]'
            }`}
          >
            Regras & Critérios
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-[#8E9BAE] hover:text-[#E6E8EC]'
            }`}
          >
            Modelo de Mensagem (Copy)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#00C2FF] text-[#00C2FF]'
                : 'border-transparent text-[#8E9BAE] hover:text-[#E6E8EC]'
            }`}
          >
            <span>Histórico de Disparos</span>
            <span className="font-mono-numeric text-[10px] px-1.5 py-0.2 rounded bg-[#101A30] text-[#70A1FF]">
              {campaign.recentDispatches.length}
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Performance Summary Strip */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider">
              Performance Consolidada
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Disparos
                </span>
                <span className="text-sm font-bold font-mono-numeric text-[#E6E8EC]">
                  {campaign.stats.dispatchesToday}
                  <span className="text-xs text-[#64748B] font-normal ml-1">
                    / {campaign.stats.dispatchesTotal}
                  </span>
                </span>
              </div>

              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Cliques Totais
                </span>
                <span className="text-sm font-bold font-mono-numeric text-[#00C2FF]">
                  {campaign.stats.clicksTotal.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Taxa Conversão
                </span>
                <span className="text-sm font-bold font-mono-numeric text-[#38BDF8]">
                  {campaign.stats.conversionRate}%
                </span>
              </div>

              <div className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl text-center">
                <span className="text-[10px] text-[#64748B] uppercase block">
                  Comissão Total
                </span>
                <span className="text-sm font-bold font-mono-numeric text-emerald-400">
                  R$ {campaign.stats.commissionTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* TAB 1: Regras & Critérios */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Marketplaces */}
              <div className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-2">
                <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                  Marketplaces Conectados
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {campaign.marketplaces.map((mp) => (
                    <MarketplaceBadge key={mp} marketplace={mp} size="sm" />
                  ))}
                </div>
              </div>

              {/* Categorias */}
              <div className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-2">
                <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                  Categorias Filtradas
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {campaign.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-lg bg-[#101A30] border border-[#1A2D50] text-xs text-[#E6E8EC]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Parâmetros do Algoritmo */}
              <div className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-3">
                <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                  Parâmetros de Aprovação do Deal Score
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[11px] text-[#8E9BAE] block">
                      Deal Score Mínimo
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base font-bold font-mono-numeric text-[#00C2FF]">
                        {campaign.minScore} pts
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#101F3D] text-[#70A1FF] border border-[#1B3666]">
                        {campaign.minScore >= 90 ? 'Excelente' : 'Muito Bom'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[11px] text-[#8E9BAE] block">
                      Desconto Mínimo Exigido
                    </span>
                    <span className="text-base font-bold font-mono-numeric text-[#38BDF8] mt-1 block">
                      ≥ {campaign.minDiscount}% OFF
                    </span>
                  </div>

                  <div className="p-3 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[11px] text-[#8E9BAE] block">
                      Faixa de Preço Válida
                    </span>
                    <span className="text-xs font-bold font-mono-numeric text-[#E6E8EC] mt-1 block">
                      {campaign.minPrice || campaign.maxPrice
                        ? `R$ ${campaign.minPrice || 0} até R$ ${campaign.maxPrice || 'Sem limite'}`
                        : 'Qualquer valor'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[11px] text-[#8E9BAE] block">
                      Exigências Adicionais
                    </span>
                    <div className="text-xs text-[#C8D1DE] mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            campaign.requireFreeShipping
                              ? 'text-emerald-400'
                              : 'text-[#475569]'
                          }`}
                        />
                        <span>Frete grátis obrigatório</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            campaign.requireCoupon
                              ? 'text-emerald-400'
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
              <div className="p-4 bg-[#0B1324] border border-[#162340] rounded-xl space-y-3">
                <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                  Distribuição & Anti-Spam
                </span>

                <div className="space-y-2">
                  <span className="text-[11px] text-[#8E9BAE]">
                    Canais de Destino:
                  </span>
                  <div className="space-y-1.5">
                    {campaign.channels.length === 0 ? (
                      <div className="p-3 rounded-lg bg-[#080E1C] border border-[#14203B] text-xs text-[#8E9BAE]">
                        Nenhum canal de destino configurado
                      </div>
                    ) : (
                      campaign.channels.map((ch) => (
                      <div
                        key={ch}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#080E1C] border border-[#14203B] text-xs"
                      >
                        <div className="flex items-center gap-2 text-[#E6E8EC]">
                          <Radio className="w-3.5 h-3.5 text-[#00C2FF]" />
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
                  <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block uppercase">
                      Intervalo Anti-Spam
                    </span>
                    <span className="text-xs font-bold text-[#E6E8EC] mt-0.5 block">
                      {campaign.frequencyLabel}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#080E1C] border border-[#14203B] rounded-lg">
                    <span className="text-[10px] text-[#64748B] block uppercase">
                      Janela Ativa
                    </span>
                    <span className="text-xs font-bold text-[#E6E8EC] mt-0.5 block">
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
                  <h4 className="text-xs font-bold text-[#E6E8EC]">
                    Template: {campaign.copyTemplate}
                  </h4>
                  <p className="text-[11px] text-[#8E9BAE]">
                    Simulação visual da mensagem formatada para envio no WhatsApp e Telegram.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copySampleText}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#1E3A6E] bg-[#101F3D] text-[#00C2FF] text-xs font-medium hover:bg-[#162D59] transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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
              <div className="max-w-md mx-auto p-4 bg-[#0A1629] border border-[#162F59] rounded-2xl shadow-xl space-y-3">
                {/* Image Placeholder */}
                <div className="h-44 w-full bg-[#10203D] rounded-xl overflow-hidden relative border border-[#1C3666] flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-[#45618F]" />
                </div>

                {/* Formatted Text */}
                <div className="text-xs text-[#E6E8EC] font-sans space-y-2 leading-relaxed bg-[#07101E] p-3.5 rounded-xl border border-[#122342]">
                  <p className="font-bold text-[#FACC15]">
                    🚨 NOVA OPORTUNIDADE DETECTADA!
                  </p>
                  <p className="font-semibold text-white">
                    {campaign.name}
                  </p>
                  <p className="text-[#8E9BAE]">
                    ❌ De: <span className="line-through">R$ {'{preço_anterior}'}</span>
                    <br />
                    🔥 <span className="text-emerald-400 font-bold text-sm">Por apenas R$ {'{preço}'}</span> ({'{desconto}'}% de desconto)
                  </p>
                  <p className="text-xs text-[#00C2FF]">
                    ⭐ {'{avaliação}'} | {'{vendedor}'}
                    <br />
                    🚚 {'{frete}'}
                  </p>
                  <div className="pt-1">
                    <p className="text-[#8E9BAE] text-[11px]">🛒 Link exclusivo de compra:</p>
                    <p className="text-[#00C2FF] font-mono-numeric font-medium underline">
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
              <span className="text-xs font-semibold text-[#8E9BAE] uppercase tracking-wider block">
                Últimos Disparos Desta Campanha
              </span>

              {campaign.recentDispatches.length === 0 ? (
                <div className="p-8 text-center bg-[#0B1324] border border-[#162340] rounded-xl">
                  <Clock className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                  <p className="text-xs text-[#8E9BAE]">
                    Nenhum disparo registrado ainda para esta campanha.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {campaign.recentDispatches.map((disp) => (
                    <div
                      key={disp.id}
                      className="p-3 bg-[#0B1324] border border-[#162340] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={disp.productImage}
                          alt={disp.productName}
                          className="w-12 h-12 rounded-lg object-cover bg-[#080E1C] border border-[#162340] shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-[#E6E8EC] truncate">
                            {disp.productName}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8E9BAE]">
                            <MarketplaceBadge marketplace={disp.marketplace} size="xs" />
                            <span>{disp.time}</span>
                            <span className="text-[#334155]">•</span>
                            <span className="text-[#00C2FF] truncate">
                              {disp.channel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono-numeric text-xs font-bold text-emerald-400">
                          R$ {disp.commission.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#8E9BAE] font-mono-numeric">
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
        <div className="p-4 border-t border-[#14203B] bg-[#0A1020] flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(campaign)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            className="text-xs border-[#182747] text-[#E6E8EC]"
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

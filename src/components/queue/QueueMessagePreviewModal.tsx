import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Copy,
  Edit3,
  ExternalLink,
  Radio,
  Clock,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { QueueItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface QueueMessagePreviewModalProps {
  isOpen: boolean;
  item: QueueItem | null;
  onClose: () => void;
  onSaveCopy: (itemId: string, newCopy: string) => void;
  onDispatchNow: (item: QueueItem) => void;
}

export const QueueMessagePreviewModal: React.FC<QueueMessagePreviewModalProps> = ({
  isOpen,
  item,
  onClose,
  onSaveCopy,
  onDispatchNow,
}) => {
  if (!item) return null;

  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [platformView, setPlatformView] = useState<'WhatsApp' | 'Telegram'>(
    item.channelPlatform ||
      (item.channel.toLowerCase().includes('telegram')
        ? 'Telegram'
        : 'WhatsApp')
  );
  const [copyText, setCopyText] = useState(item.customCopy || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item) {
      setCopyText(item.customCopy || '');
      setPlatformView(
        item.channelPlatform ||
          (item.channel.toLowerCase().includes('telegram')
            ? 'Telegram'
            : 'WhatsApp')
      );
    }
  }, [item]);

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveCopy(item.id, copyText);
    setActiveTab('preview');
  };

  const handleInsertVariable = (variable: string) => {
    setCopyText((prev) => prev + ` ${variable}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pré-visualização e Edição de Mensagem"
      subtitle={`Canal de destino: ${item.channel} • Horário: ${item.time}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Top bar: Mode Toggle & Platform switcher */}
        <div className="flex items-center justify-between gap-3 border-b border-[#16233B] pb-3">
          {/* Tabs: Preview vs Edit */}
          <div className="flex items-center gap-1 bg-[#0A1020] p-1 rounded-lg border border-[#192747]">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'preview'
                  ? 'bg-[#1E5EFF] text-white font-medium shadow-xs'
                  : 'text-[#94A3B8] hover:text-[#E6E8EC]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Simulador de Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                activeTab === 'edit'
                  ? 'bg-[#1E5EFF] text-white font-medium shadow-xs'
                  : 'text-[#94A3B8] hover:text-[#E6E8EC]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Texto (Copy)</span>
            </button>
          </div>

          {/* Platform style toggle */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#8E9BAE] hidden sm:inline mr-1">
              Visualizar como:
            </span>
            <button
              type="button"
              onClick={() => setPlatformView('WhatsApp')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                platformView === 'WhatsApp'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-[#94A3B8] hover:text-white bg-[#0E1628]'
              }`}
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setPlatformView('Telegram')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                platformView === 'Telegram'
                  ? 'bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/30'
                  : 'text-[#94A3B8] hover:text-white bg-[#0E1628]'
              }`}
            >
              Telegram
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'preview' ? (
          <div className="space-y-3">
            {/* Chat Sandbox Container */}
            <div
              className={`rounded-xl p-4 sm:p-5 border transition-colors ${
                platformView === 'WhatsApp'
                  ? 'bg-[#0B141B] border-[#182C38]'
                  : 'bg-[#0E1726] border-[#182B46]'
              }`}
            >
              {/* Channel Header Banner */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      platformView === 'WhatsApp'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#00C2FF] text-white'
                    }`}
                  >
                    {item.channel.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white truncate max-w-[240px]">
                      {item.channel}
                    </p>
                    <p className="text-[10px] text-[#8E9BAE]">
                      {platformView === 'WhatsApp'
                        ? 'WhatsApp Business API • Criptografia ativa'
                        : 'Canal Telegram • @pulseflow_bot'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="flex items-center gap-1 text-[11px] text-[#8E9BAE] hover:text-white bg-white/5 px-2 py-1 rounded transition-colors"
                  title="Copiar texto da mensagem"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Chat Bubble */}
              <div
                className={`max-w-[420px] rounded-lg p-3 shadow-md text-xs space-y-2.5 ${
                  platformView === 'WhatsApp'
                    ? 'bg-[#1F2C34] text-[#E9EDEF] border border-[#2A3942]'
                    : 'bg-[#182538] text-[#E2E8F0] border border-[#203450]'
                }`}
              >
                {/* Product Image preview inside bubble */}
                {item.productImage && (
                  <div className="relative rounded-md overflow-hidden bg-black/40 max-h-56">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-44 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {item.discountPercentage && (
                      <span className="absolute top-2 right-2 bg-[#1E5EFF] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        -{item.discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                )}

                {/* Formatted Message text */}
                <div className="whitespace-pre-line leading-relaxed font-sans text-xs">
                  {copyText || (
                    <span className="text-slate-400 italic">
                      Mensagem padrão do sistema será gerada automaticamente com título, preço e link de afiliado.
                    </span>
                  )}
                </div>

                {/* Bottom timestamp in bubble */}
                <div className="flex items-center justify-end gap-1 text-[10px] text-white/50 pt-1">
                  <span>{item.time}</span>
                  {platformView === 'WhatsApp' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
                  ) : (
                    <Check className="w-3 h-3 text-white/60" />
                  )}
                </div>
              </div>
            </div>

            {/* Helper banner */}
            <div className="flex items-center justify-between text-xs text-[#8E9BAE] bg-[#0E1628] border border-[#1B2947] p-2.5 rounded-lg">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00C2FF]" />
                Horário de postagem: <strong className="text-white">{item.time}</strong> (com delay anti-ban ativo)
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="text-[#00C2FF] hover:underline flex items-center gap-1 font-medium"
              >
                <Edit3 className="w-3 h-3" />
                Personalizar copy
              </button>
            </div>
          </div>
        ) : (
          /* Edit Tab */
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Texto da Publicação (Copy / Legenda)
              </label>
              <textarea
                rows={9}
                value={copyText}
                onChange={(e) => setCopyText(e.target.value)}
                className="w-full bg-[#0A1020] border border-[#192747] rounded-lg p-3 text-xs text-[#E6E8EC] font-mono leading-relaxed focus:outline-none focus:border-[#1E5EFF] transition-colors resize-none"
                placeholder="Insira a mensagem com formatação..."
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#8E9BAE]">
                <span>Suporta formatação com *negrito*, ~riscado~ e links</span>
                <span className="font-mono-numeric">{copyText.length} caracteres</span>
              </div>
            </div>

            {/* Quick Variable Chips */}
            <div>
              <p className="text-[11px] text-[#8E9BAE] mb-1.5">
                Inserir atalho dinâmico:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleInsertVariable(item.coupon ? `Cupom: *${item.coupon}*` : '')}
                  className="px-2 py-1 bg-[#121E38] hover:bg-[#1A2B50] border border-[#1D325C] rounded text-[11px] text-[#00C2FF] transition-colors"
                >
                  + Cupom
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertVariable(`R$ ${item.price.toFixed(2)}`)}
                  className="px-2 py-1 bg-[#121E38] hover:bg-[#1A2B50] border border-[#1D325C] rounded text-[11px] text-white transition-colors"
                >
                  + Preço Atual
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertVariable(item.affiliateUrl || '')}
                  className="px-2 py-1 bg-[#121E38] hover:bg-[#1A2B50] border border-[#1D325C] rounded text-[11px] text-white transition-colors"
                >
                  + Link Afiliado
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertVariable('🔥 Menor Preço Histórico!')}
                  className="px-2 py-1 bg-[#121E38] hover:bg-[#1A2B50] border border-[#1D325C] rounded text-[11px] text-amber-400 transition-colors"
                >
                  + Gatilho Menor Preço
                </button>
              </div>
            </div>

            {/* Save Copy Action */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCopyText(item.customCopy || '');
                  setActiveTab('preview');
                }}
              >
                Descartar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                Salvar Texto na Fila
              </Button>
            </div>
          </div>
        )}

        {/* Footer Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#16233B]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>

          {item.status !== 'Publicado' && item.status !== 'Publicando' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onDispatchNow(item);
                onClose();
              }}
              className="flex items-center gap-1.5 shadow-lg shadow-[#1E5EFF]/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Disparar Agora</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

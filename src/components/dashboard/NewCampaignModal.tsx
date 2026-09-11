import React, { useState } from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCampaign?: (campaign: {
    name: string;
    minScore: number;
    frequency: string;
    selectedChannels: string[];
  }) => void;
}

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({
  isOpen,
  onClose,
  onSaveCampaign,
}) => {
  const [name, setName] = useState('');
  const [minScore, setMinScore] = useState(85);
  const [frequency, setFrequency] = useState('30m');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = () => {
    setIsSaved(true);
    if (onSaveCampaign) {
      onSaveCampaign({ name, minScore, frequency, selectedChannels });
    }
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Campanha de Automação"
      subtitle="Defina regras automáticas de captação e publicação de afiliados"
      maxWidth="md"
    >
      <div className="space-y-4">
        {isSaved ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#E6E8EC]">
              Campanha criada e ativada com sucesso!
            </h4>
            <p className="text-xs text-[#8E9BAE]">
              O Motor de Ofertas agora aplicará os filtros configurados.
            </p>
          </div>
        ) : (
          <>
            {/* Nome da Campanha */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#E6E8EC]">
                Nome da Campanha
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Achadinhos Shopee 50% OFF"
                className="w-full h-9 px-3 bg-[#0A1020] border border-[#1B2947] rounded-lg text-xs text-[#E6E8EC] placeholder:text-[#8E9BAE] focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            {/* Deal Score Threshold Slider */}
            <div className="space-y-1.5 p-3 bg-[#0A1020] border border-[#162340] rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#E6E8EC]">
                  Deal Score Mínimo
                </span>
                <span className="font-mono-numeric font-bold text-[#00C2FF] bg-[#121E38] px-2 py-0.5 rounded border border-[#1E3360]">
                  {minScore} pts ({minScore >= 90 ? 'Excelente' : minScore >= 80 ? 'Muito Bom' : 'Bom'})
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                step="1"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full h-1.5 bg-[#14203B] rounded-lg appearance-none cursor-pointer accent-[#1E5EFF]"
              />
              <p className="text-xs text-[#8E9BAE]">
                Apenas ofertas com pontuação igual ou superior serão aprovadas automaticamente para publicação.
              </p>
            </div>

            {/* Canais de Distribuição */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#E6E8EC]">
                Canais de Envio
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  'Telegram Ofertas Gerais',
                  'WhatsApp Tech',
                  'Telegram Casa & Cozinha',
                  'WhatsApp Achadinhos',
                ].map((ch) => {
                  const active = selectedChannels.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        active
                          ? 'bg-[#152345] border-[#1E5EFF] text-[#E6E8EC]'
                          : 'bg-[#0A1020] border-[#162340] text-[#8E9BAE] hover:border-[#22355C]'
                      }`}
                    >
                      <span className="truncate">{ch}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequência de Postagem */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#E6E8EC]">
                Intervalo entre disparos (Anti-Spam)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '20m', label: '20 minutos' },
                  { id: '30m', label: '30 minutos' },
                  { id: '60m', label: '1 hora' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFrequency(f.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium text-center transition-colors ${
                      frequency === f.id
                        ? 'bg-[#152345] border-[#1E5EFF] text-[#E6E8EC]'
                        : 'bg-[#0A1020] border-[#162340] text-[#8E9BAE]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#162340]">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Criar Campanha
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

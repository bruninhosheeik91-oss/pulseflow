import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Link,
  ShieldCheck,
  Eye,
  Save,
  Check,
  Smile,
  Zap,
} from 'lucide-react';
import { CopywritingSettings } from '../../types';
import { Button } from '../ui/Button';

interface SettingsCopywritingTabProps {
  settings: CopywritingSettings;
  onSave: (newSettings: CopywritingSettings) => void;
}

export const SettingsCopywritingTab: React.FC<SettingsCopywritingTabProps> = ({
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<CopywritingSettings>(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Intro */}
      <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="text-[#64748B]">
            Padronize a estrutura de texto, gatilhos de urgência e avisos legais que o PULSE FLOW aplica nas mensagens automáticas.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Estilo & Elementos Visuais */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <h4 className="font-bold text-[#172033] text-xs">
              Estilo Padrão & Elementos da Copy
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#64748B] text-[11px] block mb-1">
                Tom de Voz & Arquétipo da Copy:
              </label>
              <select
                value={formData.defaultCopyStyle}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultCopyStyle: e.target.value as any,
                  })
                }
                className="w-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Padrão com Emojis">Padrão com Emojis & Formatação Rica (Recomendado)</option>
                <option value="Minimalista Direto">Minimalista Direto (Sem emojis excessivos)</option>
                <option value="Urgência Relâmpago">Urgência Relâmpago (Foco em escassez e timer)</option>
                <option value="Achadinho Divertido">Achadinho Divertido (Linguagem informal Shopee/TikTok)</option>
              </select>
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includePriceComparison}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includePriceComparison: e.target.checked,
                    })
                  }
                  className="rounded border-[#DCE3EC] text-[#2563EB] focus:ring-0 bg-[#FFFFFF]"
                />
                <span className="text-[#172033]">
                  Incluir comparação de preço tachado (De ~R$ 599~ por *R$ 279*)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeInstallments}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeInstallments: e.target.checked,
                    })
                  }
                  className="rounded border-[#DCE3EC] text-[#2563EB] focus:ring-0 bg-[#FFFFFF]"
                />
                <span className="text-[#172033]">
                  Incluir destaque de parcelamento sem juros quando disponível
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeRatingStars}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeRatingStars: e.target.checked,
                    })
                  }
                  className="rounded border-[#DCE3EC] text-[#2563EB] focus:ring-0 bg-[#FFFFFF]"
                />
                <span className="text-[#172033]">
                  Incluir prova social (⭐ 4.9/5 estrelas e volume de vendas)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeCouponCallout}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeCouponCallout: e.target.checked,
                    })
                  }
                  className="rounded border-[#DCE3EC] text-[#2563EB] focus:ring-0 bg-[#FFFFFF]"
                />
                <span className="text-[#172033]">
                  Destacar cupom de desconto com instrução de resgate
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Encurtador & Aviso Legal */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
            <Link className="w-4 h-4 text-[#2563EB]" />
            <h4 className="font-bold text-[#172033] text-xs">
              Encurtador & Conformidade de Afiliado
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#64748B] text-[11px] block mb-1">
                Motor de Encurtamento de URL:
              </label>
              <select
                value={formData.urlShortener}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    urlShortener: e.target.value as any,
                  })
                }
                className="w-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Link Direto">Link Direto da Loja (amzn.to, s.shopee, mercadolivre)</option>
                <option value="Bitly">Bitly API (bit.ly/...)</option>
                <option value="TinyURL">TinyURL</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={formData.includeAffiliateDisclaimer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      includeAffiliateDisclaimer: e.target.checked,
                    })
                  }
                  className="rounded border-[#DCE3EC] text-[#2563EB] focus:ring-0 bg-[#FFFFFF]"
                />
                <span className="text-[#172033] font-medium">
                  Incluir Disclaimer Legal de Afiliado (Transparência Procon / FTC)
                </span>
              </label>

              <textarea
                rows={3}
                value={formData.disclaimerText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    disclaimerText: e.target.value,
                  })
                }
                disabled={!formData.includeAffiliateDisclaimer}
                className="w-full bg-[#FFFFFF] border border-[#DCE3EC] rounded-lg p-2.5 text-xs text-[#CBD5E1] focus:outline-none focus:border-[#2563EB] disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" className="flex items-center gap-2 shadow-md">
          <Save className="w-4 h-4" />
          <span>Salvar Preferências de Copywriting</span>
        </Button>
      </div>
    </form>
  );
};

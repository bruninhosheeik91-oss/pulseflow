import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Percent,
  Star,
  DollarSign,
  Save,
} from 'lucide-react';
import { ScoringWeightsSettings } from '../../types';
import { Button } from '../ui/Button';

interface SettingsScoringTabProps {
  settings: ScoringWeightsSettings;
  onSave: (newSettings: ScoringWeightsSettings) => void;
}

export const SettingsScoringTab: React.FC<SettingsScoringTabProps> = ({
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<ScoringWeightsSettings>(settings);

  const totalWeights =
    formData.weightDiscount +
    formData.weightRating +
    formData.weightSalesVelocity +
    formData.weightPriceHistory +
    formData.weightCommission;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Intro */}
      <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="text-[#64748B]">
            Defina como o algoritmo inteligente calcula a pontuação (0-100) de cada oferta encontrada pelos spiders e crawlers.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Pontuação de Corte & Desconto */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
            <Award className="w-4 h-4 text-amber-700" />
            <h4 className="font-bold text-white text-xs">
              Critérios de Corte & Aprovação
            </h4>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#64748B] text-[11px]">
                  Nota Mínima para Fila de Postagem Automática:
                </label>
                <span className="font-mono text-emerald-700 font-bold">
                  {formData.minScoreAutoApprove} / 100 pontos
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="98"
                step="1"
                value={formData.minScoreAutoApprove}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minScoreAutoApprove: parseInt(e.target.value),
                  })
                }
                className="w-full accent-emerald-400 bg-[#E2E8F0] rounded-lg h-2"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Ofertas abaixo deste índice ficam retidas para moderação manual ou descarte.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#64748B] text-[11px]">
                  Desconto Mínimo Obrigatório:
                </label>
                <span className="font-mono text-[#2563EB] font-bold">
                  {formData.minDiscountPercentage}% OFF
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                step="5"
                value={formData.minDiscountPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minDiscountPercentage: parseInt(e.target.value),
                  })
                }
                className="w-full accent-[#2563EB] bg-[#E2E8F0] rounded-lg h-2"
              />
            </div>

            {/* Hard filters */}
            <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rejectOutOfStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rejectOutOfStock: e.target.checked,
                    })
                  }
                  className="rounded border-[#DCE3EC] text-[#2563EB] focus:ring-0 bg-[#FFFFFF]"
                />
                <span className="text-white text-xs">
                  Rejeitar automaticamente ofertas sem estoque imediato
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireFreeShippingMinPrice > 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requireFreeShippingMinPrice: e.target.checked ? 79 : 0,
                    })
                  }
                  className="rounded border-[#DCE3EC] text-[#2563EB] focus:ring-0 bg-[#FFFFFF]"
                />
                <span className="text-white text-xs">
                  Priorizar produtos com frete grátis (acima de R$ 79)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Distribuição de Pesos do Algoritmo */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2563EB]" />
              <h4 className="font-bold text-white text-xs">
                Pesos do Algoritmo (Total: {totalWeights}%)
              </h4>
            </div>
            <span
              className={`text-[11px] font-mono font-bold ${
                totalWeights === 100 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {totalWeights === 100 ? '100% Equilibrado' : `${totalWeights}%`}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Desconto */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#64748B] text-[11px] flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-700" />
                  Magnitude do Desconto:
                </span>
                <span className="font-mono text-white font-bold">
                  {formData.weightDiscount}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={formData.weightDiscount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weightDiscount: parseInt(e.target.value),
                  })
                }
                className="w-full accent-emerald-400 bg-[#E2E8F0] rounded-lg h-2"
              />
            </div>

            {/* Avaliação */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#64748B] text-[11px] flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-700" />
                  Reputação & Estrelas (Mín. 4.0):
                </span>
                <span className="font-mono text-white font-bold">
                  {formData.weightRating}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={formData.weightRating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weightRating: parseInt(e.target.value),
                  })
                }
                className="w-full accent-amber-400 bg-[#E2E8F0] rounded-lg h-2"
              />
            </div>

            {/* Velocidade de Vendas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#64748B] text-[11px] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  Velocidade de Vendas / Mais Vendidos:
                </span>
                <span className="font-mono text-white font-bold">
                  {formData.weightSalesVelocity}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={formData.weightSalesVelocity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weightSalesVelocity: parseInt(e.target.value),
                  })
                }
                className="w-full accent-indigo-400 bg-[#E2E8F0] rounded-lg h-2"
              />
            </div>

            {/* Histórico do Preço */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#64748B] text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Menor Preço dos Últimos 60 Dias:
                </span>
                <span className="font-mono text-white font-bold">
                  {formData.weightPriceHistory}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={formData.weightPriceHistory}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weightPriceHistory: parseInt(e.target.value),
                  })
                }
                className="w-full accent-sky-400 bg-[#E2E8F0] rounded-lg h-2"
              />
            </div>

            {/* Comissão */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#64748B] text-[11px] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                  Taxa de Comissão Estimada:
                </span>
                <span className="font-mono text-white font-bold">
                  {formData.weightCommission}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={formData.weightCommission}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weightCommission: parseInt(e.target.value),
                  })
                }
                className="w-full accent-purple-400 bg-[#E2E8F0] rounded-lg h-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" className="flex items-center gap-2 shadow-md">
          <Save className="w-4 h-4" />
          <span>Salvar Calibração do Algoritmo</span>
        </Button>
      </div>
    </form>
  );
};

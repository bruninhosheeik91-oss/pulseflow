import React, { useState } from 'react';
import {
  Store,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Link,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { MarketplaceCredentials } from '../../types';
import { Button } from '../ui/Button';

interface SettingsMarketplacesTabProps {
  settings: MarketplaceCredentials;
  onSave: (newSettings: MarketplaceCredentials) => void;
}

export const SettingsMarketplacesTab: React.FC<SettingsMarketplacesTabProps> = ({
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<MarketplaceCredentials>(settings);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Introduction banner */}
      <div className="p-3.5 bg-[#0B1220] border border-[#16233B] rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-4 h-4 text-[#00C2FF] shrink-0" />
          <span className="text-[#8E9BAE]">
            Configure suas credenciais de afiliado oficial para geração automática de links monetizados com seus tags/IDs exclusivos.
          </span>
        </div>
      </div>

      {/* Grid of Marketplaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Amazon Associates */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#14203B] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9900]" />
              <h4 className="font-bold text-white text-xs">Amazon Associates</h4>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amazon.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amazon: { ...formData.amazon, enabled: e.target.checked },
                  })
                }
                className="rounded border-[#192747] text-[#1E5EFF] focus:ring-0 bg-[#0E1628]"
              />
              <span className="text-[11px] text-[#8E9BAE]">Ativo</span>
            </label>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Associate Store Tag (ex: domnex-20):
              </label>
              <input
                type="text"
                value={formData.amazon.associateTag}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amazon: { ...formData.amazon, associateTag: e.target.value },
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                PA-API Access Key ID:
              </label>
              <input
                type="text"
                value={formData.amazon.accessKeyId || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amazon: { ...formData.amazon, accessKeyId: e.target.value },
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF] font-mono"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                PA-API Secret Access Key:
              </label>
              <div className="relative">
                <input
                  type={showSecrets['amazon'] ? 'text' : 'password'}
                  value={formData.amazon.secretAccessKey || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amazon: { ...formData.amazon, secretAccessKey: e.target.value },
                    })
                  }
                  className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 pr-8 text-xs text-white focus:outline-none focus:border-[#1E5EFF] font-mono"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('amazon')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E9BAE] hover:text-white"
                >
                  {showSecrets['amazon'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Shopee Afiliados */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#14203B] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EE4D2D]" />
              <h4 className="font-bold text-white text-xs">Shopee Afiliados</h4>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.shopee.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shopee: { ...formData.shopee, enabled: e.target.checked },
                  })
                }
                className="rounded border-[#192747] text-[#1E5EFF] focus:ring-0 bg-[#0E1628]"
              />
              <span className="text-[11px] text-[#8E9BAE]">Ativo</span>
            </label>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                App ID Shopee Open Platform:
              </label>
              <input
                type="text"
                value={formData.shopee.appId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shopee: { ...formData.shopee, appId: e.target.value },
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF] font-mono"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Secret Key da API Shopee:
              </label>
              <div className="relative">
                <input
                  type={showSecrets['shopee'] ? 'text' : 'password'}
                  value={formData.shopee.secretKey}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shopee: { ...formData.shopee, secretKey: e.target.value },
                    })
                  }
                  className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 pr-8 text-xs text-white focus:outline-none focus:border-[#1E5EFF] font-mono"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('shopee')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E9BAE] hover:text-white"
                >
                  {showSecrets['shopee'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Domínio Curto Padrão:
              </label>
              <input
                type="text"
                value={formData.shopee.affiliateDomain}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shopee: { ...formData.shopee, affiliateDomain: e.target.value },
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>
          </div>
        </div>

        {/* 3. Mercado Livre Afiliados */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#14203B] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600]" />
              <h4 className="font-bold text-white text-xs">Mercado Livre Afiliados</h4>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.mercadoLivre.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mercadoLivre: { ...formData.mercadoLivre, enabled: e.target.checked },
                  })
                }
                className="rounded border-[#192747] text-[#1E5EFF] focus:ring-0 bg-[#0E1628]"
              />
              <span className="text-[11px] text-[#8E9BAE]">Ativo</span>
            </label>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Application ID (Mercado Livre Developers):
              </label>
              <input
                type="text"
                value={formData.mercadoLivre.appId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mercadoLivre: { ...formData.mercadoLivre, appId: e.target.value },
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF] font-mono"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Client Secret:
              </label>
              <div className="relative">
                <input
                  type={showSecrets['meli'] ? 'text' : 'password'}
                  value={formData.mercadoLivre.clientSecret}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mercadoLivre: { ...formData.mercadoLivre, clientSecret: e.target.value },
                    })
                  }
                  className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 pr-8 text-xs text-white focus:outline-none focus:border-[#1E5EFF] font-mono"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('meli')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E9BAE] hover:text-white"
                >
                  {showSecrets['meli'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. AliExpress & Magalu */}
        <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#14203B] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4747]" />
              <h4 className="font-bold text-white text-xs">AliExpress & Magalu</h4>
            </div>
            <span className="text-[11px] text-[#8E9BAE] font-medium">
              {formData.aliExpress.trackingId || formData.magalu.affiliateCode
                ? 'Configurado'
                : 'Pendente'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                AliExpress Tracking ID:
              </label>
              <input
                type="text"
                value={formData.aliExpress.trackingId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    aliExpress: { ...formData.aliExpress, trackingId: e.target.value },
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>

            <div>
              <label className="text-[#8E9BAE] text-[11px] block mb-1">
                Código Parceiro Magalu (Magazine Você):
              </label>
              <input
                type="text"
                value={formData.magalu.affiliateCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    magalu: { ...formData.magalu, affiliateCode: e.target.value },
                  })
                }
                className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global UTM Parameters */}
      <div className="p-4 bg-[#0A1020] border border-[#16233B] rounded-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-[#14203B] pb-2.5">
          <Link className="w-4 h-4 text-[#00C2FF]" />
          <h4 className="font-bold text-white text-xs">
            Parâmetros Globais de Rastreamento (UTM / Sub-IDs)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-[#8E9BAE] text-[11px] block mb-1">
              utm_source padrão:
            </label>
            <input
              type="text"
              value={formData.globalUtmSource}
              onChange={(e) =>
                setFormData({ ...formData, globalUtmSource: e.target.value })
              }
              className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
            />
          </div>

          <div>
            <label className="text-[#8E9BAE] text-[11px] block mb-1">
              utm_medium padrão:
            </label>
            <input
              type="text"
              value={formData.globalUtmMedium}
              onChange={(e) =>
                setFormData({ ...formData, globalUtmMedium: e.target.value })
              }
              className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
            />
          </div>

          <div>
            <label className="text-[#8E9BAE] text-[11px] block mb-1">
              utm_campaign padrão:
            </label>
            <input
              type="text"
              value={formData.globalUtmCampaign}
              onChange={(e) =>
                setFormData({ ...formData, globalUtmCampaign: e.target.value })
              }
              className="w-full bg-[#0E1628] border border-[#182642] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E5EFF]"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" className="flex items-center gap-2 shadow-md">
          <Save className="w-4 h-4" />
          <span>Salvar Credenciais de Afiliado</span>
        </Button>
      </div>
    </form>
  );
};

import React, { useMemo, useState } from 'react';
import { BadgePercent, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AFFILIATE_PROGRAMS, getAffiliateProgram } from './marketplaceRegistry';
import { MarketplaceCard } from './MarketplaceCard';
import { ShopeeConfigPanel } from './ShopeeConfigPanel';
import { useShopeeCredentials } from './useShopeeCredentials';
import { getCurrentTenantId } from '../../services/affiliatePrograms/affiliateProgramsService';

export const AffiliateProgramsPage: React.FC = () => {
  // Fonte de tenant: ainda não existe auth/sessão por cliente no frontend.
  // Em desenvolvimento, VITE_DEV_TENANT_ID habilita o teste real local das
  // credenciais Shopee (nunca em produção — ver getCurrentTenantId). Sem um
  // tenant confiável, a integração permanece desligada: não se inventa nem se
  // hardcoda tenant de produção.
  const tenantId = useMemo(() => getCurrentTenantId(), []);

  const [selected, setSelected] = useState<string | null>('shopee');

  // Única integração funcional nesta etapa: Shopee.
  const { view, loading, error: loadError, setView } = useShopeeCredentials(tenantId);

  const shopeeBadge = useMemo(() => {
    if (loading)
      return {
        label: 'Carregando…',
        className: 'bg-[#FFFFFF] text-[#64748B] border-[#DCE3EC]',
      };
    if (!view || !view.configured)
      return {
        label: 'Não configurado',
        className: 'bg-[#FFFFFF] text-[#64748B] border-[#DCE3EC]',
      };
    if (view.status === 'connected')
      return {
        label: 'Conectado',
        className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
      };
    if (view.status === 'error')
      return {
        label: 'Erro',
        className: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
      };
    return {
      label: 'Configurado',
      className: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30',
    };
  }, [loading, view]);

  const selectedProgram = getAffiliateProgram(selected);

  const handleSelect = (id: string) => {
    setSelected((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-5">
      {/* Introdução */}
      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0">
          <BadgePercent className="w-4.5 h-4.5 text-[#2563EB]" />
        </div>
        <div className="text-xs leading-relaxed">
          <p className="text-[#172033] font-semibold mb-0.5">
            Programas de Afiliados
          </p>
          <p className="text-[#64748B]">
            Cadastre as credenciais dos programas de afiliados conectados ao
            PULSE FLOW. As comissões e o gerenciamento de links são por cliente
            (tenant), isolados e cifrados no servidor.
          </p>
        </div>
      </div>

      {/* Sem fonte confiável de tenant no frontend */}
      {!tenantId && (
        <div className="p-4 bg-amber-500/[0.07] border border-amber-500/25 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="text-amber-700 font-semibold mb-0.5">
              Tenant não identificado
            </p>
            <p className="text-amber-700/70">
              A integração com o backend aguarda uma fonte confiável de tenant
              (autenticação/sessão por cliente) no frontend. Nenhuma credencial
              será salva ou testada até que essa etapa exista — não se inventa
              nem se hardcoda tenant de produção.
            </p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-700 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
          <span className="font-medium">{loadError}</span>
        </div>
      )}

      {/* Grid de marketplaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {AFFILIATE_PROGRAMS.map((program) => (
          <MarketplaceCard
            key={program.id}
            program={program}
            selected={selected === program.id}
            onSelect={handleSelect}
            statusBadge={program.id === 'shopee' ? shopeeBadge : null}
          />
        ))}
      </div>

      {/* Painel de configuração do marketplace selecionado */}
      {selectedProgram && selectedProgram.available && (
        <div>
          {selectedProgram.configKey === 'shopee' && (
            <ShopeeConfigPanel
              tenantId={tenantId}
              view={view}
              loading={loading}
              onViewChange={setView}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};
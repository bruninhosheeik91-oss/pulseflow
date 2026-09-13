import React from 'react';
import { Send, MousePointerClick, ShoppingBag, DollarSign } from 'lucide-react';
import { ProductPublicationRecord } from '../../types';
import { MarketplaceBadge } from '../ui/MarketplaceBadge';

interface PublicationHistorySectionProps {
  publications: ProductPublicationRecord[];
  productName: string;
}

export const PublicationHistorySection: React.FC<PublicationHistorySectionProps> = ({
  publications,
}) => {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#172033]">
            Histórico de Publicações
          </h4>
          <p className="text-[11px] text-[#64748B]">
            Registro de envios anteriores deste produto para seus canais de afiliados
          </p>
        </div>

        <span className="text-xs font-mono-numeric text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
          {publications.length}{' '}
          {publications.length === 1 ? 'publicação' : 'publicações'}
        </span>
      </div>

      {publications.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
          <div className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#DCE3EC] flex items-center justify-center mx-auto text-[#64748B] mb-2">
            <Send className="w-4 h-4 text-[#64748B]" />
          </div>
          <p className="text-xs font-medium text-[#172033]">
            Nenhuma publicação registrada
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Este produto ainda não foi enviado para nenhum canal ou grupo.
          </p>
        </div>
      ) : (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Marketplace</th>
                  <th className="py-2.5 px-3">Canal / Grupo</th>
                  <th className="py-2.5 px-3 text-right">Cliques</th>
                  <th className="py-2.5 px-3 text-right">Pedidos</th>
                  <th className="py-2.5 px-3 text-right">Comissão Gerada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFF6FF]">
                {publications.map((pub) => (
                  <tr key={pub.id} className="hover:bg-[#FFFFFF] transition-colors">
                    {/* Data / Hora */}
                    <td className="py-2.5 px-3 font-mono-numeric text-xs text-[#172033]">
                      <span>{pub.date}</span>
                      <span className="text-[10px] text-[#64748B] ml-1.5">
                        {pub.time}
                      </span>
                    </td>

                    {/* Marketplace */}
                    <td className="py-2.5 px-3">
                      <MarketplaceBadge
                        marketplace={pub.marketplace}
                        size="xs"
                      />
                    </td>

                    {/* Canal / Grupo */}
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-[#475569]">
                        {pub.channel}
                      </span>
                    </td>

                    {/* Cliques */}
                    <td className="py-2.5 px-3 text-right font-mono-numeric font-semibold text-[#172033]">
                      {pub.clicks.toLocaleString('pt-BR')}
                    </td>

                    {/* Pedidos */}
                    <td className="py-2.5 px-3 text-right font-mono-numeric font-semibold text-[#3B82F6]">
                      {pub.orders.toLocaleString('pt-BR')}
                    </td>

                    {/* Comissão */}
                    <td className="py-2.5 px-3 text-right font-mono-numeric font-bold text-emerald-700">
                      {formatCurrency(pub.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

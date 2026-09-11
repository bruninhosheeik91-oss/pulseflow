import React from 'react';
import {
  Clock,
  Eye,
  RotateCcw,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
} from 'lucide-react';
import { HistoryDispatchItem } from '../../types';

interface HistoryTableProps {
  items: HistoryDispatchItem[];
  onInspect: (item: HistoryDispatchItem) => void;
  onRetry: (item: HistoryDispatchItem) => void;
  onCopyLink: (link: string) => void;
  onDelete: (id: string) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  items,
  onInspect,
  onRetry,
  onCopyLink,
  onDelete,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-[#0E1628] border border-[#16233B] rounded-xl p-8 text-center">
        <Clock className="w-8 h-8 text-[#8E9BAE] mx-auto mb-3 opacity-60" />
        <h3 className="text-sm font-semibold text-white">Nenhum registro encontrado</h3>
        <p className="text-xs text-[#8E9BAE] mt-1 max-w-sm mx-auto">
          Não foram encontrados disparos com os filtros selecionados. Tente ajustar os parâmetros de busca ou período.
        </p>
      </div>
    );
  }

  const getMarketplaceBadge = (marketplace: string) => {
    switch (marketplace) {
      case 'Amazon':
        return 'bg-[#FF9900]/15 text-[#FFB84D] border-[#FF9900]/30';
      case 'Mercado Livre':
        return 'bg-[#FFE600]/15 text-[#FFE600] border-[#FFE600]/30';
      case 'Shopee':
        return 'bg-[#EE4D2D]/15 text-[#FF7A59] border-[#EE4D2D]/30';
      case 'AliExpress':
        return 'bg-[#FF4747]/15 text-[#FF7070] border-[#FF4747]/30';
      case 'Magalu':
        return 'bg-[#0086FF]/15 text-[#60A5FA] border-[#0086FF]/30';
      default:
        return 'bg-[#1E5EFF]/15 text-[#70A1FF] border-[#1E5EFF]/30';
    }
  };

  return (
    <div className="bg-[#0A1020] border border-[#16233B] rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#14203B] bg-[#070D1A] text-[#8E9BAE] font-medium">
              <th className="py-3 px-3.5">Disparo & Canal</th>
              <th className="py-3 px-3.5">Produto & Oferta</th>
              <th className="py-3 px-3">Loja</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-right">Cliques</th>
              <th className="py-3 px-3 text-right">Pedidos</th>
              <th className="py-3 px-3 text-right">Comissão</th>
              <th className="py-3 px-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#131D33]">
            {items.map((item) => {
              const isDelivered = item.status === 'Entregue';
              const isFailed = item.status === 'Falha';
              const isRetried = item.status === 'Re-enviado';

              return (
                <tr
                  key={item.id}
                  className="hover:bg-[#0E172C] transition-colors group"
                >
                  {/* 1. Disparo & Canal */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-white">
                        <Clock className="w-3 h-3 text-[#00C2FF]" />
                        <span>{item.dispatchedAt}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.channelPlatform === 'WhatsApp'
                              ? 'bg-emerald-400'
                              : 'bg-sky-400'
                          }`}
                        />
                        <span className="text-[11px] text-[#94A3B8] font-medium truncate max-w-[160px]" title={item.channel}>
                          {item.channel}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Produto & Oferta */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2.5 min-w-[220px] max-w-[340px]">
                      <img
                        src={item.productImage}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-[#14203B] shrink-0 border border-[#192747]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate group-hover:text-[#00C2FF] transition-colors" title={item.productName}>
                          {item.productName}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] mt-0.5">
                          <span className="font-mono-numeric font-bold text-white">
                            R$ {item.price.toFixed(2).replace('.', ',')}
                          </span>
                          {item.discountPercentage && (
                            <span className="text-[10px] font-bold text-[#00C2FF] bg-[#00C2FF]/10 px-1.5 py-0.2 rounded border border-[#00C2FF]/20">
                              -{item.discountPercentage}%
                            </span>
                          )}
                          {item.coupon && (
                            <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20">
                              {item.coupon}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 3. Loja */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${getMarketplaceBadge(
                        item.marketplace
                      )}`}
                    >
                      {item.marketplace}
                    </span>
                  </td>

                  {/* 4. Status */}
                  <td className="py-3 px-3 whitespace-nowrap text-center">
                    {isDelivered && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Entregue
                      </span>
                    )}
                    {isFailed && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 cursor-help"
                        title={item.errorMessage || 'Falha de entrega no webhook da instância'}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Falha
                      </span>
                    )}
                    {isRetried && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#00C2FF] bg-[#00C2FF]/10 px-2 py-0.5 rounded-full border border-[#00C2FF]/20">
                        <RotateCcw className="w-3 h-3" />
                        Re-enviado
                      </span>
                    )}
                  </td>

                  {/* 5. Cliques */}
                  <td className="py-3 px-3 text-right whitespace-nowrap font-mono-numeric font-medium text-white">
                    {item.clicks > 0 ? (
                      <span className="text-white font-semibold">{item.clicks.toLocaleString()}</span>
                    ) : (
                      <span className="text-[#64748B]">—</span>
                    )}
                  </td>

                  {/* 6. Pedidos */}
                  <td className="py-3 px-3 text-right whitespace-nowrap font-mono-numeric font-medium">
                    {item.orders > 0 ? (
                      <span className="text-indigo-300 font-bold">{item.orders}</span>
                    ) : (
                      <span className="text-[#64748B]">—</span>
                    )}
                  </td>

                  {/* 7. Comissão */}
                  <td className="py-3 px-3 text-right whitespace-nowrap font-mono-numeric font-bold text-emerald-400">
                    {item.commission > 0 ? (
                      `R$ ${item.commission.toFixed(2).replace('.', ',')}`
                    ) : (
                      <span className="text-[#64748B] font-normal">—</span>
                    )}
                  </td>

                  {/* 8. Ações */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Ver Mensagem */}
                      <button
                        type="button"
                        onClick={() => onInspect(item)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#152340] transition-colors"
                        title="Inspecionar mensagem e telemetria"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Re-enviar se falhou ou para repostar */}
                      <button
                        type="button"
                        onClick={() => onRetry(item)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isFailed
                            ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                            : 'text-[#94A3B8] hover:text-[#00C2FF] hover:bg-[#152340]'
                        }`}
                        title="Re-enviar disparo para o canal"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      {/* Copiar Link */}
                      <button
                        type="button"
                        onClick={() => onCopyLink(item.affiliateUrl)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#152340] transition-colors"
                        title="Copiar link de afiliado oficial"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir do Histórico */}
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remover registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

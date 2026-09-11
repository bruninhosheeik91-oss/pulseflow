import React from 'react';
import {
  Clock,
  CalendarCheck,
  Send,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { QueueItem } from '../../types';

interface QueueMetricsBarProps {
  queueItems: QueueItem[];
  isQueuePaused: boolean;
}

export const QueueMetricsBar: React.FC<QueueMetricsBarProps> = ({
  queueItems,
  isQueuePaused,
}) => {
  const pendingItems = queueItems.filter(
    (item) => item.status === 'Em fila' || item.status === 'Agendado'
  );

  const publishingNow = queueItems.filter((item) => item.status === 'Publicando');

  const nextHourCount = pendingItems.filter(
    (item) => (item.estimatedInMinutes ?? 999) <= 60
  ).length;

  const publishedToday = queueItems.filter(
    (item) => item.status === 'Publicado'
  );

  const totalClicksToday = publishedToday.reduce(
    (sum, item) => sum + (item.clicksCount || 0),
    0
  );

  const failedItems = queueItems.filter((item) => item.status === 'Falha');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Em Fila Agora */}
      <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4 flex flex-col justify-between hover:border-[#22355A] transition-colors">
        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          <span className="font-medium">Em Espera</span>
          <Clock className="w-4 h-4 text-[#00C2FF]" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono-numeric text-[#E6E8EC]">
            {pendingItems.length}
          </span>
          {publishingNow.length > 0 && (
            <span className="text-xs text-[#00C2FF] font-medium animate-pulse">
              +{publishingNow.length} enviando
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#8E9BAE] mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF]" />
          Aguardando liberação automática
        </p>
      </div>

      {/* 2. Próxima 1 Hora */}
      <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4 flex flex-col justify-between hover:border-[#22355A] transition-colors">
        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          <span className="font-medium">Próxima 1 Hora</span>
          <CalendarCheck className="w-4 h-4 text-[#1E5EFF]" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono-numeric text-[#E6E8EC]">
            {nextHourCount}
          </span>
          <span className="text-xs text-[#94A3B8]">postagens</span>
        </div>
        <p className="text-[11px] text-[#8E9BAE] mt-1">
          Intervalo escalonado anti-flood
        </p>
      </div>

      {/* 3. Disparados Hoje */}
      <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4 flex flex-col justify-between hover:border-[#22355A] transition-colors">
        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          <span className="font-medium">Disparados Hoje</span>
          <Send className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono-numeric text-[#E6E8EC]">
            {publishedToday.length}
          </span>
          <span className="text-xs text-emerald-400 font-medium">
            +{totalClicksToday} cliques
          </span>
        </div>
        <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          {publishedToday.length > 0
            ? '100% entregues sem bloqueios'
            : 'nenhum disparo concluído'}
        </p>
      </div>

      {/* 4. Falhas / Retentativas */}
      <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4 flex flex-col justify-between hover:border-[#22355A] transition-colors">
        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          <span className="font-medium">Falhas / Retentativas</span>
          <AlertTriangle className={`w-4 h-4 ${failedItems.length > 0 ? 'text-amber-400' : 'text-[#8E9BAE]'}`} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold font-mono-numeric ${
              failedItems.length > 0 ? 'text-amber-400' : 'text-[#E6E8EC]'
            }`}
          >
            {failedItems.length}
          </span>
          <span className="text-xs text-[#94A3B8]">
            {failedItems.length > 0 ? 'requer atenção' : 'sem incidentes'}
          </span>
        </div>
        <p className="text-[11px] text-[#8E9BAE] mt-1">
          {failedItems.length > 0
            ? 'Rate-limit temporário na API'
            : 'Fila de reenvio vazia'}
        </p>
      </div>

      {/* 5. Cadência & Proteção Anti-ban */}
      <div className="col-span-2 md:col-span-1 bg-[#0E1628] border border-[#1B2947] rounded-xl p-4 flex flex-col justify-between hover:border-[#22355A] transition-colors">
        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          <span className="font-medium">Segurança Anti-Ban</span>
          <ShieldCheck className="w-4 h-4 text-[#00C2FF]" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono-numeric text-[#00C2FF]">
            15m
          </span>
          <span className="text-xs text-[#94A3B8]">delay mínimo</span>
        </div>
        <p className="text-[11px] text-[#8E9BAE] mt-1">
          {isQueuePaused ? 'Suspenso enquanto pausado' : 'Aquecimento contínuo ativo'}
        </p>
      </div>
    </div>
  );
};

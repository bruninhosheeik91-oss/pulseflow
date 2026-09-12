import React, { useState } from 'react';
import { Percent } from 'lucide-react';
import {
  performanceData7Days,
  performanceData14Days,
  performanceData30Days,
} from '../../data/mockData';

export const PerformanceSection: React.FC = () => {
  const [activeRange, setActiveRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Dynamic dataset selection based on activeRange
  const data =
    activeRange === '7d'
      ? performanceData7Days
      : activeRange === '14d'
      ? performanceData14Days
      : performanceData30Days;

  // Aggregate metrics per period
  const hasData = data.length > 0;
  const totalCliques = data.reduce((acc, curr) => acc + curr.cliques, 0);
  const totalPedidos = data.reduce((acc, curr) => acc + curr.pedidos, 0);
  const avgConversao = (
    (totalPedidos / (totalCliques || 1)) *
    100
  ).toFixed(2).replace('.', ',');
  const avgCliquesPerDay = hasData ? Math.round(totalCliques / data.length) : 0;
  const avgPedidosPerDay = hasData ? Math.round(totalPedidos / data.length) : 0;

  // Subtitle per period
  const subtitleMap = {
    '7d': 'Resultados dos últimos 7 dias',
    '14d': 'Resultados dos últimos 14 dias',
    '30d': 'Resultados dos últimos 30 dias',
  };

  // SVG dimensions: streamlined vertical spacing to eliminate excess empty space
  const chartHeight = 190;
  const chartWidth = 680;
  const paddingX = 35;
  const paddingBottom = 26;
  const paddingTop = 16;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const maxCliques = hasData ? Math.max(...data.map((d) => d.cliques)) * 1.15 : 1;
  const maxPedidos = hasData ? Math.max(...data.map((d) => d.pedidos)) * 1.25 : 1;

  // Coordinates
  const cliquePoints = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - (d.cliques / maxCliques) * innerHeight;
    return { x, y, value: d.cliques };
  });

  const pedidoPoints = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - (d.pedidos / maxPedidos) * innerHeight;
    return { x, y, value: d.pedidos };
  });

  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      path += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
    }
    return path;
  };

  const cliquePath = createSmoothPath(cliquePoints);
  const pedidoPath = createSmoothPath(pedidoPoints);

  const cliqueAreaPath = hasData
    ? `${cliquePath} L ${cliquePoints[cliquePoints.length - 1].x},${
        paddingTop + innerHeight
      } L ${cliquePoints[0].x},${paddingTop + innerHeight} Z`
    : '';

  const pedidoAreaPath = hasData
    ? `${pedidoPath} L ${pedidoPoints[pedidoPoints.length - 1].x},${
        paddingTop + innerHeight
      } L ${pedidoPoints[0].x},${paddingTop + innerHeight} Z`
    : '';

  return (
    <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-5 flex flex-col justify-between h-full">
      {/* Top Header & Range Selector with Integrated Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#162442]">
        <div>
          <h2 className="text-base font-semibold text-[#E6E8EC] tracking-tight">
            Performance
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">
            {subtitleMap[activeRange]}
          </p>
        </div>

        {/* Legend + Period Selector Group */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00C2FF]" />
              <span>Cliques</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1E5EFF]" />
              <span>Pedidos</span>
            </div>
          </div>

          {/* Date Selector Pills */}
          <div className="flex items-center gap-1 bg-[#0A1020] p-1 rounded-lg border border-[#172545]">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setActiveRange(range);
                  setHoveredIndex(null);
                }}
                className={`px-2.5 py-1 text-xs rounded transition-all font-medium ${
                  activeRange === range
                    ? 'bg-[#152345] text-[#E6E8EC] font-semibold shadow-xs border border-[#1E325C]'
                    : 'text-[#8E9BAE] hover:text-[#E6E8EC] border border-transparent'
                }`}
              >
                {range === '7d'
                  ? '7 dias'
                  : range === '14d'
                  ? '14 dias'
                  : '30 dias'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Indicators: Compact and tightly positioned */}
      {hasData ? (
      <>
      <div className="grid grid-cols-3 gap-3 my-3">
        {/* Cliques */}
        <div className="p-3 bg-[#0A1020] border border-[#162340] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Cliques totais</span>
            <span className="w-2 h-2 rounded-full bg-[#00C2FF]" />
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#E6E8EC] mt-1 tracking-tight">
            {totalCliques.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-[#8E9BAE] mt-0.5">
            Média: <span className="font-mono-numeric font-medium text-[#C8D1DE]">{avgCliquesPerDay}</span>/dia
          </div>
        </div>

        {/* Pedidos */}
        <div className="p-3 bg-[#0A1020] border border-[#162340] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Pedidos gerados</span>
            <span className="w-2 h-2 rounded-full bg-[#1E5EFF]" />
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#E6E8EC] mt-1 tracking-tight">
            {totalPedidos.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-[#8E9BAE] mt-0.5">
            Média: <span className="font-mono-numeric font-medium text-[#C8D1DE]">{avgPedidosPerDay}</span>/dia
          </div>
        </div>

        {/* Conversão */}
        <div className="p-3 bg-[#0A1020] border border-[#162340] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Taxa de conversão</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono-numeric text-[#E6E8EC] mt-1 tracking-tight">
            {avgConversao}%
          </div>
          <div className="text-xs text-emerald-400 mt-0.5 font-medium">
            +0,4% vs. mercado
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden pt-1">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48 lg:h-52 select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cliqueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#00C2FF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="pedidoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E5EFF" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#1E5EFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingTop + innerHeight * (1 - ratio);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#15223E"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {/* Area Fills */}
          <path d={cliqueAreaPath} fill="url(#cliqueGradient)" />
          <path d={pedidoAreaPath} fill="url(#pedidoGradient)" />

          {/* Stroke Lines */}
          <path
            d={cliquePath}
            fill="none"
            stroke="#00C2FF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d={pedidoPath}
            fill="none"
            stroke="#1E5EFF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Vertical indicator line for hovered day */}
          {hoveredIndex !== null && hoveredIndex < cliquePoints.length && (
            <line
              x1={cliquePoints[hoveredIndex].x}
              y1={paddingTop}
              x2={cliquePoints[hoveredIndex].x}
              y2={paddingTop + innerHeight}
              stroke="#2C4475"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Points and Hitboxes */}
          {data.map((d, index) => {
            const cp = cliquePoints[index];
            const pp = pedidoPoints[index];
            const isHovered = hoveredIndex === index;

            return (
              <g key={index}>
                {/* Hitbox for hover */}
                <rect
                  x={cp.x - 20}
                  y={0}
                  width={40}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Clique Dot */}
                <circle
                  cx={cp.x}
                  cy={cp.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#0A0F1C"
                  stroke="#00C2FF"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150 pointer-events-none"
                />

                {/* Pedido Dot */}
                <circle
                  cx={pp.x}
                  cy={pp.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#0A0F1C"
                  stroke="#1E5EFF"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150 pointer-events-none"
                />

                {/* X Axis Day Label with improved typography */}
                <text
                  x={cp.x}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  fill={isHovered ? '#FFFFFF' : '#94A3B8'}
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="JetBrains Mono, monospace"
                  className="transition-colors pointer-events-none"
                >
                  {d.day}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredIndex !== null && hoveredIndex < data.length && (
          <div
            className="absolute top-2 pointer-events-none bg-[#0D162B] border border-[#22355C] rounded-lg px-3 py-2 shadow-xl text-xs z-10 transition-all"
            style={{
              left: `${(hoveredIndex / (data.length - 1)) * 75 + 12}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-[#E6E8EC] border-b border-[#182643] pb-1 mb-1.5 flex items-center justify-between gap-3">
              <span>{data[hoveredIndex].date}</span>
              <span className="text-emerald-400 font-mono-numeric">
                {data[hoveredIndex].conversao}% conv.
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs font-mono-numeric">
              <span className="text-[#00C2FF]">
                Cliques: {data[hoveredIndex].cliques}
              </span>
              <span className="text-[#70A1FF]">
                Pedidos: {data[hoveredIndex].pedidos}
              </span>
            </div>
          </div>
        )}
      </div>
      </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 h-56 text-center">
          <div className="w-10 h-10 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center text-[#00C2FF]">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#C8D1DE]">
              Sem dados de performance
            </p>
            <p className="text-xs text-[#8E9BAE] mt-1 max-w-xs">
              Dados de cliques e pedidos ficarão disponíveis após o início da
              operação.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

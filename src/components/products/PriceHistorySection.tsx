import React, { useState } from 'react';
import { TrendingDown, Calendar, ArrowUpRight } from 'lucide-react';
import { ProductPriceHistorySeries, Marketplace } from '../../types';

interface PriceHistorySectionProps {
  historySeries: ProductPriceHistorySeries[];
  productName: string;
}

export const PriceHistorySection: React.FC<PriceHistorySectionProps> = ({
  historySeries,
}) => {
  // If no series provided, provide default Geral
  const [selectedChannel, setSelectedChannel] = useState<string>('Geral');
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    price: number;
    x: number;
    y: number;
  } | null>(null);

  const activeSeries =
    historySeries.find((s) => s.marketplace === selectedChannel) ||
    historySeries[0] || {
      marketplace: 'Geral',
      minPrice: 0,
      currentPrice: 0,
      avg30Days: 0,
      points: [],
    };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Compute SVG chart metrics
  const points = activeSeries.points || [];
  const prices = points.map((p) => p.price);
  const minP = prices.length > 0 ? Math.min(...prices) * 0.95 : 0;
  const maxP = prices.length > 0 ? Math.max(...prices) * 1.05 : 100;
  const priceRange = maxP - minP || 1;

  const chartWidth = 500;
  const chartHeight = 140;
  const paddingX = 24;
  const paddingY = 20;

  const coordinates = points.map((p, index) => {
    const x =
      points.length === 1
        ? chartWidth / 2
        : paddingX +
          (index / (points.length - 1)) * (chartWidth - paddingX * 2);
    const y =
      chartHeight -
      paddingY -
      ((p.price - minP) / priceRange) * (chartHeight - paddingY * 2);
    return { x, y, date: p.date, price: p.price };
  });

  // SVG Path command
  const pathD = coordinates.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    // Slight smooth curve
    const prev = coordinates[idx - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  // Fill area path
  const areaD =
    coordinates.length > 0
      ? `${pathD} L ${coordinates[coordinates.length - 1].x} ${chartHeight} L ${coordinates[0].x} ${chartHeight} Z`
      : '';

  return (
    <div className="space-y-3">
      {/* Header with Title & Marketplace Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h4 className="text-sm font-bold text-[#E6E8EC] flex items-center gap-1.5">
            <span>Histórico de Preço</span>
            <span className="text-[11px] font-normal text-[#8E9BAE]">
              (últimos 30 dias)
            </span>
          </h4>
          <p className="text-[11px] text-[#8E9BAE]">
            Acompanhe a variação e oscilações do produto no mercado
          </p>
        </div>

        {/* Channels / Marketplaces Switcher */}
        {historySeries.length > 0 && (
          <div className="flex items-center gap-1 bg-[#080E1C] p-1 rounded-lg border border-[#162340] overflow-x-auto">
            {historySeries.map((series) => (
              <button
                key={series.marketplace}
                type="button"
                onClick={() => setSelectedChannel(series.marketplace)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedChannel === series.marketplace
                    ? 'bg-[#15254A] text-[#00C2FF] font-semibold border border-[#1E5EFF]/40'
                    : 'text-[#8E9BAE] hover:text-[#E6E8EC]'
                }`}
              >
                {series.marketplace}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3 Metric Summary Boxes */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-2.5 rounded-lg bg-[#080E1C] border border-[#162340]">
          <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
            Menor Preço
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold font-mono-numeric text-emerald-400">
              {formatCurrency(activeSeries.minPrice)}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#080E1C] border border-[#162340]">
          <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
            Preço Atual
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs font-bold font-mono-numeric text-[#00C2FF]">
              {formatCurrency(activeSeries.currentPrice)}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#080E1C] border border-[#162340]">
          <span className="text-[10px] uppercase font-bold text-[#8E9BAE] tracking-wider block">
            Média 30 Dias
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs font-bold font-mono-numeric text-[#C4CDD8]">
              {formatCurrency(activeSeries.avg30Days)}
            </span>
          </div>
        </div>
      </div>

      {/* Trajectory / Curve Chart */}
      <div className="p-3 rounded-xl bg-[#080E1C] border border-[#162340] relative">
        <div className="flex items-center justify-between text-[11px] text-[#8E9BAE] mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#00C2FF]" />
            <span>Variação diária</span>
          </span>
          {hoveredPoint ? (
            <span className="text-[#00C2FF] font-mono-numeric font-semibold">
              {hoveredPoint.date}: {formatCurrency(hoveredPoint.price)}
            </span>
          ) : (
            <span className="text-[#64748B]">Passe o mouse sobre os pontos</span>
          )}
        </div>

        <div className="w-full relative h-[140px] flex items-center justify-center">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id={`price-grad-${selectedChannel}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1E5EFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={chartWidth - paddingX}
              y2={paddingY}
              stroke="#162340"
              strokeDasharray="3 3"
            />
            <line
              x1={paddingX}
              y1={chartHeight / 2}
              x2={chartWidth - paddingX}
              y2={chartHeight / 2}
              stroke="#162340"
              strokeDasharray="3 3"
            />
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2={chartWidth - paddingX}
              y2={chartHeight - paddingY}
              stroke="#162340"
              strokeDasharray="3 3"
            />

            {/* Area Fill */}
            {areaD && (
              <path
                d={areaD}
                fill={`url(#price-grad-${selectedChannel})`}
                className="transition-all duration-300"
              />
            )}

            {/* Line Path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#00C2FF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points */}
            {coordinates.map((pt, idx) => (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  className="fill-[#080E1C] stroke-[#00C2FF] stroke-[2] hover:r-7 hover:fill-[#00C2FF] transition-all"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Date Labels below chart */}
        <div className="flex justify-between items-center text-[10px] text-[#64748B] font-mono-numeric mt-1 px-3">
          {coordinates.map((pt, idx) => (
            <span key={idx}>{pt.date}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

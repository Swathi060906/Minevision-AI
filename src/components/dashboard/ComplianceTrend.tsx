import React, { useState } from 'react';
import { TrendingUp, Target } from 'lucide-react';
import { COMPLIANCE_TREND_DATA } from '../../data/demo/analytics';

export const ComplianceTrend: React.FC = () => {
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  const data = COMPLIANCE_TREND_DATA;
  const minScore = 65;
  const maxScore = 100;
  const range = maxScore - minScore;

  // Chart dimensions in SVG viewBox coordinate space
  const width = 600;
  const height = 200;
  const paddingX = 45;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((item, index) => {
    const x = paddingX + (index / (data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - ((item.complianceScore - minScore) / range) * chartHeight;
    const targetY = paddingY + chartHeight - ((item.targetScore - minScore) / range) * chartHeight;
    return { ...item, x, y, targetY };
  });

  const pathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z`;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Compliance Trend
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-3 rounded-sm bg-amber-500 inline-block" />
            <span>Actual Score (%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="h-0.5 w-3 border-t border-dashed border-slate-400 inline-block" />
            <span>Statutory Target (85%)</span>
          </div>
        </div>
      </div>

      <div className="mt-4 relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 overflow-visible"
          aria-label="Compliance Trend Line Chart"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[70, 80, 90, 100].map((level) => {
            const y = paddingY + chartHeight - ((level - minScore) / range) * chartHeight;
            return (
              <g key={level}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="end"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#trendGradient)" />

          {/* Target line */}
          <line
            x1={paddingX}
            y1={paddingY + chartHeight - ((85 - minScore) / range) * chartHeight}
            x2={width - paddingX}
            y2={paddingY + chartHeight - ((85 - minScore) / range) * chartHeight}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Trend line */}
          <path
            d={pathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((pt, i) => (
            <g
              key={pt.month}
              className="cursor-pointer"
              onMouseEnter={() => setActiveHoverIndex(i)}
              onMouseLeave={() => setActiveHoverIndex(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={activeHoverIndex === i ? 6 : 4}
                fill="#f59e0b"
                stroke="#0f172a"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              <text
                x={pt.x}
                y={height - 8}
                fill="#cbd5e1"
                fontSize="11"
                fontWeight="500"
                textAnchor="middle"
              >
                {pt.month}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover / Active Month Highlight Box */}
        {activeHoverIndex !== null && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-1.5 text-xs">
            <span className="text-slate-300 font-medium">
              {data[activeHoverIndex].month} 2026 Audit Cycle:
            </span>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold">
                Compliance: {data[activeHoverIndex].complianceScore}%
              </span>
              <span className="text-slate-400">
                ({data[activeHoverIndex].inspectionsCount} inspections completed)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

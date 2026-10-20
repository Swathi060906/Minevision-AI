import React, { useState } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { HistoricalTrajectoryPoint, PredictionTrajectory } from '../../data/models/PredictiveIntelligence';

interface TrajectoryChartProps {
  points: HistoricalTrajectoryPoint[];
  trajectory: PredictionTrajectory;
  mineName: string;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({
  points,
  trajectory,
  mineName,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<HistoricalTrajectoryPoint | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 text-center text-slate-400">
        No trajectory observations recorded for this colliery.
      </div>
    );
  }

  // Chart layout dimensions
  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 35, bottom: 40, left: 45 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // X scale
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth / 2;

  // Y scale (0 to 100)
  const getY = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    return padding.top + innerHeight - (clamped / 100) * innerHeight;
  };

  const historicalPoints = points.filter((p) => !p.isProjected);
  const projectedPoints = points.filter((p) => p.isProjected);

  // Find index where projection starts
  const firstProjectedIndex = points.findIndex((p) => p.isProjected);
  const transitionIndex = firstProjectedIndex > 0 ? firstProjectedIndex - 1 : 0;

  // Build SVG path for historical observations
  const historicalPath = historicalPoints
    .map((p, i) => {
      const x = padding.left + i * stepX;
      const y = getY(p.score);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Build SVG path for projection (starts from last historical point)
  const projectionPath = points
    .slice(transitionIndex)
    .map((p, i) => {
      const realIndex = transitionIndex + i;
      const x = padding.left + realIndex * stepX;
      const y = getY(p.score);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Risk & Early Warning Trajectory ({mineName})
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full bg-amber-400 inline-block" />
            <span className="text-slate-300 font-medium">Historical Actuals</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 border-t-2 border-dashed border-rose-400 inline-block" />
            <span className="text-rose-400 font-medium">Advisory Projection</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-56 select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Horizontal Gridlines */}
          {[0, 25, 50, 75, 100].map((level) => {
            const y = getY(level);
            return (
              <g key={level}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray={level === 0 || level === 100 ? 'none' : '3 3'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Historical Path (Solid Amber) */}
          {historicalPoints.length > 1 && (
            <path
              d={historicalPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Projection Path (Dashed Rose) */}
          {projectedPoints.length > 0 && (
            <path
              d={projectionPath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {points.map((p, idx) => {
            const x = padding.left + idx * stepX;
            const y = getY(p.score);
            const isHovered = hoveredPoint?.date === p.date;

            return (
              <g
                key={`${p.date}-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {p.isProjected ? (
                  // Hollow Diamond for Projection
                  <polygon
                    points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`}
                    fill="#1e1b4b"
                    stroke="#f43f5e"
                    strokeWidth={isHovered ? '3' : '2'}
                  />
                ) : (
                  // Solid Circle for Historical
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 4}
                    fill="#f59e0b"
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                )}

                {/* Score label above point */}
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  className={`text-[10px] font-bold ${
                    p.isProjected ? 'fill-rose-400' : 'fill-amber-300'
                  }`}
                >
                  {p.score}
                </text>

                {/* X Axis Label */}
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px] font-medium"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div className="mt-2 text-center text-xs text-slate-300 bg-slate-950/80 rounded-lg p-2 border border-slate-800">
            <span className="font-bold text-white">
              {hoveredPoint.isProjected ? 'Advisory Projection' : 'Historical Audit'} ({hoveredPoint.label}):{' '}
            </span>
            <span className={hoveredPoint.isProjected ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
              Score {hoveredPoint.score}/100
            </span>
            {hoveredPoint.confidence && (
              <span className="ml-2 text-slate-400">
                (Confidence: <strong className="text-white">{hoveredPoint.confidence}</strong>)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic">
        <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span>
          Solid line represents verified historical observations. Dashed segments represent forward advisory projections grounded in sequential audit trends.
        </span>
      </div>
    </div>
  );
};

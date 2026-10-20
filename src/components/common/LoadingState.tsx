import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  type?: 'spinner' | 'tableSkeleton' | 'cardSkeleton';
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading compliance data...',
  type = 'spinner',
  rows = 4,
}) => {
  if (type === 'tableSkeleton') {
    return (
      <div className="w-full animate-pulse space-y-3 p-4">
        <div className="h-9 bg-slate-800/80 rounded-md w-full mb-4"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-800/60">
            <div className="h-4 bg-slate-800 rounded w-1/6"></div>
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/6"></div>
            <div className="h-4 bg-slate-800 rounded w-1/6"></div>
            <div className="h-4 bg-slate-800 rounded w-1/12"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'cardSkeleton') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-slate-800 rounded w-1/3"></div>
              <div className="h-7 w-7 rounded-lg bg-slate-800"></div>
            </div>
            <div className="h-7 bg-slate-800 rounded w-1/2"></div>
            <div className="h-3 bg-slate-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
      <p className="text-sm font-medium text-slate-300">{message}</p>
      <span className="text-xs text-slate-400 mt-1">Please wait while the records are being fetched</span>
    </div>
  );
};

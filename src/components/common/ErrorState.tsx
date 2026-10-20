import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message = 'Please try again. If the issue persists, contact the DGMS / MineVision technical support team.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-900/50 bg-rose-950/20 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-900/60 text-rose-300 mb-3 ring-8 ring-rose-900/20">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-200">{title}</h3>
      <p className="mt-1 text-sm text-slate-300 max-w-md">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-rose-900/80 px-4 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-800 border border-rose-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};

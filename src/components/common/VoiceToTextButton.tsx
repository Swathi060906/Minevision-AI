import React, { useState } from 'react';
import { Mic, MicOff, AlertCircle, Sparkles, Volume2 } from 'lucide-react';
import { useVoiceToText } from '../../hooks/useVoiceToText';

interface VoiceToTextButtonProps {
  onTranscript: (text: string) => void;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary' | 'compact';
  label?: string;
  disabled?: boolean;
  className?: string;
}

const SAMPLE_SAFETY_DICTATIONS = [
  'Observed loose hanging strata near roof bolt 42 along Main Dip Haulage Road. Scalers deployed immediately under CMR Reg 123.',
  'Auxiliary ventilation duct disconnected at Seam 3 face. Air velocity dropped below 0.5 meters per second.',
  'Water accumulation observed around coal face conveyor motor. Pump drainage activated to prevent electrical hazard.',
  'HEMM dumper haul road berm height reduced below 1.5 meters along curve. Immediate grading and berm reconstruction ordered.',
];

export const VoiceToTextButton: React.FC<VoiceToTextButtonProps> = ({
  onTranscript,
  size = 'md',
  variant = 'primary',
  label = 'Voice Dictation',
  disabled = false,
  className = '',
}) => {
  const [showSamples, setShowSamples] = useState(false);

  const {
    isListening,
    interimTranscript,
    isSupported,
    error,
    toggleListening,
    stopListening,
    clearError,
  } = useVoiceToText({
    continuous: true,
    lang: 'en-IN', // Defaults to Indian English for DGMS Coal Mining context
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        onTranscript(text.trim());
      }
    },
  });

  const handleSimulateSample = (sample: string) => {
    onTranscript(sample);
    setShowSamples(false);
  };

  const isCompact = variant === 'compact';

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        title={
          isListening
            ? 'Stop voice recording'
            : isSupported
            ? 'Dictate findings via microphone'
            : 'Web Speech API not supported in current browser'
        }
        className={`inline-flex items-center gap-2 rounded-lg font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
          isListening
            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse border border-rose-400'
            : variant === 'primary'
            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400/50'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        } ${
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isListening ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <MicOff className="h-3.5 w-3.5" />
            <span>{isCompact ? 'Listening...' : 'Listening (Click to Stop)'}</span>
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5 text-amber-400" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Fallback & Quick Simulation Helper Button */}
      <button
        type="button"
        onClick={() => setShowSamples(!showSamples)}
        title="Mine Safety Dictation Presets (Quick Test / Offline Simulation)"
        className="rounded-lg border border-slate-700/80 bg-slate-800/80 p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-700 transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
      </button>

      {/* Real-time Interim Speech Bubble Indicator */}
      {isListening && interimTranscript && (
        <div className="absolute left-0 bottom-full mb-2 z-30 w-72 rounded-lg border border-amber-500/40 bg-slate-900 p-2.5 text-xs shadow-xl text-amber-200">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 mb-1">
            <Volume2 className="h-3 w-3 animate-bounce" />
            <span>Transcribing Speech...</span>
          </div>
          <p className="italic text-slate-200 font-sans leading-relaxed">
            "{interimTranscript}"
          </p>
        </div>
      )}

      {/* Error Tooltip */}
      {error && (
        <div className="absolute left-0 top-full mt-2 z-30 w-72 rounded-lg border border-rose-800 bg-rose-950/95 p-2.5 text-xs shadow-xl text-rose-200">
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">{error}</p>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-rose-400 hover:text-white text-[10px] font-bold"
            >
              ✕
            </button>
          </div>
          {!isSupported && (
            <p className="mt-1.5 text-[10px] text-rose-300">
              Tip: Click the <Sparkles className="inline h-2.5 w-2.5 text-amber-400" /> icon to use sample safety findings.
            </p>
          )}
        </div>
      )}

      {/* Safety Dictation Sample Presets Popup */}
      {showSamples && (
        <div className="absolute right-0 top-full mt-2 z-40 w-80 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-white text-[11px] flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Field Dictation Presets
            </span>
            <button
              type="button"
              onClick={() => setShowSamples(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Select a pre-formatted statutory observation to insert directly into the report field:
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {SAMPLE_SAFETY_DICTATIONS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSimulateSample(sample)}
                className="w-full text-left p-2 rounded-lg bg-slate-800/70 hover:bg-amber-500/10 hover:border-amber-500/40 border border-slate-700/60 text-slate-200 text-[11px] transition-colors leading-relaxed"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

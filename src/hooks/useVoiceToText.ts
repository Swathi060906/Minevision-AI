import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseVoiceToTextOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  lang?: string;
  continuous?: boolean;
}

export interface UseVoiceToTextReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
  clearError: () => void;
}

export const useVoiceToText = (options: UseVoiceToTextOptions = {}): UseVoiceToTextReturn => {
  const { onTranscript, lang = 'en-US', continuous = true } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check Web Speech API availability
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, [isListening]);

  const startListening = useCallback(() => {
    setError(null);

    if (!isSupported) {
      setError(
        'Web Speech Recognition is not supported in this browser. You can use standard text entry or simulation.'
      );
      return;
    }

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!recognitionRef.current) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0]?.transcript || '';
            if (result.isFinal) {
              currentFinal += text;
            } else {
              currentInterim += text;
            }
          }

          if (currentInterim) {
            setInterimTranscript(currentInterim);
            if (onTranscriptRef.current) {
              onTranscriptRef.current(currentInterim, false);
            }
          }

          if (currentFinal) {
            setTranscript((prev) => (prev ? `${prev} ${currentFinal}` : currentFinal));
            setInterimTranscript('');
            if (onTranscriptRef.current) {
              onTranscriptRef.current(currentFinal, true);
            }
          }
        };

        recognition.onerror = (event: any) => {
          const errorType = event.error;
          if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
            setError('Microphone permission was denied. Please allow microphone access to dictate.');
          } else if (errorType === 'no-speech') {
            // Harmless timeout when idle
          } else if (errorType === 'audio-capture') {
            setError('No microphone was detected on this device.');
          } else if (errorType === 'network') {
            setError('Speech service network error. Please verify network connection.');
          } else {
            setError(`Speech recognition error: ${errorType}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
      }

      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      if (err.name === 'InvalidStateError') {
        // Recognition already started
        setIsListening(true);
      } else {
        setError(err.message || 'Unable to start speech recognition.');
        setIsListening(false);
      }
    }
  }, [continuous, isSupported, lang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    clearError,
  };
};

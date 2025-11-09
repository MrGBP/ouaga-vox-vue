import { useState, useCallback } from 'react';

interface VoiceSynthesisResult {
  speak: (text: string) => void;
  isSpeaking: boolean;
  cancel: () => void;
  isSupported: boolean;
}

export const useVoiceSynthesis = (): VoiceSynthesisResult => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(typeof window !== 'undefined' && 'speechSynthesis' in window);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    isSpeaking,
    cancel,
    isSupported,
  };
};

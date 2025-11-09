import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '@/hooks/useVoiceSynthesis';
import { useToast } from '@/hooks/use-toast';

interface VoiceSearchProps {
  onSearchQuery: (query: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const VoiceSearch = ({ onSearchQuery, searchQuery, onSearchQueryChange }: VoiceSearchProps) => {
  const { transcript, isListening, isSupported, startListening, stopListening, resetTranscript } = useVoiceRecognition();
  const { speak, isSpeaking, cancel, isSupported: isSpeechSupported } = useVoiceSynthesis();
  const { toast } = useToast();

  useEffect(() => {
    if (transcript && !isListening) {
      onSearchQueryChange(transcript);
      
      speak(`J'ai compris : ${transcript}. Je lance la recherche.`);
      
      setTimeout(() => {
        onSearchQuery(transcript);
      }, 2000);
      
      resetTranscript();
    }
  }, [transcript, isListening]);

  const handleVoiceToggle = () => {
    if (!isSupported) {
      toast({
        title: "Fonction non disponible",
        description: "La reconnaissance vocale n'est pas supportée par votre navigateur.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      speak("Je vous écoute. Dites-moi ce que vous cherchez.");
      setTimeout(() => {
        startListening();
      }, 1500);
    }
  };

  const handleSpeakToggle = () => {
    if (!isSpeechSupported) {
      toast({
        title: "Fonction non disponible",
        description: "La synthèse vocale n'est pas supportée par votre navigateur.",
        variant: "destructive",
      });
      return;
    }

    if (isSpeaking) {
      cancel();
    } else if (searchQuery) {
      speak(`Vous recherchez : ${searchQuery}`);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchQuery(searchQuery);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleManualSearch} className="flex flex-col gap-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Ex: Maison 3 pièces à Karpala..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pr-32 h-14 text-lg bg-card border-border shadow-soft"
          />
          <div className="absolute right-2 top-2 flex gap-2">
            <Button
              type="button"
              size="icon"
              variant={isSpeaking ? "destructive" : "secondary"}
              onClick={handleSpeakToggle}
              className="h-10 w-10"
            >
              {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant={isListening ? "destructive" : "default"}
              onClick={handleVoiceToggle}
              className="h-10 w-10"
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 text-primary"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Mic className="h-5 w-5" />
              </motion.div>
              <span className="text-sm font-medium">En écoute... Parlez maintenant</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" className="w-full h-12 text-lg">
          Rechercher
        </Button>
      </form>
    </div>
  );
};

export default VoiceSearch;

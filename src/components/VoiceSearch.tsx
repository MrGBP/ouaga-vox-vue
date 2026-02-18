import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Search } from 'lucide-react';
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
      speak(`J'ai entendu : ${transcript}. Lancement de la recherche.`);
      setTimeout(() => { onSearchQuery(transcript); }, 2500);
      resetTranscript();
    }
  }, [transcript, isListening]);

  const handleVoiceToggle = () => {
    if (!isSupported) {
      toast({ title: 'Non supporté', description: 'Reconnaissance vocale non disponible sur ce navigateur.', variant: 'destructive' });
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      speak('Je vous écoute. Dites le type de bien, le quartier ou votre budget.');
      setTimeout(() => startListening(), 1800);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) onSearchQuery(searchQuery);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center bg-card rounded-2xl shadow-warm border border-border overflow-hidden">
        {/* Search icon */}
        <div className="pl-4 shrink-0">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Maison 3 chambres à Ouaga 2000, 300 000 FCFA..."
          className="flex-1 bg-transparent px-4 py-4 text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {/* Voice buttons */}
        <div className="flex items-center gap-1 pr-2 shrink-0">
          {isSpeechSupported && (
            <button
              type="button"
              onClick={() => isSpeaking ? cancel() : searchQuery && speak(`Vous recherchez : ${searchQuery}`)}
              className={`p-2.5 rounded-xl transition-all ${isSpeaking ? 'bg-destructive/10 text-destructive' : 'hover:bg-muted text-muted-foreground'}`}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`p-2.5 rounded-xl transition-all relative ${isListening ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-destructive"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              </>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          <button
            type="submit"
            className="ml-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            Chercher
          </button>
        </div>
      </div>

      {/* Listening indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2 flex items-center justify-center gap-2 text-card"
          >
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-card rounded-full"
                  animate={{ height: ['8px', '20px', '8px'] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">En écoute…</span>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};

export default VoiceSearch;

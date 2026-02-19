import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, CheckCircle2, Lightbulb, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  quartier: string;
  bedrooms?: number;
  surface_area?: number;
  comfort_rating?: number;
  security_rating?: number;
}

interface AIProfileSectionProps {
  properties: Property[];
  onHighlightProperty?: (id: string) => void;
}

const PRIORITY_OPTIONS = [
  { key: 'budget', label: 'Budget serré', icon: '💰' },
  { key: 'securite', label: 'Sécurité', icon: '🔒' },
  { key: 'espace', label: 'Grand espace', icon: '📐' },
  { key: 'quartier', label: 'Bon quartier', icon: '📍' },
  { key: 'confort', label: 'Confort élevé', icon: '✨' },
  { key: 'transport', label: 'Proche transports', icon: '🚌' },
  { key: 'ecoles', label: 'Proche écoles', icon: '🏫' },
  { key: 'calme', label: 'Quartier calme', icon: '🌿' },
];

interface RecommendResult {
  understanding: string;
  criteria: { label: string; value: string }[];
  recommendations: { id: string; title: string; score: number; explanation: string }[];
  tip: string;
}

const AIProfileSection = ({ properties, onHighlightProperty }: AIProfileSectionProps) => {
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'priorities' | 'text'>('priorities');

  const togglePriority = (key: string) => {
    setSelectedPriorities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    const priorities = selectedPriorities.map(k => PRIORITY_OPTIONS.find(o => o.key === k)?.label || k);
    if (priorities.length === 0 && !freeText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-compare', {
        body: {
          properties: properties.filter(p => (p as any).available !== false),
          priorities,
          freeText: freeText.trim() || undefined,
          mode: 'recommend',
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Erreur IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Recommandation IA</h3>
            <p className="text-xs text-muted-foreground">Décrivez votre besoin, l'IA vous guide</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setMode('priorities')}
            className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all ${mode === 'priorities' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Priorités
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all ${mode === 'text' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Description libre
          </button>
        </div>

        {mode === 'priorities' ? (
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => togglePriority(opt.key)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  selectedPriorities.includes(opt.key)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <Textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Ex : Je cherche une maison 3 chambres à Ouaga 2000, budget max 350 000 FCFA, proche d'une école…"
            className="text-sm resize-none h-20"
          />
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading || (selectedPriorities.length === 0 && !freeText.trim())}
          className="w-full bg-primary text-primary-foreground gap-2"
          size="sm"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {loading ? 'Analyse en cours…' : 'Obtenir ma recommandation'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mx-5 mb-5 p-3 flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="px-5 pb-5 space-y-4">

            {/* Understanding */}
            {result.understanding && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">J'ai compris :</p>
                <p className="text-sm text-foreground">{result.understanding}</p>
              </div>
            )}

            {/* Criteria */}
            {result.criteria?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.criteria.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1">
                    <span className="font-semibold">{c.label}:</span> {c.value}
                  </Badge>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.map((rec, i) => (
              <button
                key={rec.id || i}
                onClick={() => rec.id && onHighlightProperty?.(rec.id)}
                className={`w-full text-left p-3 rounded-lg transition-all hover:shadow-sm ${
                  i === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>{i + 1}</span>
                  <span className="font-semibold text-sm text-foreground truncate flex-1">{rec.title}</span>
                  <Badge className={`text-xs px-1.5 py-0 ${
                    rec.score >= 80 ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'
                  }`}>
                    {rec.score}%
                  </Badge>
                </div>
                <div className="w-full h-1 bg-muted rounded-full mb-1.5">
                  <div className={`h-full rounded-full ${rec.score >= 80 ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${rec.score}%` }} />
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                  {rec.explanation}
                </p>
              </button>
            ))}

            {/* Tip */}
            {result.tip && (
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">{result.tip}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIProfileSection;

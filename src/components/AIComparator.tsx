import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart3, Loader2, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface AIComparatorProps {
  favorites: Property[];
  priorities: string[];
}

interface Ranking {
  id: string;
  title: string;
  score: number;
  reasons: string[];
}

interface CompareResult {
  rankings: Ranking[];
  summary: string;
}

const AIComparator = ({ favorites, priorities }: AIComparatorProps) => {
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (favorites.length < 2) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-compare', {
        body: { properties: favorites, priorities, mode: 'compare' },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la comparaison');
    } finally {
      setLoading(false);
    }
  };

  if (favorites.length < 2) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <Sparkles className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Ajoutez au moins <strong>2 favoris</strong> pour utiliser le comparateur IA
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Comparateur IA</h3>
            <p className="text-xs text-muted-foreground">{favorites.length} bien{favorites.length > 1 ? 's' : ''} en favoris</p>
          </div>
        </div>
        <Button
          onClick={handleCompare}
          disabled={loading}
          size="sm"
          className="bg-primary text-primary-foreground gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Analyse…' : 'Comparer'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-4 flex items-center gap-2 text-sm text-destructive bg-destructive/5"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 space-y-4"
          >
            {/* Rankings */}
            {result.rankings?.map((r, i) => (
              <div key={r.id} className={`flex items-start gap-3 p-3 rounded-lg ${i === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground truncate">{r.title}</span>
                    <Badge className={`text-xs px-1.5 py-0 ${
                      r.score >= 80 ? 'bg-accent text-accent-foreground' : r.score >= 60 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {r.score}%
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-muted rounded-full mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${r.score >= 80 ? 'bg-accent' : r.score >= 60 ? 'bg-primary' : 'bg-muted-foreground'}`}
                      style={{ width: `${r.score}%` }}
                    />
                  </div>
                  <div className="space-y-0.5">
                    {r.reasons?.slice(0, 2).map((reason, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            {result.summary && (
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed">{result.summary}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIComparator;

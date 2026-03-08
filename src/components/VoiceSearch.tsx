import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VoiceSearchProps {
  onSearchQuery: (query: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  /** Detected tags from fuzzy search */
  detectedTags?: ParsedTag[];
  onRemoveTag?: (tag: ParsedTag) => void;
}

export interface ParsedTag {
  kind: 'type' | 'quartier' | 'prix';
  label: string;
  value: string;
  emoji: string;
}

// ── Fuzzy matching helpers ──────────────────────────────────────────────────

/** Simple Levenshtein distance */
const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

/** Returns true if candidate fuzzy-matches target (tolerance based on word length) */
const fuzzyMatch = (input: string, target: string): boolean => {
  const a = input.toLowerCase().trim();
  const b = target.toLowerCase().trim();
  if (b.includes(a) || a.includes(b)) return true;
  const maxDist = a.length <= 3 ? 1 : a.length <= 6 ? 2 : 3;
  return levenshtein(a, b) <= maxDist;
};

// ── Known vocabulary ────────────────────────────────────────────────────────

const TYPE_ALIASES: Record<string, string[]> = {
  maison:      ['maison', 'maisons', 'maison meublée', 'maison meublee'],
  villa:       ['villa', 'villas', 'villa meublée', 'villa meublee'],
  appartement: ['appartement', 'appt', 'appart', 'appartements', 'appartement meublé', 'appartement meuble'],
  studio:      ['studio', 'studios', 'studio meublé', 'studio meuble'],
  bureau:      ['bureau', 'bureaux', 'buraux', 'bureu'],
  commerce:    ['commerce', 'commerces', 'local commercial', 'local'],
};

const TYPE_EMOJI: Record<string, string> = {
  maison: '🏠', villa: '🏡', appartement: '🏬', studio: '🛏️', bureau: '🏢', commerce: '🏪',
};

const QUARTIER_NAMES = [
  'Ouaga 2000', 'Zone du Bois', 'Koulouba', 'Tampouy', "Patte d'Oie",
  'Dassasgho', 'Zogona', 'Wemtenga', 'Pissy', 'Gounghin', 'Somgandé', 'Tanghin',
];

/** Parse a free-text query into structured tags */
export const parseSearchQuery = (query: string): { tags: ParsedTag[]; remaining: string } => {
  const tags: ParsedTag[] = [];
  let remaining = query;

  // 1. Detect price patterns: "200 000", "200000", "500k", "200K FCFA"
  const pricePatterns = [
    /(\d{1,3})\s*[kK]/g,                           // 500k
    /(\d{1,3}(?:\s?\d{3})+)\s*(?:FCFA|fcfa)?/g,    // 200 000 or 200000
    /(\d{4,})\s*(?:FCFA|fcfa)?/g,                   // 200000
  ];
  for (const pattern of pricePatterns) {
    const match = pattern.exec(remaining);
    if (match) {
      let amount: number;
      const raw = match[1].replace(/\s/g, '');
      if (match[0].toLowerCase().includes('k')) {
        amount = parseInt(raw) * 1000;
      } else {
        amount = parseInt(raw);
      }
      if (amount >= 10000 && amount <= 10000000) {
        tags.push({ kind: 'prix', label: `≤ ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`, value: String(amount), emoji: '💰' });
        remaining = remaining.replace(match[0], '').trim();
        break; // Only one price
      }
    }
  }

  // 2. Detect quartier (fuzzy)
  const words = remaining.split(/\s+/);
  for (const qName of QUARTIER_NAMES) {
    const qWords = qName.toLowerCase().split(/\s+/);
    // Try matching 1 or 2 consecutive words
    for (let i = 0; i < words.length; i++) {
      const w1 = words[i];
      const w2 = i + 1 < words.length ? `${words[i]} ${words[i + 1]}` : '';
      const w3 = i + 2 < words.length ? `${words[i]} ${words[i + 1]} ${words[i + 2]}` : '';

      if (fuzzyMatch(w3, qName) || fuzzyMatch(w2, qName) || qWords.some(qw => fuzzyMatch(w1, qw) && w1.length >= 4)) {
        tags.push({ kind: 'quartier', label: qName, value: qName, emoji: '📍' });
        // Remove matched words
        if (fuzzyMatch(w3, qName)) { words.splice(i, 3); }
        else if (fuzzyMatch(w2, qName)) { words.splice(i, 2); }
        else { words.splice(i, 1); }
        remaining = words.join(' ');
        break;
      }
    }
    if (tags.some(t => t.kind === 'quartier')) break;
  }

  // 3. Detect type (fuzzy)
  const remainingLower = remaining.toLowerCase();
  for (const [typeKey, aliases] of Object.entries(TYPE_ALIASES)) {
    for (const alias of aliases) {
      // Check if any word or consecutive words match
      if (aliases.some(a => remainingLower.includes(a)) || words.some(w => fuzzyMatch(w.toLowerCase(), alias))) {
        const typeLabel = typeKey === 'maison' ? 'Maison' : typeKey === 'villa' ? 'Villa' : typeKey === 'appartement' ? 'Appartement' : typeKey === 'studio' ? 'Studio' : typeKey === 'bureau' ? 'Bureau' : 'Commerce';
        if (!tags.some(t => t.kind === 'type')) {
          tags.push({ kind: 'type', label: typeLabel, value: typeKey, emoji: TYPE_EMOJI[typeKey] });
        }
        break;
      }
    }
    if (tags.some(t => t.kind === 'type')) break;
  }

  // Remove "pas cher", "meublé", "meublée", "fcfa" from remaining
  remaining = remaining.replace(/pas\s+cher/gi, '').replace(/meubl[ée]e?s?/gi, '').replace(/fcfa/gi, '').trim();

  return { tags, remaining };
};

const VoiceSearch = ({ onSearchQuery, searchQuery, onSearchQueryChange, detectedTags = [], onRemoveTag }: VoiceSearchProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) onSearchQuery(searchQuery);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
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
            placeholder="Quoi, Où et à quel prix pour votre bien ?"
            className="flex-1 bg-transparent px-4 py-4 text-sm md:text-base text-foreground placeholder:text-muted-foreground placeholder:italic focus:outline-none"
          />

          <button
            type="submit"
            className="mr-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-[0.97]"
          >
            Chercher
          </button>
        </div>
      </form>

      {/* Detected tags */}
      <AnimatePresence>
        {detectedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-wrap gap-1.5 mt-2"
          >
            {detectedTags.map((tag, i) => (
              <Badge
                key={`${tag.kind}-${i}`}
                className="bg-card border border-border text-foreground gap-1 px-2.5 py-1 text-xs cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onRemoveTag?.(tag)}
              >
                <span>{tag.emoji}</span>
                <span>{tag.label}</span>
                <X className="h-3 w-3 text-muted-foreground ml-0.5" />
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSearch;

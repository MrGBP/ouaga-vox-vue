// ── Trust system (Lot 3) ──────────────────────────────────────────────────
// Computes a trust level for property owners/agents based on simple signals.
// Pure logic — no I/O. Used to render a badge on PropertyDetailPanel.

export type TrustLevel = 'new' | 'verified' | 'trusted' | 'premium';

export interface OwnerTrustStats {
  /** Number of properties currently published by this owner. */
  propertiesCount?: number;
  /** Average response time in hours (lower = better). */
  avgResponseHours?: number;
  /** Owner has verified ID / phone. */
  idVerified?: boolean;
  /** Number of successful past reservations. */
  completedReservations?: number;
  /** Admin override — bypasses computation. */
  override?: TrustLevel;
  /** Account age in days. */
  accountAgeDays?: number;
}

export interface TrustBadge {
  level: TrustLevel;
  label: string;
  emoji: string;
  /** Tailwind-safe inline color (semantic kept out of design tokens for now). */
  color: string;
  description: string;
}

const BADGES: Record<TrustLevel, TrustBadge> = {
  new:      { level: 'new',      label: 'Nouveau',         emoji: '🆕', color: '#64748b', description: 'Compte récent, pas encore de réservations confirmées.' },
  verified: { level: 'verified', label: 'Vérifié',         emoji: '✅', color: '#0ea5e9', description: 'Identité et téléphone vérifiés.' },
  trusted:  { level: 'trusted',  label: 'Propriétaire de confiance', emoji: '🛡️', color: '#16a34a', description: 'Plusieurs réservations réussies et bonne réactivité.' },
  premium:  { level: 'premium',  label: 'Premium SapSap',  emoji: '⭐', color: '#f59e0b', description: 'Propriétaire d\'élite : excellente réputation et historique exemplaire.' },
};

export function computeTrustLevel(stats: OwnerTrustStats = {}): TrustLevel {
  if (stats.override) return stats.override;
  const reservations = stats.completedReservations ?? 0;
  const properties   = stats.propertiesCount ?? 0;
  const responsive   = (stats.avgResponseHours ?? 99) <= 4;
  const verified     = !!stats.idVerified;

  if (verified && reservations >= 20 && responsive) return 'premium';
  if (verified && reservations >= 5)                return 'trusted';
  if (verified || properties >= 1)                  return 'verified';
  return 'new';
}

export function getTrustBadge(stats: OwnerTrustStats = {}): TrustBadge {
  return BADGES[computeTrustLevel(stats)];
}

export function trustBadgeByLevel(level: TrustLevel): TrustBadge {
  return BADGES[level];
}

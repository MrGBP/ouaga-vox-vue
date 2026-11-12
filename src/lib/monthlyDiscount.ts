// Réduction séjour 1 mois (≥ 28 nuits) — calculs partagés formulaire hôte / tests.
export const MONTHLY_DISCOUNT_MAX = 50;
export const MONTHLY_MIN_NIGHTS = 28;

export const clampDiscount = (pct: number): number => {
  if (!Number.isFinite(pct)) return 0;
  return Math.min(MONTHLY_DISCOUNT_MAX, Math.max(0, Math.round(pct)));
};

/** Prix remisé → pourcentage (arrondi à l'entier). */
export const pctFromDiscountedPrice = (normal: number, discounted: number): number => {
  if (!normal || normal <= 0) return 0;
  return clampDiscount(((normal - discounted) / normal) * 100);
};

export interface MonthlyBreakdown {
  normal: number; saving: number; clientPrice: number; commission: number; net: number;
}

export const monthlyBreakdown = (normal: number, pct: number, commissionRate: number): MonthlyBreakdown => {
  const p = clampDiscount(pct);
  const saving = Math.round((normal * p) / 100);
  const clientPrice = normal - saving;
  const commission = Math.round((clientPrice * Math.max(0, commissionRate)) / 100);
  return { normal, saving, clientPrice, commission, net: clientPrice - commission };
};

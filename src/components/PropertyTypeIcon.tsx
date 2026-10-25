// Icônes réalistes (style illustré) par type de bien — source unique pour
// filtres, carte et vignettes. Couleurs via variables CSS (navy / orange poussière).
type Kind = 'villa' | 'maison' | 'appart' | 'studio' | 'chambre' | 'bureau' | 'commerce' | 'duplex';

export function typeKind(type: string): Kind {
  if (type.includes('villa')) return 'villa';
  if (type.includes('appart')) return 'appart';
  if (type.includes('studio')) return 'studio';
  if (type.includes('chambre')) return 'chambre';
  if (type.includes('bureau')) return 'bureau';
  if (type.includes('commerc') || type.includes('magasin')) return 'commerce';
  if (type.includes('duplex')) return 'duplex';
  return 'maison';
}

const N = 'hsl(var(--primary))';
const O = 'hsl(var(--secondary))';
const L = 'hsl(var(--card))';
const S = 'hsl(var(--muted))';

const shapes: Record<Kind, string> = {
  villa: `<rect x="3" y="12" width="18" height="9" rx="1" fill="${L}" stroke="${N}" stroke-width="1.4"/><path d="M1.5 12.5 12 4l10.5 8.5" fill="${O}" stroke="${N}" stroke-width="1.4" stroke-linejoin="round"/><rect x="10" y="15" width="4" height="6" fill="${N}"/><rect x="5" y="14" width="3" height="3" fill="${S}" stroke="${N}" stroke-width=".8"/><rect x="16" y="14" width="3" height="3" fill="${S}" stroke="${N}" stroke-width=".8"/><path d="M1 21.5h22" stroke="${N}" stroke-width="1.4"/>`,
  maison: `<rect x="5" y="11" width="14" height="10" fill="${L}" stroke="${N}" stroke-width="1.4"/><path d="M3 12 12 4.5 21 12" fill="${O}" stroke="${N}" stroke-width="1.4" stroke-linejoin="round"/><rect x="10.5" y="15" width="3" height="6" fill="${N}"/><rect x="6.8" y="13.5" width="2.4" height="2.4" fill="${S}" stroke="${N}" stroke-width=".8"/>`,
  appart: `<rect x="5" y="3" width="14" height="18" rx="1" fill="${L}" stroke="${N}" stroke-width="1.4"/><g fill="${O}"><rect x="7.5" y="5.5" width="3" height="2.5"/><rect x="13.5" y="5.5" width="3" height="2.5"/><rect x="7.5" y="10" width="3" height="2.5"/><rect x="13.5" y="10" width="3" height="2.5"/></g><rect x="10.5" y="16" width="3" height="5" fill="${N}"/>`,
  studio: `<path d="M3 16v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" fill="${O}" stroke="${N}" stroke-width="1.4"/><rect x="2" y="14" width="20" height="5" rx="1.5" fill="${L}" stroke="${N}" stroke-width="1.4"/><path d="M4 19v2M20 19v2" stroke="${N}" stroke-width="1.6" stroke-linecap="round"/>`,
  chambre: `<rect x="2" y="12" width="20" height="6" rx="1" fill="${L}" stroke="${N}" stroke-width="1.4"/><rect x="4" y="9" width="6" height="3" rx="1" fill="${O}" stroke="${N}" stroke-width="1"/><path d="M2 6v15M22 12v9" stroke="${N}" stroke-width="1.6" stroke-linecap="round"/>`,
  bureau: `<rect x="3" y="7" width="18" height="13" rx="1.5" fill="${L}" stroke="${N}" stroke-width="1.4"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" fill="none" stroke="${N}" stroke-width="1.4"/><rect x="3" y="11" width="18" height="2.5" fill="${O}"/>`,
  commerce: `<rect x="4" y="10" width="16" height="11" fill="${L}" stroke="${N}" stroke-width="1.4"/><path d="M3 10 5 4h14l2 6z" fill="${O}" stroke="${N}" stroke-width="1.4" stroke-linejoin="round"/><rect x="7" y="14" width="4" height="7" fill="${N}"/><rect x="13" y="13" width="5" height="4" fill="${S}" stroke="${N}" stroke-width=".8"/>`,
  duplex: `<rect x="4" y="9" width="16" height="12" fill="${L}" stroke="${N}" stroke-width="1.4"/><path d="M2.5 10 12 3.5 21.5 10" fill="${O}" stroke="${N}" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 15h16" stroke="${N}" stroke-width="1"/><g fill="${S}" stroke="${N}" stroke-width=".8"><rect x="6.5" y="11" width="3" height="2.5"/><rect x="14.5" y="11" width="3" height="2.5"/></g><rect x="10.5" y="17" width="3" height="4" fill="${N}"/>`,
};

export function typeIconSvg(type: string, size = 20): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${shapes[typeKind(type)]}</svg>`;
}

export default function PropertyTypeIcon({ type, size = 20, className = '' }: { type: string; size?: number; className?: string }) {
  return <span className={`inline-flex shrink-0 ${className}`} dangerouslySetInnerHTML={{ __html: typeIconSvg(type, size) }} />;
}

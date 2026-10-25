import { BedDouble, KeyRound } from 'lucide-react';

export type HomeIntent = 'meuble' | 'long';
export const INTENT_KEY = 'sapsap_home_intent';

export const readIntent = (): HomeIntent => {
  try { return localStorage.getItem(INTENT_KEY) === 'long' ? 'long' : 'meuble'; } catch { return 'meuble'; }
};
export const saveIntent = (i: HomeIntent) => { try { localStorage.setItem(INTENT_KEY, i); } catch { /* noop */ } };

interface Props { value: HomeIntent; onChange: (i: HomeIntent) => void; className?: string }

const IntentSwitch = ({ value, onChange, className = '' }: Props) => (
  <div role="tablist" aria-label="Type de séjour" className={`inline-flex p-1 rounded-full bg-muted border border-border ${className}`}>
    {([
      { v: 'meuble' as const, label: 'Séjours courts & meublés', Icon: BedDouble },
      { v: 'long' as const, label: 'Longue durée', Icon: KeyRound },
    ]).map(({ v, label, Icon }) => (
      <button
        key={v}
        role="tab"
        aria-selected={value === v}
        onClick={() => { saveIntent(v); onChange(v); }}
        className={`inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold transition-all ${
          value === v ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4" /> {label}
      </button>
    ))}
  </div>
);

export default IntentSwitch;

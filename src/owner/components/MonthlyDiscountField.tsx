import { useEffect, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { monthlyBreakdown, pctFromDiscountedPrice, clampDiscount, MONTHLY_DISCOUNT_MAX } from '@/lib/monthlyDiscount';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const QUICK = [0, 5, 10, 15, 20];

interface Props {
  monthlyPrice: number;
  value: number;
  onChange: (pct: number) => void;
  commissionRate: number;
  currency: string;
  applyAll: boolean;
  onApplyAllChange: (v: boolean) => void;
}

export default function MonthlyDiscountField({ monthlyPrice, value, onChange, commissionRate, currency, applyAll, onApplyAllChange }: Props) {
  const b = monthlyBreakdown(monthlyPrice, value, commissionRate);
  const [priceInput, setPriceInput] = useState(String(b.clientPrice || ''));
  useEffect(() => { setPriceInput(monthlyPrice ? String(b.clientPrice) : ''); }, [b.clientPrice, monthlyPrice]);

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-4 space-y-4">
      <div>
        <p className="text-sm font-bold text-foreground">📅 Réduction séjour d’un mois</p>
        <p className="text-[11px] text-muted-foreground">S’applique automatiquement aux séjours de 28 nuits ou plus.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK.map(q => (
          <button key={q} type="button" onClick={() => onChange(q)}
            className={`h-8 px-3 rounded-full border text-xs font-semibold transition ${value === q ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}>
            {q === 0 ? 'Aucune' : `${q} %`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Glissez vers la droite</span>
          <span className="text-lg font-bold text-primary">−{value} %</span>
        </div>
        <Slider value={[value]} min={0} max={MONTHLY_DISCOUNT_MAX} step={1} onValueChange={v => onChange(clampDiscount(v[0]))} aria-label="Réduction mensuelle" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[11px] font-semibold mb-1">Réduction (%)</span>
          <input type="number" inputMode="numeric" min={0} max={MONTHLY_DISCOUNT_MAX} value={value}
            onChange={e => onChange(clampDiscount(Number(e.target.value)))} className="form-input" />
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold mb-1">Ou prix du mois voulu ({currency})</span>
          <input type="number" inputMode="numeric" min={0} value={priceInput} disabled={!monthlyPrice}
            onChange={e => setPriceInput(e.target.value)}
            onBlur={() => onChange(pctFromDiscountedPrice(monthlyPrice, Number(priceInput) || monthlyPrice))}
            className="form-input" />
        </label>
      </div>

      {monthlyPrice > 0 ? (
        <div className="rounded-lg bg-card border p-3 space-y-1.5 text-xs">
          <Row label="Tarif normal du mois" value={`${fmt(b.normal)} ${currency}`} />
          <Row label={`Réduction offerte (−${value} %)`} value={`−${fmt(b.saving)} ${currency}`} />
          <Row label="Prix payé par le client" value={`${fmt(b.clientPrice)} ${currency}`} strong />
          <Row label={`Frais de service SapSapHouse (${commissionRate} %)`} value={`−${fmt(b.commission)} ${currency}`} />
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="font-bold text-foreground">💰 Vous recevez</span>
            <span className="text-base font-bold text-primary">{fmt(b.net)} {currency}</span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Indiquez d’abord votre prix pour voir le calcul.</p>
      )}

      <label className="flex items-start gap-2 text-xs cursor-pointer">
        <input type="checkbox" checked={applyAll} onChange={e => onApplyAllChange(e.target.checked)} className="mt-0.5" />
        <span>Appliquer cette réduction à <b>tous mes logements meublés</b></span>
      </label>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? 'font-bold text-foreground' : 'font-medium text-foreground'}>{value}</span>
    </div>
  );
}

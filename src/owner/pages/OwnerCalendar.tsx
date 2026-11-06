import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getCalendarOccupancy, occupancyByNight, OCCUPANCY_LEGEND,
  type OccupancyRange, type OccupancyState,
} from '@/lib/reservationsPublicService';
import { addBlockedRange, deleteBlockedRange, BLOCK_REASONS } from '@/lib/blockedDatesService';

type View = 'month' | 'week' | 'day' | 'timeline';
type Prop = { id: string; title: string; price: number };
type Rules = {
  check_in_time: string; check_out_time: string; cleaning_minutes: number;
  buffer_nights: number; same_day_turnover: boolean; early_late_policy: string | null;
};
type PriceRule = { id: string; kind: string; label: string | null; date_from: string; date_to: string; price_per_night: number | null; discount_pct: number | null };

const DEFAULT_RULES: Rules = { check_in_time: '14:00', check_out_time: '11:00', cleaning_minutes: 120, buffer_nights: 0, same_day_turnover: true, early_late_policy: '' };
const KIND_LABEL: Record<string, string> = { day: 'Jour spécifique', period: 'Période', promotion: 'Promotion', exceptional: 'Tarif exceptionnel', last_minute: 'Dernière minute' };
const STATE_CLASS = Object.fromEntries(OCCUPANCY_LEGEND.map(l => [l.state, l.className])) as Record<string, string>;
const STATE_LABEL = Object.fromEntries(OCCUPANCY_LEGEND.map(l => [l.state, l.label])) as Record<string, string>;
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const short = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
const baseNight = (price: number) => Math.max(500, Math.round(price / 30 / 500) * 500);

function nightPrice(d: string, base: number, rules: PriceRule[]): number {
  const order = ['exceptional', 'day', 'last_minute', 'promotion', 'period'];
  const r = rules.filter(x => d >= x.date_from && d <= x.date_to).sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))[0];
  let p = base;
  if (r?.price_per_night != null) p = Number(r.price_per_night);
  if (r?.discount_pct != null) p = Math.round(p * (1 - Number(r.discount_pct) / 100));
  return p;
}

export default function OwnerCalendar() {
  const { user } = useAuth();
  const [props, setProps] = useState<Prop[]>([]);
  const [pid, setPid] = useState<string>('');
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [occ, setOcc] = useState<OccupancyRange[]>([]);
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [prices, setPrices] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [block, setBlock] = useState({ from: '', to: '', reason: 'external_booking', note: '' });
  const [pr, setPr] = useState({ kind: 'period', label: '', from: '', to: '', price: '', discount: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('properties').select('id,title,price').eq('owner_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { const list = (data ?? []) as Prop[]; setProps(list); if (list[0]) setPid(list[0].id); setLoading(false); });
  }, [user]);

  const reload = useCallback(async () => {
    if (!pid) return;
    const [o, r, p] = await Promise.all([
      getCalendarOccupancy(pid),
      supabase.from('property_calendar_rules').select('*').eq('property_id', pid).maybeSingle(),
      supabase.from('property_price_rules').select('*').eq('property_id', pid).order('date_from'),
    ]);
    setOcc(o);
    setRules(r.data ? { ...DEFAULT_RULES, ...(r.data as any), check_in_time: String((r.data as any).check_in_time).slice(0, 5), check_out_time: String((r.data as any).check_out_time).slice(0, 5) } : DEFAULT_RULES);
    setPrices((p.data ?? []) as PriceRule[]);
  }, [pid]);
  useEffect(() => { reload(); }, [reload]);

  const prop = props.find(p => p.id === pid);
  const base = prop ? baseNight(Number(prop.price)) : 0;
  const nights = useMemo(() => occupancyByNight(occ), [occ]);
  const today = key(new Date());

  const days = useMemo(() => {
    const out: (Date | null)[] = [];
    if (view === 'month') {
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      for (let i = 0; i < (first.getDay() + 6) % 7; i++) out.push(null);
      for (let d = 1; d <= last.getDate(); d++) out.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    } else if (view === 'week') {
      const start = new Date(cursor); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); out.push(d); }
    }
    return out;
  }, [cursor, view]);

  const move = (dir: number) => {
    const d = new Date(cursor);
    if (view === 'month' || view === 'timeline') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCursor(d);
  };

  const saveRules = async () => {
    const { error } = await supabase.from('property_calendar_rules').upsert({ property_id: pid, ...rules, updated_by: user?.id, updated_at: new Date().toISOString() } as any);
    error ? toast.error(error.message) : toast.success('Règles enregistrées');
  };
  const addBlock = async () => {
    if (!block.from || !block.to || block.to < block.from) return toast.error('Période invalide');
    try {
      await addBlockedRange({ property_id: pid, owner_id: user!.id, date_from: block.from, date_to: block.to, reason: block.reason, note: block.note || undefined });
      toast.success('Indisponibilité enregistrée'); setBlock({ ...block, from: '', to: '', note: '' }); reload();
    } catch (e: any) { toast.error(e?.message ?? 'Erreur'); }
  };
  const addPrice = async () => {
    if (!pr.from || !(pr.to || pr.kind === 'day') || (!pr.price && !pr.discount)) return toast.error('Complétez le tarif');
    const { error } = await supabase.from('property_price_rules').insert({
      property_id: pid, kind: pr.kind, label: pr.label || null, date_from: pr.from, date_to: pr.kind === 'day' ? pr.from : pr.to,
      price_per_night: pr.price ? Number(pr.price) : null, discount_pct: pr.discount ? Number(pr.discount) : null, created_by: user?.id,
    } as any);
    if (error) return toast.error(error.message);
    toast.success('Tarif ajouté'); setPr({ ...pr, label: '', from: '', to: '', price: '', discount: '' }); reload();
  };
  const delPrice = async (id: string) => { await supabase.from('property_price_rules').delete().eq('id', id); reload(); };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!props.length) return <Card className="p-8 text-center text-sm text-muted-foreground">Publiez un logement pour gérer son calendrier.</Card>;

  const title = view === 'day'
    ? cursor.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const dayKey = key(cursor);
  const monthStart = key(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const monthEnd = key(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Calendrier</h1>
        <select value={pid} onChange={e => setPid(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm max-w-[260px]">
          {props.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      <Card className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
            {(['month', 'week', 'day', 'timeline'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-2.5 py-1.5 rounded-md font-medium ${view === v ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}>
                {{ month: 'Mois', week: 'Semaine', day: 'Jour', timeline: 'Chronologie' }[v]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => move(-1)} aria-label="Précédent"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-semibold capitalize min-w-[130px] text-center">{title}</span>
            <Button size="icon" variant="ghost" onClick={() => move(1)} aria-label="Suivant"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {(view === 'month' || view === 'week') && (
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d, i) => <span key={i} className="text-[10px] text-center font-bold text-muted-foreground">{d}</span>)}
            {days.map((d, i) => {
              if (!d) return <span key={i} />;
              const k = key(d); const st = nights.get(k); const past = k < today;
              const dark = st === 'confirmed';
              return (
                <button key={k} onClick={() => { setCursor(d); setView('day'); }}
                  className={`rounded-lg ${view === 'week' ? 'h-24' : 'h-14 sm:h-16'} p-1 text-left flex flex-col justify-between ${st ? STATE_CLASS[st] : 'bg-card border border-border'} ${past ? 'opacity-40' : ''} ${k === today ? 'ring-2 ring-secondary' : ''}`}>
                  <span className={`text-xs font-semibold ${dark ? 'text-primary-foreground' : 'text-foreground'}`}>{d.getDate()}</span>
                  {!st && !past && <span className="text-[9px] sm:text-[10px] text-muted-foreground">{short(nightPrice(k, base, prices))}</span>}
                  {st && view === 'week' && <span className={`text-[9px] leading-tight ${dark ? 'text-primary-foreground' : 'text-foreground'}`}>{STATE_LABEL[st]}</span>}
                </button>
              );
            })}
          </div>
        )}

        {view === 'day' && (
          <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
            <p><span className="text-muted-foreground">État : </span><strong>{STATE_LABEL[nights.get(dayKey) ?? 'available']}</strong></p>
            {!nights.get(dayKey) && <p><span className="text-muted-foreground">Tarif de la nuit : </span><strong>{fmt(nightPrice(dayKey, base, prices))} FCFA</strong></p>}
            <p className="text-muted-foreground">Arrivée à partir de {rules.check_in_time} · départ avant {rules.check_out_time} · nettoyage {rules.cleaning_minutes} min</p>
          </div>
        )}

        {view === 'timeline' && (
          <ul className="divide-y divide-border">
            {occ.filter(o => o.date_to > monthStart && o.date_from <= monthEnd).sort((a, b) => a.date_from.localeCompare(b.date_from)).map((o, i) => (
              <li key={i} className="py-2 flex items-center gap-3 text-sm">
                <span className={`w-3 h-3 rounded-sm shrink-0 ${STATE_CLASS[o.state]}`} />
                <span className="flex-1">{new Date(o.date_from).toLocaleDateString('fr-FR')} → {new Date(o.date_to).toLocaleDateString('fr-FR')}</span>
                <span className="text-xs text-muted-foreground">{STATE_LABEL[o.state]}</span>
                {o.source_id && (
                  <Button size="icon" variant="ghost" aria-label="Supprimer le blocage" onClick={async () => { await deleteBlockedRange(o.source_id!); reload(); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
            {!occ.some(o => o.date_to > monthStart && o.date_from <= monthEnd) && <li className="py-6 text-center text-sm text-muted-foreground">Aucune réservation ni blocage ce mois-ci.</li>}
          </ul>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
          {OCCUPANCY_LEGEND.map(l => (
            <span key={l.state} className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className={`w-3 h-3 rounded-sm ${l.className}`} />{l.label}</span>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">Déclarer une indisponibilité</h2>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">Du<Input type="date" min={today} value={block.from} onChange={e => setBlock({ ...block, from: e.target.value })} /></label>
            <label className="text-xs">Au (inclus)<Input type="date" min={block.from || today} value={block.to} onChange={e => setBlock({ ...block, to: e.target.value })} /></label>
          </div>
          <select value={block.reason} onChange={e => setBlock({ ...block, reason: e.target.value })} className="h-9 w-full rounded-lg border border-border bg-card px-2 text-sm">
            {BLOCK_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <Input placeholder="Note (facultatif)" value={block.note} onChange={e => setBlock({ ...block, note: e.target.value })} />
          <Button onClick={addBlock} className="w-full">Bloquer ces dates</Button>
          <p className="text-[11px] text-muted-foreground">Les réservations SapSapHouse existantes ne peuvent pas être écrasées.</p>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-sm">Règles d'arrivée et de départ</h2>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">Arrivée dès<Input type="time" value={rules.check_in_time} onChange={e => setRules({ ...rules, check_in_time: e.target.value })} /></label>
            <label className="text-xs">Départ avant<Input type="time" value={rules.check_out_time} onChange={e => setRules({ ...rules, check_out_time: e.target.value })} /></label>
            <label className="text-xs">Nettoyage (min)<Input type="number" min={0} value={rules.cleaning_minutes} onChange={e => setRules({ ...rules, cleaning_minutes: Number(e.target.value) })} /></label>
            <label className="text-xs">Nuits de transition<Input type="number" min={0} max={7} value={rules.buffer_nights} onChange={e => setRules({ ...rules, buffer_nights: Number(e.target.value) })} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={rules.same_day_turnover} onChange={e => setRules({ ...rules, same_day_turnover: e.target.checked })} />
            Accepter une arrivée le jour d'un départ
          </label>
          <Input placeholder="Arrivée anticipée / départ tardif (conditions)" value={rules.early_late_policy ?? ''} onChange={e => setRules({ ...rules, early_late_policy: e.target.value })} />
          <Button onClick={saveRules} variant="outline" className="w-full">Enregistrer les règles</Button>
        </Card>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Tarifs</h2>
          <span className="text-xs text-muted-foreground">Tarif normal : {fmt(base)} FCFA / nuit</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <select value={pr.kind} onChange={e => setPr({ ...pr, kind: e.target.value })} className="h-9 rounded-lg border border-border bg-card px-2 text-sm col-span-2 sm:col-span-1">
            {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Input type="date" min={today} value={pr.from} onChange={e => setPr({ ...pr, from: e.target.value })} aria-label="Début" />
          {pr.kind !== 'day' ? <Input type="date" min={pr.from || today} value={pr.to} onChange={e => setPr({ ...pr, to: e.target.value })} aria-label="Fin" /> : <span />}
          <Input type="number" placeholder="Prix / nuit" value={pr.price} onChange={e => setPr({ ...pr, price: e.target.value })} />
          <Input type="number" placeholder="Remise %" value={pr.discount} onChange={e => setPr({ ...pr, discount: e.target.value })} />
          <Button onClick={addPrice}>Ajouter</Button>
        </div>
        <ul className="divide-y divide-border">
          {prices.map(p => (
            <li key={p.id} className="py-2 flex items-center gap-2 text-sm">
              <span className="font-medium">{KIND_LABEL[p.kind]}</span>
              <span className="text-muted-foreground flex-1">{p.date_from}{p.date_to !== p.date_from ? ` → ${p.date_to}` : ''}</span>
              <span>{p.price_per_night != null ? `${fmt(p.price_per_night)} FCFA` : ''}{p.discount_pct != null ? ` −${p.discount_pct}%` : ''}</span>
              <Button size="icon" variant="ghost" aria-label="Supprimer le tarif" onClick={() => delPrice(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </li>
          ))}
          {!prices.length && <li className="py-3 text-xs text-muted-foreground">Aucun tarif spécifique : le tarif normal s'applique.</li>}
        </ul>
        <p className="text-[11px] text-muted-foreground">Le prix accepté par un client est conservé tel quel, même si vous modifiez vos tarifs ensuite.</p>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAllCountryConfigs, type CountryConfig } from '@/hooks/useCountryConfig';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Globe, Save, MessageCircle, Mail, Percent, Power } from 'lucide-react';

function CountryCard({ country, onSaved }: { country: CountryConfig; onSaved: () => void }) {
  const [form, setForm] = useState(country);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(country), [country]);

  const dirty = JSON.stringify(form) !== JSON.stringify(country);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('country_configs')
      .update({
        support_email: form.support_email?.trim() || null,
        support_whatsapp: form.support_whatsapp?.trim() || null,
        commission_rate: Number(form.commission_rate) || 0,
        currency: form.currency,
        currency_symbol: form.currency_symbol,
        language: form.language,
        enabled: form.enabled,
      })
      .eq('id', country.id);
    setSaving(false);
    if (error) {
      toast.error(`Erreur : ${error.message}`);
      return;
    }
    toast.success(`${country.name} mis à jour`);
    onSaved();
  };

  const set = <K extends keyof CountryConfig>(k: K, v: CountryConfig[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag_emoji}</span>
          <div>
            <h3 className="font-semibold text-slate-900">{country.name}</h3>
            <p className="text-xs text-slate-500">Code : {country.code}</p>
          </div>
        </div>
        <button
          onClick={() => set('enabled', !form.enabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            form.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Power size={12} />
          {form.enabled ? 'Activé' : 'Désactivé'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <label className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <MessageCircle size={12} /> WhatsApp service client
          </span>
          <input
            type="tel"
            placeholder="+226XXXXXXXX"
            value={form.support_whatsapp || ''}
            onChange={(e) => set('support_whatsapp', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none"
          />
        </label>

        <label className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Mail size={12} /> Email support
          </span>
          <input
            type="email"
            placeholder="contact@..."
            value={form.support_email || ''}
            onChange={(e) => set('support_email', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none"
          />
        </label>

        <label className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Percent size={12} /> Commission (%)
          </span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={form.commission_rate}
            onChange={(e) => set('commission_rate', Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Devise / symbole</span>
          <div className="flex gap-2">
            <input
              value={form.currency}
              onChange={(e) => set('currency', e.target.value.toUpperCase())}
              className="w-20 px-3 py-2 rounded-lg border border-slate-200 outline-none uppercase"
            />
            <input
              value={form.currency_symbol}
              onChange={(e) => set('currency_symbol', e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 outline-none"
            />
          </div>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Langue</span>
          <select
            value={form.language}
            onChange={(e) => set('language', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-40"
          style={{ background: '#1a3560' }}
        >
          <Save size={14} />
          {saving ? 'Sauvegarde…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

export default function AdminCountries() {
  const { data: countries, isLoading } = useAllCountryConfigs();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['country_configs'] });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: '#1a3560' }}>
          <Globe size={18} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Configuration par pays</h1>
          <p className="text-sm text-slate-500">
            Email, WhatsApp service client, taux de commission, devise. Modifications immédiates.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="text-sm text-slate-500">Chargement…</div>
      ) : (
        <div className="space-y-4">
          {countries?.map((c) => <CountryCard key={c.id} country={c} onSaved={refresh} />)}
        </div>
      )}
    </div>
  );
}

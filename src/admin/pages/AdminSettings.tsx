import { useState } from 'react';
import { adminProperties } from '@/admin/data/adminMockData';
import { isTypeFurnished } from '@/lib/mockData';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminCard from '@/admin/components/AdminCard';

export default function AdminSettings() {
  const [tab, setTab] = useState<'general' | 'commissions' | 'notifications' | 'security' | 'roles'>('general');
  const [tauxMeuble, setTauxMeuble] = useState(7);
  const [tauxNonMeuble, setTauxNonMeuble] = useState(5);
  const [commissionMin, setCommissionMin] = useState(5000);
  const [whatsappNumber, setWhatsappNumber] = useState('+226 70 00 00 00');

  // Live calculation
  const impactEstimate = adminProperties.reduce((sum, p) => {
    const rate = isTypeFurnished(p.type) ? tauxMeuble / 100 : tauxNonMeuble / 100;
    return sum + Math.max(commissionMin, Math.round(p.price * rate));
  }, 0);

  const TABS = [
    { key: 'general', label: 'Général' },
    { key: 'commissions', label: 'Commissions' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'security', label: 'Sécurité' },
    { key: 'roles', label: 'Rôles' },
  ] as const;

  const loginHistory = [
    { date: '17/03/2026 14:30', ip: '196.28.45.12', device: 'Chrome / macOS' },
    { date: '16/03/2026 09:15', ip: '196.28.45.12', device: 'Chrome / macOS' },
    { date: '15/03/2026 22:00', ip: '41.203.78.55', device: 'Safari / iPhone' },
    { date: '14/03/2026 08:45', ip: '196.28.45.12', device: 'Chrome / macOS' },
    { date: '12/03/2026 16:30', ip: '41.203.78.55', device: 'Safari / iPhone' },
  ];

  return (
    <div>
      <AdminPageHeader title="Paramètres" />

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-lg px-4 py-1.5 text-xs font-medium whitespace-nowrap ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <AdminCard title="Informations générales">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Nom de la plateforme</label>
              <input defaultValue="SapSapHouse" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email de contact</label>
              <input defaultValue="contact@sapsaphouse.bf" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Devise</label>
              <input defaultValue="FCFA" disabled className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-muted" />
            </div>
            <button className="rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ background: '#e02d2d' }}>Enregistrer</button>
          </div>
        </AdminCard>
      )}

      {tab === 'commissions' && (
        <AdminCard title="Taux de commission">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Taux meublé (%)</label>
              <input type="number" value={tauxMeuble} onChange={e => setTauxMeuble(Number(e.target.value))} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Taux non meublé (%)</label>
              <input type="number" value={tauxNonMeuble} onChange={e => setTauxNonMeuble(Number(e.target.value))} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Commission minimum (FCFA)</label>
              <input type="number" value={commissionMin} onChange={e => setCommissionMin(Number(e.target.value))} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-800 font-medium">
                💡 Impact sur {adminProperties.length} biens : {impactEstimate.toLocaleString('fr-FR')} FCFA de revenus estimés
              </p>
            </div>
            <button className="rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ background: '#e02d2d' }}>Enregistrer</button>
          </div>
        </AdminCard>
      )}

      {tab === 'notifications' && (
        <AdminCard title="Notifications">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Numéro WhatsApp admin</label>
              <input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            {['Nouveau bien soumis', 'Nouvelle réservation', 'Paiement reçu', 'Message reçu'].map(event => (
              <div key={event} className="flex items-center justify-between">
                <span className="text-xs text-foreground">{event}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
            <button className="rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ background: '#e02d2d' }}>Enregistrer</button>
          </div>
        </AdminCard>
      )}

      {tab === 'security' && (
        <AdminCard title="Sécurité">
          <div className="space-y-4 max-w-md mb-6">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email</label>
              <input defaultValue="admin@sapsaphouse.bf" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Mot de passe</label>
              <input type="password" defaultValue="admin2026" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
            <button className="rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ background: '#e02d2d' }}>Modifier</button>
          </div>
          <h4 className="text-xs font-semibold text-foreground mb-3">Historique des connexions</h4>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted-foreground">
                  <th className="px-3 py-2">Date</th><th className="px-3 py-2">IP</th><th className="px-3 py-2">Appareil</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((h, i) => (
                  <tr key={i} className="border-b border-border text-xs text-muted-foreground">
                    <td className="px-3 py-2">{h.date}</td><td className="px-3 py-2">{h.ip}</td><td className="px-3 py-2">{h.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {tab === 'roles' && (
        <AdminCard title="Rôles et permissions">
          <p className="text-xs text-muted-foreground">Un seul administrateur pour le moment. La gestion multi-admin sera disponible prochainement.</p>
        </AdminCard>
      )}
    </div>
  );
}

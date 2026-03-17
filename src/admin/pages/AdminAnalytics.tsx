import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { viewsData, revenueHistory, typeDistribution, quartierDistribution, adminProperties } from '@/admin/data/adminMockData';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminCard from '@/admin/components/AdminCard';
import { Download } from 'lucide-react';

const PERIODS = ['7j', '30j', '3m', '6m', '12m'] as const;

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<string>('30j');

  const data = useMemo(() => {
    const len = period === '7j' ? 7 : period === '30j' ? 30 : period === '3m' ? 30 : 30;
    return viewsData.slice(-len);
  }, [period]);

  // Top 10 biens les plus vus
  const topBiens = useMemo(() =>
    [...adminProperties].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 10).map(p => ({
      name: p.title.length > 25 ? p.title.slice(0, 25) + '…' : p.title,
      vues: p.viewCount || 0,
    }))
  , []);

  // Conversion funnel
  const conversionData = useMemo(() =>
    data.map(d => ({
      ...d,
      tauxFavoris: Math.round((d.favoris / d.vues) * 100),
      tauxReservation: Math.round((d.reservations / d.vues) * 100),
    }))
  , [data]);

  const handleExport = () => {
    const csv = ['Date,Vues,Réservations,Favoris', ...data.map(d => `${d.date},${d.vues},${d.reservations},${d.favoris}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `analytics_${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        actions={
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
            <Download size={14} /> Export CSV
          </button>
        }
      />

      {/* Period selector */}
      <div className="flex gap-1 mb-6">
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-4 py-1.5 text-xs font-medium ${period === p ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Vues/jour */}
        <AdminCard title="Vues par jour">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="vues" stroke="#1a3560" strokeWidth={2} dot={false} name="Vues" />
            </LineChart>
          </ResponsiveContainer>
        </AdminCard>

        {/* 2. Réservations confirmées vs annulées */}
        <AdminCard title="Réservations confirmées vs annulées">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="reservations" fill="#2563eb" name="Confirmées" radius={[3, 3, 0, 0]} />
              <Bar dataKey="favoris" fill="#e02d2d" name="Annulées" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminCard>

        {/* 3. Top 10 biens */}
        <AdminCard title="Top 10 biens les plus vus">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBiens} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="vues" fill="#1a3560" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AdminCard>

        {/* 4. Répartition par quartier */}
        <AdminCard title="Répartition par quartier">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={quartierDistribution.slice(0, 10)} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {quartierDistribution.slice(0, 10).map((_, i) => <Cell key={i} fill={['#1a3560', '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#db2777', '#64748b', '#0891b2', '#ea580c'][i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </AdminCard>

        {/* 5. Revenus cumulés */}
        <AdminCard title="Revenus cumulés">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="commissions" stroke="#1a3560" fill="#1a3560" fillOpacity={0.15} name="Commissions" />
              <Area type="monotone" dataKey="boosts" stroke="#d97706" fill="#d97706" fillOpacity={0.15} name="Boosts" />
              <Area type="monotone" dataKey="contenu" stroke="#059669" fill="#059669" fillOpacity={0.15} name="Contenu" />
            </AreaChart>
          </ResponsiveContainer>
        </AdminCard>

        {/* 6. Taux conversion */}
        <AdminCard title="Taux conversion vues → favoris → réservations">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tauxFavoris" stroke="#db2777" strokeWidth={2} dot={false} name="Vues → Favoris %" />
              <Line type="monotone" dataKey="tauxReservation" stroke="#2563eb" strokeWidth={2} dot={false} name="Vues → Réservations %" />
            </LineChart>
          </ResponsiveContainer>
        </AdminCard>
      </div>
    </div>
  );
}

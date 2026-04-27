import { Home, Eye, Calendar, TrendingUp, Heart, Clock, MessageSquare, AlertTriangle, Check, X } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/components/AdminPageHeader';
import AdminKPICard from '@/admin/components/AdminKPICard';
import { adminStats as seedStats, viewsData, typeDistribution, activityFeed } from '@/admin/data/adminMockData';
import { useAdminStore, adminStore } from '@/admin/store/adminStore';

const ICON_MAP: Record<string, React.ReactNode> = {
  Heart: <Heart size={16} />,
  Calendar: <Calendar size={16} />,
  Home: <Home size={16} />,
  Eye: <Eye size={16} />,
  Zap: <TrendingUp size={16} />,
  AlertTriangle: <AlertTriangle size={16} />,
  CheckCircle: <Check size={16} />,
};

export default function AdminDashboard() {
  const adminProperties = useAdminStore(s => s.properties);
  const messages = useAdminStore(s => s.messages);
  const reservations = useAdminStore(s => s.reservations);
  const pendingProperties = adminProperties.filter(p => p.adminStatus === 'pending');
  const adminStats = {
    ...seedStats,
    biensActifs: adminProperties.filter(p => p.adminStatus === 'published').length,
    biensEnAttente: pendingProperties.length,
    vuesTotales30j: adminProperties.reduce((s, p) => s + (p.viewCount || 0), 0),
    favorisTotal: adminProperties.reduce((s, p) => s + (p.favoriteCount || 0), 0),
    reservationsActives: reservations.filter(r => r.status === 'confirmed' || r.status === 'in_progress').length,
    reservationsEnAttente: reservations.filter(r => r.status === 'pending').length,
    messagesNonLus: messages.reduce((s, m) => s + m.unreadCount, 0),
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Tableau de bord" subtitle="Vue d'ensemble de SapSapHouse" />

      {/* Row 1 — Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Biens actifs" value={adminStats.biensActifs} icon={Home} iconBg="#dbeafe" iconColor="#1d4ed8" delta="+3 ce mois" deltaColor="green" />
        <AdminKPICard title="Vues totales (30j)" value={adminStats.vuesTotales30j.toLocaleString('fr-FR')} icon={Eye} iconBg="#dcfce7" iconColor="#15803d" delta="+12% vs mois dernier" deltaColor="green" />
        <AdminKPICard title="Réservations actives" value={adminStats.reservationsActives} icon={Calendar} iconBg="#fef3c7" iconColor="#d97706" delta={`${adminStats.reservationsEnAttente} en attente`} deltaColor="orange" />
        <AdminKPICard title="Revenus du mois" value={`${adminStats.revenusMois.toLocaleString('fr-FR')} FCFA`} icon={TrendingUp} iconBg="#fce7f3" iconColor="#be185d" delta="+8% vs mois dernier" deltaColor="green" />
      </div>

      {/* Row 2 — Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Favoris (7j)" value={adminStats.favorisTotal} icon={Heart} iconBg="#fce7f3" iconColor="#db2777" />
        <AdminKPICard
          title="En attente"
          value={adminStats.biensEnAttente}
          icon={Clock}
          iconBg={adminStats.biensEnAttente > 5 ? '#fee2e2' : '#fef3c7'}
          iconColor={adminStats.biensEnAttente > 5 ? '#dc2626' : '#d97706'}
        />
        <AdminKPICard title="Messages non lus" value={adminStats.messagesNonLus} icon={MessageSquare} iconBg="#dbeafe" iconColor="#2563eb" />
        <AdminKPICard
          title="Alertes"
          value={adminStats.alertes}
          icon={AlertTriangle}
          iconBg={adminStats.alertes > 0 ? '#fee2e2' : '#f1f5f9'}
          iconColor={adminStats.alertes > 0 ? '#dc2626' : '#64748b'}
        />
      </div>

      {/* Row 3 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Area Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Activité des 30 derniers jours</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="vues" stroke="#1a3560" fill="#1a3560" fillOpacity={0.15} name="Vues" />
              <Area type="monotone" dataKey="reservations" stroke="#e02d2d" fill="#e02d2d" fillOpacity={0.15} name="Réservations" />
              <Area type="monotone" dataKey="favoris" stroke="#db2777" fill="#db2777" fillOpacity={0.15} name="Favoris" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Répartition par type de bien</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {typeDistribution.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4 — Activity + Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Feed */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Activité récente</h3>
          <div className="max-h-72 overflow-y-auto space-y-0">
            {activityFeed.map((item, idx) => (
              <div key={idx} className={`flex items-start gap-3 py-3 ${idx < activityFeed.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: item.color + '20', color: item.color }}>
                  {ICON_MAP[item.icon] || <Eye size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800">{item.text}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Properties */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-900">À valider</h3>
            {adminStats.biensEnAttente > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                {adminStats.biensEnAttente}
              </span>
            )}
          </div>
          <div className="space-y-0">
            {pendingProperties.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Aucun bien en attente</p>
            ) : (
              pendingProperties.map((p, idx) => {
                const scoreColor = p.qualityScore < 40 ? '#dc2626' : p.qualityScore < 70 ? '#d97706' : '#059669';
                return (
                  <div key={p.id} className={`flex items-center gap-3 py-2.5 ${idx < pendingProperties.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <Home size={18} className="text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.quartier}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.qualityScore}%`, backgroundColor: scoreColor }} />
                      </div>
                      <span className="text-[11px] text-gray-500 w-6 text-right">{p.qualityScore}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-1">
                      <button onClick={() => { adminStore.setPropertyStatus(p.id, 'published'); toast.success('Bien publié'); }} title="Publier" className="h-7 w-7 flex items-center justify-center rounded-md bg-green-50 text-green-600 hover:bg-green-100">
                        <Check size={14} />
                      </button>
                      <button onClick={() => { adminStore.setPropertyStatus(p.id, 'inactive'); toast.success('Bien rejeté'); }} title="Rejeter" className="h-7 w-7 flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 mt-3 font-medium" onClick={() => window.location.href = '/admin/biens'}>
            Voir tous les biens →
          </button>
        </div>
      </div>
    </div>
  );
}

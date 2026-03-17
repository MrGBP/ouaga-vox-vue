import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Eye, Calendar, TrendingUp, Heart, Clock, MessageSquare, AlertTriangle, Check, X, Zap, CheckCircle } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MapContainer, TileLayer, Circle, Tooltip as LTooltip } from 'react-leaflet';
import AdminKPICard from '@/admin/components/AdminKPICard';
import AdminCard from '@/admin/components/AdminCard';
import AdminBadge from '@/admin/components/AdminBadge';
import { adminStats, adminProperties, viewsData, typeDistribution, quartierDistribution, activityFeed } from '@/admin/data/adminMockData';

const ICON_MAP: Record<string, any> = { Heart, Calendar, Home, Eye, Zap, AlertTriangle, CheckCircle };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const pendingBiens = useMemo(() => adminProperties.filter(p => p.adminStatus === 'pending'), []);
  const maxCount = useMemo(() => Math.max(...quartierDistribution.map(q => q.count)), []);

  return (
    <div className="space-y-6">
      {/* KPIs primaires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminKPICard title="Biens actifs" value={adminStats.biensActifs} delta="+3 ce mois" deltaColor="green" icon={Home} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <AdminKPICard title="Vues totales (30j)" value={adminStats.vuesTotales30j.toLocaleString('fr-FR')} delta="+12% vs mois précédent" deltaColor="green" icon={Eye} iconBg="#dcfce7" iconColor="#15803d" />
        <AdminKPICard title="Réservations actives" value={adminStats.reservationsActives} delta={`${adminStats.reservationsEnAttente} en attente`} deltaColor="orange" icon={Calendar} iconBg="#fef3c7" iconColor="#d97706" />
        <AdminKPICard title="Revenus du mois" value={`${adminStats.revenusMois.toLocaleString('fr-FR')} FCFA`} delta="+8% vs mois précédent" deltaColor="green" icon={TrendingUp} iconBg="#fce7f3" iconColor="#be185d" />
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminKPICard title="Favoris ajoutés (7j)" value={adminStats.favorisTotal} icon={Heart} iconBg="#fce7f3" iconColor="#db2777" />
        <AdminKPICard title="En attente validation" value={adminStats.biensEnAttente} icon={Clock} iconBg={adminStats.biensEnAttente > 5 ? '#fee2e2' : '#fef3c7'} iconColor={adminStats.biensEnAttente > 5 ? '#dc2626' : '#d97706'} delta={adminStats.biensEnAttente > 5 ? 'Critique' : undefined} deltaColor="red" />
        <AdminKPICard title="Messages non lus" value={adminStats.messagesNonLus} icon={MessageSquare} iconBg="#dbeafe" iconColor="#2563eb" />
        <AdminKPICard title="Alertes système" value={adminStats.alertes} icon={AlertTriangle} iconBg={adminStats.alertes > 0 ? '#fee2e2' : '#f1f5f9'} iconColor={adminStats.alertes > 0 ? '#dc2626' : '#64748b'} />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminCard title="Évolution des 30 derniers jours">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="vues" stroke="#1a3560" fill="#1a3560" fillOpacity={0.1} name="Vues" />
              <Area type="monotone" dataKey="reservations" stroke="#e02d2d" fill="#e02d2d" fillOpacity={0.1} name="Réservations" />
              <Area type="monotone" dataKey="favoris" stroke="#db2777" fill="#db2777" fillOpacity={0.1} name="Favoris" />
            </AreaChart>
          </ResponsiveContainer>
        </AdminCard>

        <AdminCard title="Répartition par type de bien">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                {typeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </AdminCard>
      </div>

      {/* Activité + À valider */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <AdminCard title="Activité récente" badge={<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{activityFeed.length}</span>}>
          <div className="max-h-[320px] overflow-y-auto space-y-3">
            {activityFeed.map((item, i) => {
              const Icon = ICON_MAP[item.icon] || Eye;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: item.color + '18' }}>
                    <Icon size={14} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground">{item.text}</p>
                    <p className="text-[11px] text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>

        <AdminCard
          title="À valider"
          badge={pendingBiens.length > 0 ? <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: '#e02d2d' }}>{pendingBiens.length}</span> : undefined}
        >
          <div className="space-y-3">
            {pendingBiens.slice(0, 5).map(p => {
              const hoursAgo = Math.round((Date.now() - new Date(p.submittedAt || '').getTime()) / 3600000);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Home size={18} className="text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground">{p.quartier}</p>
                    <p className={`text-[10px] ${hoursAgo > 24 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                      Soumis il y a {hoursAgo}h
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${p.qualityScore}%`,
                            background: p.qualityScore < 40 ? '#dc2626' : p.qualityScore < 70 ? '#d97706' : '#059669',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{p.qualityScore}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="w-7 h-7 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                      <Check size={14} />
                    </button>
                    <button className="w-7 h-7 rounded-md flex items-center justify-center bg-red-100 text-red-700 hover:bg-red-200">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => navigate('/admin/biens')}
              className="w-full text-center text-xs font-medium text-primary hover:underline pt-2"
            >
              Voir tous les biens →
            </button>
          </div>
        </AdminCard>
      </div>

      {/* Carte de chaleur */}
      <AdminCard title="Densité des biens par quartier">
        <div className="h-[280px] rounded-lg overflow-hidden">
          <MapContainer center={[12.365, -1.533]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {quartierDistribution.map(q => (
              <Circle
                key={q.name}
                center={[q.lat, q.lng]}
                radius={q.count * 800}
                pathOptions={{
                  fillColor: '#1a3560',
                  fillOpacity: 0.1 + (q.count / maxCount) * 0.5,
                  color: '#1a3560',
                  weight: 1,
                }}
              >
                <LTooltip>{q.name} · {q.count} biens</LTooltip>
              </Circle>
            ))}
          </MapContainer>
        </div>
      </AdminCard>
    </div>
  );
}

import { mockProperties, mockQuartiers, isTypeFurnished, pricePerNight, PROPERTY_TYPES } from '@/lib/mockData';
import type { AdminProperty, Reservation, AdminUser, Boost, AdminMessage } from '@/admin/types';

const ADMIN_STATUSES: AdminProperty['adminStatus'][] = [
  'published', 'published', 'published', 'published',
  'published', 'published', 'published', 'published',
  'pending', 'reviewing', 'corrections', 'inactive',
];

const OWNER_NAMES = [
  'Salif Kaboré', 'Fatou Diallo', 'Moumouni Traoré',
  'Aminata Ouédraogo', 'Boureima Sawadogo', 'Mariam Compaoré',
  'Adama Coulibaly', 'Rokhaya Thiombiano', 'Seydou Zongo', 'Bintou Barry',
];

export const adminProperties: AdminProperty[] = mockProperties.map((p, i) => {
  const score = 40 + Math.floor(Math.random() * 55);
  const status = ADMIN_STATUSES[i % ADMIN_STATUSES.length];
  return {
    ...p,
    adminStatus: status,
    qualityScore: score,
    ownerName: OWNER_NAMES[i % OWNER_NAMES.length],
    ownerPhone: `+226 7${Math.floor(Math.random() * 9)}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0').slice(0, 8)}`,
    viewCount: Math.floor(20 + Math.random() * 300),
    favoriteCount: Math.floor(1 + Math.random() * 40),
    submittedAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
    publishedAt: status === 'published' ? new Date(Date.now() - Math.random() * 20 * 86400000).toISOString() : undefined,
    boostActive: Math.random() > 0.85,
    boostType: Math.random() > 0.5 ? 'standard' : 'premium',
  };
});

export const adminStats = {
  biensActifs: adminProperties.filter(p => p.adminStatus === 'published').length,
  biensEnAttente: adminProperties.filter(p => p.adminStatus === 'pending').length,
  biensEnRevision: adminProperties.filter(p => p.adminStatus === 'reviewing').length,
  vuesTotales30j: adminProperties.reduce((s, p) => s + (p.viewCount || 0), 0),
  favorisTotal: adminProperties.reduce((s, p) => s + (p.favoriteCount || 0), 0),
  revenusMois: 487500,
  reservationsActives: 14,
  reservationsEnAttente: 4,
  messagesNonLus: 7,
  alertes: 2,
};

export const viewsData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000)
    .toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  vues: Math.floor(55 + Math.random() * 90 + (i > 20 ? 30 : 0)),
  reservations: Math.floor(1 + Math.random() * 6),
  favoris: Math.floor(2 + Math.random() * 12),
}));

export const typeDistribution = PROPERTY_TYPES.map(t => ({
  name: t.label,
  value: adminProperties.filter(p => p.type === t.value).length,
  color: ({
    maison_villa_meublee: '#1a3560',
    maison_villa_simple: '#2563eb',
    appartement_meuble: '#7c3aed',
    appartement_simple: '#059669',
    studio_meuble: '#d97706',
    bureau: '#dc2626',
    local_commercial: '#db2777',
  } as Record<string, string>)[t.value] || '#64748b',
})).filter(t => t.value > 0);

export const quartierDistribution = mockQuartiers.map(q => ({
  name: q.name,
  count: adminProperties.filter(p => p.quartier === q.name).length,
  lat: q.latitude,
  lng: q.longitude,
})).filter(q => q.count > 0).sort((a, b) => b.count - a.count);

const TENANT_NAMES = [
  'Kofi Diabaté', 'Awa Traoré', 'Moussa Ouédraogo', 'Aïssata Sawadogo',
  'Ibrahim Compaoré', 'Fatoumata Zongo', 'Seydou Kaboré', 'Mariam Thiombiano',
  'Adama Barry', 'Aminata Coulibaly', 'Boureima Diallo', 'Rokhaya Sawadogo',
];

const RES_STATUSES: Reservation['status'][] = [
  'pending', 'pending', 'confirmed', 'confirmed', 'confirmed',
  'in_progress', 'in_progress', 'completed', 'completed', 'completed',
  'completed', 'cancelled', 'cancelled', 'pending', 'confirmed',
];

export const mockReservations: Reservation[] = adminProperties
  .filter(p => p.adminStatus === 'published' && isTypeFurnished(p.type))
  .slice(0, 15)
  .map((p, i) => {
    const nights = 1 + Math.floor(Math.random() * 6);
    const nightPrice = pricePerNight(p.price);
    const amount = nightPrice * nights;
    const commission = Math.round(amount * (isTypeFurnished(p.type) ? 0.07 : 0.05));
    const checkIn = new Date(Date.now() - Math.random() * 20 * 86400000);
    const checkOut = new Date(checkIn.getTime() + nights * 86400000);
    return {
      id: `RES-${String(i + 1).padStart(3, '0')}`,
      propertyId: p.id,
      propertyTitle: p.title,
      propertyType: p.type,
      propertyImage: p.images?.[0],
      tenantId: `t${i + 1}`,
      tenantName: TENANT_NAMES[i % TENANT_NAMES.length],
      tenantPhone: `+226 7${Math.floor(Math.random() * 9)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)}`,
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      nights,
      amount,
      commission,
      paymentMethod: (Math.random() > 0.4 ? 'orange_money' : 'moov_money') as Reservation['paymentMethod'],
      status: RES_STATUSES[i],
      createdAt: checkIn.toISOString(),
    };
  });

export const mockTenants: AdminUser[] = Array.from({ length: 20 }, (_, i) => ({
  id: `tenant-${i + 1}`,
  name: TENANT_NAMES[i % TENANT_NAMES.length],
  phone: `+226 7${Math.floor(Math.random() * 9)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)}`,
  role: 'tenant' as const,
  createdAt: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
  searchCount: Math.floor(5 + Math.random() * 40),
  viewCount: Math.floor(10 + Math.random() * 100),
  favoriteCount: Math.floor(1 + Math.random() * 15),
  reservationCount: Math.floor(Math.random() * 4),
}));

export const mockOwners: AdminUser[] = OWNER_NAMES.map((name, i) => {
  const owned = adminProperties.filter(p => p.ownerName === name);
  const totalRevenue = owned.reduce((s, p) => s + (p.price * (isTypeFurnished(p.type) ? 3 : 1)), 0);
  return {
    id: `owner-${i + 1}`,
    name,
    phone: `+226 7${Math.floor(Math.random() * 9)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)}`,
    role: 'owner' as const,
    createdAt: new Date(Date.now() - Math.random() * 180 * 86400000).toISOString(),
    propertyCount: owned.length,
    totalViews: owned.reduce((s, p) => s + (p.viewCount || 0), 0),
    totalRevenue,
    totalCommission: Math.round(totalRevenue * 0.07),
  };
});

export const mockBoosts: Boost[] = adminProperties
  .filter(p => p.boostActive)
  .slice(0, 8)
  .map((p, i) => {
    const types: Boost['type'][] = ['starter', 'standard', 'premium', 'annual'];
    const prices = { starter: 2500, standard: 7500, premium: 15000, annual: 25000 };
    const type = types[i % types.length];
    const start = new Date(Date.now() - Math.random() * 15 * 86400000);
    const durations = { starter: 7, standard: 30, premium: 30, annual: 90 };
    const end = new Date(start.getTime() + durations[type] * 86400000);
    return {
      id: `BOOST-${i + 1}`,
      propertyId: p.id,
      propertyTitle: p.title,
      ownerId: `owner-${(i % OWNER_NAMES.length) + 1}`,
      ownerName: p.ownerName || OWNER_NAMES[i % OWNER_NAMES.length],
      type,
      price: prices[type],
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      viewsGenerated: Math.floor(20 + Math.random() * 200),
      status: 'active' as const,
    };
  });

export const activityFeed = [
  { type: 'favorite', text: 'Kofi D. a ajouté Villa Tampouy en favori', time: 'Il y a 23 min', icon: 'Heart', color: '#db2777' },
  { type: 'reservation', text: 'Nouvelle réservation · Studio Koulouba · 3 nuits', time: 'Il y a 1h', icon: 'Calendar', color: '#2563eb' },
  { type: 'published', text: 'Appartement Ouaga 2000 publié après validation', time: 'Il y a 2h', icon: 'Home', color: '#059669' },
  { type: 'view', text: 'Villa Pissy a atteint 100 vues', time: 'Il y a 3h', icon: 'Eye', color: '#64748b' },
  { type: 'boost', text: 'Boost Premium activé · Bureau Zogona', time: 'Il y a 5h', icon: 'Zap', color: '#d97706' },
  { type: 'alert', text: 'Bien en attente depuis 48h · Action requise', time: 'Il y a 6h', icon: 'AlertTriangle', color: '#dc2626' },
  { type: 'favorite', text: 'Awa T. a ajouté Appt Ouaga 2000 en favori', time: 'Il y a 7h', icon: 'Heart', color: '#db2777' },
  { type: 'reservation', text: 'Réservation confirmée · Villa Tampouy · 5 nuits', time: 'Il y a 9h', icon: 'Calendar', color: '#2563eb' },
  { type: 'published', text: "Studio meublé Patte d'Oie publié", time: 'Il y a 12h', icon: 'Home', color: '#059669' },
  { type: 'alert', text: 'Paiement Orange Money reçu · RES-008', time: 'Il y a 14h', icon: 'CheckCircle', color: '#059669' },
];

const MONTHS = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];
export const revenueHistory = MONTHS.map((month, i) => ({
  month,
  commissions: 200000 + Math.floor(Math.random() * 300000) + i * 20000,
  boosts: 50000 + Math.floor(Math.random() * 100000),
  contenu: 30000 + Math.floor(Math.random() * 60000),
}));

export const mockMessages: AdminMessage[] = [
  {
    id: 'm1', contactId: 'owner-1', contactName: 'Salif Kaboré',
    contactPhone: '+226 70 11 22 33', contactRole: 'owner',
    channel: 'whatsapp', lastMessage: 'Quand est-ce que mon bien sera publié ?',
    lastTime: 'Il y a 5 min', unreadCount: 2, status: 'open',
    messages: [
      { id: '1', from: 'user', text: "Bonjour, j'ai soumis mon bien il y a 2 jours", time: '09:12' },
      { id: '2', from: 'admin', text: 'Bonjour Salif, votre dossier est en cours de révision', time: '09:45' },
      { id: '3', from: 'user', text: 'Quand est-ce que mon bien sera publié ?', time: '14:30' },
    ],
  },
  {
    id: 'm2', contactId: 'tenant-1', contactName: 'Kofi Diabaté',
    contactPhone: '+226 76 44 55 66', contactRole: 'tenant',
    channel: 'whatsapp', lastMessage: 'Je voudrais visiter la villa demain',
    lastTime: 'Il y a 1h', unreadCount: 1, status: 'open',
    messages: [
      { id: '1', from: 'user', text: 'Bonjour, je voudrais visiter la villa demain', time: '13:00' },
    ],
  },
  {
    id: 'm3', contactId: 'owner-3', contactName: 'Moumouni Traoré',
    contactPhone: '+226 71 88 99 00', contactRole: 'owner',
    channel: 'email', lastMessage: 'Merci pour la publication',
    lastTime: 'Il y a 3h', unreadCount: 0, status: 'resolved',
    messages: [
      { id: '1', from: 'user', text: 'Merci pour la publication rapide de mon bien !', time: '10:00' },
      { id: '2', from: 'admin', text: 'Avec plaisir ! N\'hésitez pas si besoin.', time: '10:15' },
    ],
  },
  {
    id: 'm4', contactId: 'tenant-5', contactName: 'Ibrahim Compaoré',
    contactPhone: '+226 78 33 44 55', contactRole: 'tenant',
    channel: 'app', lastMessage: 'Le propriétaire ne répond pas',
    lastTime: 'Il y a 4h', unreadCount: 3, status: 'open',
    messages: [
      { id: '1', from: 'user', text: "J'ai réservé mais le propriétaire ne répond pas", time: '08:00' },
      { id: '2', from: 'admin', text: 'Nous allons contacter le propriétaire pour vous', time: '08:30' },
      { id: '3', from: 'user', text: 'Le propriétaire ne répond pas', time: '12:00' },
    ],
  },
  {
    id: 'm5', contactId: 'owner-6', contactName: 'Mariam Compaoré',
    contactPhone: '+226 70 55 66 77', contactRole: 'owner',
    channel: 'whatsapp', lastMessage: 'Je voudrais booster mon bien',
    lastTime: 'Il y a 6h', unreadCount: 1, status: 'open',
    messages: [
      { id: '1', from: 'user', text: 'Bonjour, comment booster mon bien ?', time: '07:00' },
    ],
  },
];

// Lightweight persistent admin store (localStorage + React subscription).
// No external deps — uses useSyncExternalStore.
import { useSyncExternalStore } from 'react';
import {
  adminProperties as seedProperties,
  mockReservations as seedReservations,
  mockTenants as seedTenants,
  mockOwners as seedOwners,
  mockMessages as seedMessages,
  mockBoosts as seedBoosts,
} from '@/admin/data/adminMockData';
import type {
  AdminProperty,
  AdminPropertyStatus,
  AdminUser,
  AdminMessage,
  Reservation,
  ReservationStatus,
  Boost,
  MessageItem,
} from '@/admin/types';

const STORAGE_KEY = 'sapsap_admin_state_v2';

export interface AdminSettings {
  platformName: string;
  contactEmail: string;
  tauxMeuble: number;
  tauxNonMeuble: number;
  commissionMin: number;
  whatsappNumber: string;
  notifications: Record<string, boolean>;
  adminEmail: string;
}

const DEFAULT_SETTINGS: AdminSettings = {
  platformName: 'SapSapHouse',
  contactEmail: 'contact@sapsaphouse.bf',
  tauxMeuble: 7,
  tauxNonMeuble: 5,
  commissionMin: 5000,
  whatsappNumber: '+226 70 00 00 00',
  notifications: {
    'Nouveau bien soumis': true,
    'Nouvelle réservation': true,
    'Paiement reçu': true,
    'Message reçu': true,
  },
  adminEmail: 'admin@sapsaphouse.bf',
};

export interface AdminState {
  properties: AdminProperty[];
  reservations: Reservation[];
  tenants: AdminUser[];
  owners: AdminUser[];
  messages: AdminMessage[];
  boosts: Boost[];
  settings: AdminSettings;
}

function loadInitial(): AdminState {
  const fallback: AdminState = {
    properties: seedProperties, reservations: seedReservations,
    tenants: seedTenants, owners: seedOwners, messages: seedMessages, boosts: seedBoosts,
    settings: DEFAULT_SETTINGS,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AdminState>;
      return {
        ...fallback,
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      };
    }
  } catch {/* noop */}
  return fallback;
}

let state: AdminState = loadInitial();
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {/* quota */}
}

function setState(updater: (s: AdminState) => AdminState) {
  state = updater(state);
  persist();
  listeners.forEach(l => l());
}

export const adminStore = {
  getState: () => state,
  subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); },

  // ── PROPERTIES ──
  addProperty: (p: Partial<AdminProperty> & { title: string; price: number; quartier: string; type: string }) => {
    const id = `prop-${Date.now()}`;
    const full: AdminProperty = {
      id,
      title: p.title,
      description: p.description || '',
      type: p.type,
      price: p.price,
      quartier: p.quartier,
      address: p.address || p.quartier,
      latitude: p.latitude ?? 12.3714,
      longitude: p.longitude ?? -1.5197,
      bedrooms: p.bedrooms ?? 1,
      bathrooms: p.bathrooms ?? 1,
      surface_area: p.surface_area ?? 50,
      images: p.images?.length ? p.images : [],
      available: true,
      adminStatus: (p.adminStatus as AdminPropertyStatus) || 'pending',
      qualityScore: p.qualityScore ?? 60,
      ownerName: p.ownerName || 'Admin',
      ownerPhone: p.ownerPhone || '+226 70 00 00 00',
      viewCount: 0,
      favoriteCount: 0,
      submittedAt: new Date().toISOString(),
      publishedAt: p.adminStatus === 'published' ? new Date().toISOString() : undefined,
    };
    setState(s => ({ ...s, properties: [full, ...s.properties] }));
    return full;
  },
  updateProperty: (id: string, patch: Partial<AdminProperty>) =>
    setState(s => ({ ...s, properties: s.properties.map(p => p.id === id ? { ...p, ...patch } : p) })),
  deleteProperty: (id: string) =>
    setState(s => ({ ...s, properties: s.properties.filter(p => p.id !== id) })),
  setPropertyStatus: (id: string, status: AdminPropertyStatus) =>
    setState(s => ({ ...s, properties: s.properties.map(p => p.id === id ? {
      ...p, adminStatus: status,
      publishedAt: status === 'published' ? new Date().toISOString() : p.publishedAt,
    } : p) })),

  // ── USERS ──
  addUser: (u: Partial<AdminUser> & { name: string; phone: string; role: 'tenant' | 'owner' }) => {
    const id = `${u.role}-${Date.now()}`;
    const full: AdminUser = {
      id, name: u.name, phone: u.phone, role: u.role,
      email: u.email,
      createdAt: new Date().toISOString(),
      searchCount: 0, viewCount: 0, favoriteCount: 0, reservationCount: 0,
      propertyCount: 0, totalViews: 0, totalRevenue: 0, totalCommission: 0,
    };
    setState(s => u.role === 'tenant'
      ? { ...s, tenants: [full, ...s.tenants] }
      : { ...s, owners: [full, ...s.owners] }
    );
    return full;
  },
  updateUser: (id: string, role: 'tenant' | 'owner', patch: Partial<AdminUser>) =>
    setState(s => role === 'tenant'
      ? { ...s, tenants: s.tenants.map(u => u.id === id ? { ...u, ...patch } : u) }
      : { ...s, owners: s.owners.map(u => u.id === id ? { ...u, ...patch } : u) }
    ),
  deleteUser: (id: string, role: 'tenant' | 'owner') =>
    setState(s => role === 'tenant'
      ? { ...s, tenants: s.tenants.filter(u => u.id !== id) }
      : { ...s, owners: s.owners.filter(u => u.id !== id) }
    ),

  // ── MESSAGES ──
  sendMessage: (conversationId: string, text: string) => {
    const msg: MessageItem = {
      id: `msg-${Date.now()}`, from: 'admin', text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setState(s => ({
      ...s,
      messages: s.messages.map(m => m.id === conversationId
        ? { ...m, messages: [...m.messages, msg], lastMessage: text, lastTime: 'À l\'instant', unreadCount: 0 }
        : m
      ),
    }));
  },
  markMessageRead: (conversationId: string) =>
    setState(s => ({ ...s, messages: s.messages.map(m => m.id === conversationId ? { ...m, unreadCount: 0 } : m) })),
  setMessageStatus: (conversationId: string, status: 'open' | 'resolved') =>
    setState(s => ({ ...s, messages: s.messages.map(m => m.id === conversationId ? { ...m, status } : m) })),
  deleteMessage: (conversationId: string) =>
    setState(s => ({ ...s, messages: s.messages.filter(m => m.id !== conversationId) })),

  // ── RESERVATIONS ──
  setReservationStatus: (id: string, status: ReservationStatus) =>
    setState(s => ({ ...s, reservations: s.reservations.map(r => r.id === id ? { ...r, status } : r) })),
  deleteReservation: (id: string) =>
    setState(s => ({ ...s, reservations: s.reservations.filter(r => r.id !== id) })),

  // ── BOOSTS ──
  addBoost: (b: Omit<Boost, 'id' | 'viewsGenerated' | 'status'>) => {
    const full: Boost = {
      ...b,
      id: `boost-${Date.now()}`,
      viewsGenerated: 0,
      status: 'active',
    };
    setState(s => ({
      ...s,
      boosts: [full, ...s.boosts],
      properties: s.properties.map(p => p.id === b.propertyId ? { ...p, boostActive: true, boostType: b.type, boostExpiresAt: b.endDate } : p),
    }));
    return full;
  },
  cancelBoost: (id: string) =>
    setState(s => {
      const boost = s.boosts.find(b => b.id === id);
      return {
        ...s,
        boosts: s.boosts.map(b => b.id === id ? { ...b, status: 'cancelled' } : b),
        properties: boost ? s.properties.map(p => p.id === boost.propertyId ? { ...p, boostActive: false } : p) : s.properties,
      };
    }),
  deleteBoost: (id: string) =>
    setState(s => ({ ...s, boosts: s.boosts.filter(b => b.id !== id) })),

  // ── SETTINGS ──
  updateSettings: (patch: Partial<AdminSettings>) =>
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } })),

  // ── RESET ──
  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    state = loadInitial();
    listeners.forEach(l => l());
  },
};

export function useAdminStore<T>(selector: (s: AdminState) => T): T {
  return useSyncExternalStore(adminStore.subscribe, () => selector(adminStore.getState()), () => selector(adminStore.getState()));
}

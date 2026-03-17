import type { Property, Quartier } from '@/lib/mockData';

export type AdminPropertyStatus =
  | 'pending'
  | 'reviewing'
  | 'corrections'
  | 'published'
  | 'rented'
  | 'inactive';

export interface AdminProperty extends Property {
  adminStatus: AdminPropertyStatus;
  qualityScore: number;
  adminNotes?: string;
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  viewCount?: number;
  favoriteCount?: number;
  submittedAt?: string;
  publishedAt?: string;
  boostActive?: boolean;
  boostType?: 'starter' | 'standard' | 'premium' | 'annual';
  boostExpiresAt?: string;
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Reservation {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyType: string;
  propertyImage?: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amount: number;
  commission: number;
  paymentMethod: 'orange_money' | 'moov_money' | 'cash';
  status: ReservationStatus;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'tenant' | 'owner';
  createdAt: string;
  searchCount?: number;
  viewCount?: number;
  favoriteCount?: number;
  reservationCount?: number;
  propertyCount?: number;
  totalViews?: number;
  totalRevenue?: number;
  totalCommission?: number;
}

export interface Boost {
  id: string;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  ownerName: string;
  type: 'starter' | 'standard' | 'premium' | 'annual';
  price: number;
  startDate: string;
  endDate: string;
  viewsGenerated: number;
  status: 'active' | 'expired' | 'cancelled';
}

export interface AdminMessage {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactRole: 'tenant' | 'owner';
  channel: 'whatsapp' | 'email' | 'app';
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  status: 'open' | 'resolved';
  messages: MessageItem[];
}

export interface MessageItem {
  id: string;
  from: 'admin' | 'user';
  text: string;
  time: string;
}

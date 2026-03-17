import type { AdminPropertyStatus, ReservationStatus } from '@/admin/types';

type BadgeVariant = AdminPropertyStatus | ReservationStatus | 'active' | 'expired' | 'cancelled' | 'tenant' | 'owner' | string;

const VARIANT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'En attente' },
  reviewing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En révision' },
  corrections: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Corrections' },
  published: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Publié' },
  rented: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Loué' },
  inactive: { bg: 'bg-red-50', text: 'text-red-700', label: 'Inactif' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmée' },
  in_progress: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'En cours' },
  completed: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Terminée' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulée' },
  active: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Actif' },
  expired: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Expiré' },
  tenant: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Locataire' },
  owner: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Propriétaire' },
};

interface AdminBadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export default function AdminBadge({ variant, label }: AdminBadgeProps) {
  const style = VARIANT_STYLES[variant] || { bg: 'bg-slate-100', text: 'text-slate-700', label: variant };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}>
      {label || style.label}
    </span>
  );
}

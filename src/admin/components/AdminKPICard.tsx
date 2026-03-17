import { LucideIcon } from 'lucide-react';

interface AdminKPICardProps {
  title: string;
  value: string | number;
  delta?: string;
  deltaColor?: 'green' | 'red' | 'orange';
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export default function AdminKPICard({ title, value, delta, deltaColor = 'green', icon: Icon, iconBg, iconColor }: AdminKPICardProps) {
  const deltaColors = {
    green: 'text-emerald-600',
    red: 'text-red-600',
    orange: 'text-amber-600',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {delta && (
            <p className={`mt-1 text-xs font-medium ${deltaColors[deltaColor]}`}>{delta}</p>
          )}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

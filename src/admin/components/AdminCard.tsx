import { ReactNode } from 'react';

interface AdminCardProps {
  title?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function AdminCard({ title, badge, actions, children, className = '' }: AdminCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {badge}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

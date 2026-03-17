import { LucideIcon } from 'lucide-react';

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function AdminEmptyState({ icon: Icon, emoji, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {emoji && <span className="text-4xl mb-3">{emoji}</span>}
      {Icon && <Icon size={40} className="text-muted-foreground mb-3" />}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

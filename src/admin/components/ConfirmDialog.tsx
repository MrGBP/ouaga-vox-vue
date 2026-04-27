import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', destructive, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 p-5 border-b border-border">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${destructive ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{message}</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center shrink-0"><X size={14} /></button>
        </div>
        <div className="flex gap-2 p-4 justify-end">
          <button onClick={onCancel} className="px-4 h-9 rounded-lg border border-border text-xs font-semibold hover:bg-muted">Annuler</button>
          <button onClick={onConfirm} className={`px-4 h-9 rounded-lg text-xs font-semibold text-white ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

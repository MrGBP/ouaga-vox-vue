import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, Video, Globe, ArrowUp, ArrowDown, Star, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  uploadPropertyMedia, listPropertyMedia, deletePropertyMedia,
  reorderPropertyMedia, addPropertyMediaUrl,
} from '@/lib/propertiesService';
import { toast } from 'sonner';
import {
  uploadPropertyMedia, listPropertyMedia, deletePropertyMedia,
  reorderPropertyMedia,
} from '@/lib/propertiesService';

interface Media { id: string; kind: 'image'|'video'|'video_360'; url: string; storage_path: string | null; position: number; }

export default function MediaUploader({ propertyId }: { propertyId: string }) {
  const [items, setItems] = useState<Media[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = () => listPropertyMedia(propertyId).then(d => setItems(d as any));
  useEffect(() => { reload(); }, [propertyId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter(f => {
      if (f.size > 20_000_000) { toast.error(`${f.name} dépasse 20 Mo`); return false; }
      return true;
    });
    if (!list.length) return;
    setBusy(true);
    setProgress({ done: 0, total: list.length });
    let done = 0;
    const failures: string[] = [];

    const CONCURRENCY = 4;
    const queue = [...list];
    const worker = async () => {
      while (queue.length) {
        const file = queue.shift();
        if (!file) break;
        // Auto-détection : vidéo via MIME, sinon image (le rendu décide si c'est un 360°)
        const k: 'image'|'video' = file.type.startsWith('video/') ? 'video' : 'image';
        try {
          await uploadPropertyMedia(propertyId, file, k);
        } catch (e: any) {
          failures.push(`${file.name}: ${e?.message ?? 'erreur'}`);
        }
        done++;
        setProgress({ done, total: list.length });
      }
    };
    try {
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker));
      await reload();
      if (failures.length) toast.warning(`${list.length - failures.length}/${list.length} uploadés. ${failures[0]}`);
      else toast.success(`${list.length} média(s) uploadé(s)`);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); setProgress(null); }
  };

  const remove = async (m: Media) => {
    if (!confirm('Supprimer ce média ?')) return;
    try { await deletePropertyMedia(m.id, m.storage_path); await reload(); toast.success('Supprimé'); }
    catch (e: any) { toast.error(e.message); }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[newIdx]] = [reordered[newIdx], reordered[index]];
    setItems(reordered);
    try {
      await reorderPropertyMedia(reordered.map((m, i) => ({ id: m.id, position: i })));
    } catch (e: any) {
      toast.error('Réorganisation échouée');
      reload();
    }
  };

  const kindBadge = (k: Media['kind']) => {
    if (k === 'image') return <><ImageIcon size={9}/> IMG</>;
    if (k === 'video_360') return <>🔭 360°</>;
    return <><Video size={9}/> VIDEO</>;
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); if (!busy) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (!busy) handleFiles(e.dataTransfer.files); }}
        onClick={() => !busy && fileRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 py-8 px-3 text-center transition ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
        } ${busy ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <Upload size={26} className="text-primary" />
        <span className="text-xs font-semibold">Téléverser photos, vidéos ou images 360°</span>
        <span className="text-[10px] text-muted-foreground">Glisser-déposer ou cliquer — sélection multiple acceptée</span>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={e => { handleFiles(e.target.files); if (fileRef.current) fileRef.current.value = ''; }} />
      </div>

      {progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Upload… {progress.done}/{progress.total}</span>
            <span>{Math.round((progress.done / progress.total) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((m, i) => (
            <div key={m.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              {m.kind === 'image' ? (
                <img src={m.url} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.src='/placeholder.svg')} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground p-2 text-center">
                  {m.kind === 'video_360' ? <Globe size={22} /> : <Video size={22} />}
                  <span className="truncate mt-1 w-full text-[10px]">{m.kind === 'video_360' ? '360°' : 'Vidéo'}</span>
                </div>
              )}

              <div className="absolute top-1 left-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center disabled:opacity-30">
                  <ArrowUp size={10} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                  className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center disabled:opacity-30">
                  <ArrowDown size={10} />
                </button>
              </div>

              <button type="button" onClick={() => remove(m)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center">
                <Trash2 size={11} />
              </button>
              <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                {kindBadge(m.kind)}
              </span>
              <span className="absolute bottom-1 right-1 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-semibold">
                #{i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">Aucun média — ajoutez vos photos et vidéos</p>}
    </div>
  );
}

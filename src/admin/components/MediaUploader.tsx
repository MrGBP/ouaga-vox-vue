import { useEffect, useRef, useState } from 'react';
import { Upload, Link2, Trash2, Image as ImageIcon, Video, Globe, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  uploadPropertyMedia, addPropertyMediaUrl, listPropertyMedia, deletePropertyMedia,
  reorderPropertyMedia,
} from '@/lib/propertiesService';

interface Media { id: string; kind: 'image'|'video'|'video_360'; url: string; storage_path: string | null; position: number; }

export default function MediaUploader({ propertyId }: { propertyId: string }) {
  const [items, setItems] = useState<Media[]>([]);
  const [busy, setBusy] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [kind, setKind] = useState<'image'|'video'|'video_360'>('image');
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = () => listPropertyMedia(propertyId).then(d => setItems(d as any));
  useEffect(() => { reload(); }, [propertyId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      let pos = items.length;
      for (const file of Array.from(files)) {
        if (file.size > 20_000_000) { toast.error(`${file.name} dépasse 20 Mo`); continue; }
        const k: 'image'|'video' = file.type.startsWith('video/') ? 'video' : 'image';
        await uploadPropertyMedia(propertyId, file, k);
        pos++;
      }
      await reload();
      toast.success('Médias uploadés');
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const addUrl = async () => {
    const u = urlInput.trim();
    if (!u) return;
    setBusy(true);
    try {
      await addPropertyMediaUrl(propertyId, u, kind);
      setUrlInput('');
      await reload();
      toast.success('Média ajouté');
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
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
    setItems(reordered); // optimiste
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
      <div className="flex gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
          className="flex-1 h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center gap-2 text-xs hover:bg-muted disabled:opacity-50">
          <Upload size={14} /> Uploader image / vidéo (multi)
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
      </div>

      <div className="flex gap-2">
        <select value={kind} onChange={e => setKind(e.target.value as any)} className="rounded-lg border border-border bg-background px-2 text-xs">
          <option value="image">Image</option>
          <option value="video">Vidéo</option>
          <option value="video_360">Visite 360°</option>
        </select>
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://… (Matterport, Kuula, YouTube, image…)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-9 text-xs" />
        </div>
        <button type="button" onClick={addUrl} disabled={busy} className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">Ajouter</button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Visite 360° : URL d'embed externe (Matterport, Kuula, etc.) — l'iframe sera affichée plein écran sur la fiche.
      </p>

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

              {/* Reorder buttons */}
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
      {items.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">Aucun média — ajoutez photos, vidéos ou visite 360°</p>}
    </div>
  );
}

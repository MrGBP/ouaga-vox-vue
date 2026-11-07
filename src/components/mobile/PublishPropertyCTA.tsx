import { Home, Plus, ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  isOwner: boolean;
  onClick: () => void;
}

/**
 * Carte mise en avant dans les menus mobiles pour inviter à publier un logement.
 * Hôte déjà inscrit → « Ajouter un logement » ; sinon → « Publier mon logement ».
 */
const PublishPropertyCTA = ({ isOwner, onClick }: Props) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={isOwner ? 'Ajouter un logement' : 'Publier mon logement'}
    className="group relative w-full overflow-hidden rounded-2xl bg-primary text-primary-foreground p-4 text-left shadow-md active:scale-[0.98] transition-transform"
  >
    {/* halo décoratif orange */}
    <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-secondary/30 blur-2xl" />
    <span aria-hidden className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-primary-foreground/10 blur-xl" />

    <div className="relative flex items-center gap-3">
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-sm">
        <Home className="h-6 w-6" strokeWidth={2.2} />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary ring-2 ring-primary">
          <Plus className="h-3 w-3" strokeWidth={3} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
          <Sparkles className="h-3 w-3" /> {isOwner ? 'Espace hôte' : 'Devenez hôte'}
        </span>
        <span className="block font-display text-[15px] font-bold leading-tight">
          {isOwner ? 'Ajouter un logement' : 'Publier mon logement'}
        </span>
        <span className="block text-[11px] leading-snug text-primary-foreground/75">
          Gratuit · vous fixez vos prix et vos dates
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-primary-foreground/70 transition-transform group-active:translate-x-0.5" />
    </div>
  </button>
);

export default PublishPropertyCTA;

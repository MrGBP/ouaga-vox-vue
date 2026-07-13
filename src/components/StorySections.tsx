import { motion } from 'framer-motion';
import { ShieldCheck, MapPinned, Handshake, Search, MousePointerClick, KeyRound } from 'lucide-react';

/**
 * Story sections — Phase 2 home storytelling.
 * Design principles :
 *  - Gestalt (proximité + similarité) : cartes alignées, iconographie homogène.
 *  - Hick's Law : 3 items max par section pour accélérer la lecture.
 *  - Progressive disclosure : chaque bloc = une promesse claire, pas de sur-info.
 */

export const EngagementsSection = () => {
  const items = [
    {
      icon: ShieldCheck,
      title: 'Biens vérifiés',
      desc: "Chaque annonce est contrôlée par notre équipe avant publication. Photos, adresse, propriétaire — tout est authentifié.",
    },
    {
      icon: MapPinned,
      title: 'Carte temps réel',
      desc: "Visualisez le quartier, les commerces, écoles et transports avant même de vous déplacer.",
    },
    {
      icon: Handshake,
      title: 'Sans intermédiaire',
      desc: "Contactez directement le propriétaire. Zéro commission cachée, zéro démarcheur.",
    },
  ];

  return (
    <section className="bg-primary/[0.02] border-y border-border/60 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-3">Nos engagements</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Une expérience <span className="text-primary">pensée pour vous</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            SapSapHouse repose sur trois piliers pour rendre la recherche immobilière plus juste et plus rapide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group bg-card border border-border rounded-2xl p-7 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-base"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-5 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-base">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{it.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const CommentCaMarcheSection = () => {
  const steps = [
    {
      icon: Search,
      num: '01',
      title: 'Cherchez',
      desc: "Filtrez par quartier, type, budget ou tapez librement ce que vous cherchez.",
    },
    {
      icon: MousePointerClick,
      num: '02',
      title: 'Visitez',
      desc: 'Photos HD, visite 360°, vidéo et carte du quartier — tout est là avant de vous déplacer.',
    },
    {
      icon: KeyRound,
      num: '03',
      title: 'Réservez',
      desc: 'Contactez le propriétaire, réservez en ligne, emménagez sereinement.',
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-3">Comment ça marche</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Votre bien en <span className="text-primary">3 étapes</span>
        </h2>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Ligne de connexion desktop */}
        <div aria-hidden className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-center"
            >
              <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-card border border-border shadow-elevation-2 mb-5">
                <Icon className="h-7 w-7 text-primary" />
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-elevation-1">
                  {s.num}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

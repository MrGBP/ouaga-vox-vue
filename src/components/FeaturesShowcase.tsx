import { motion } from 'framer-motion';
import { Search, MapPin, CalendarCheck } from 'lucide-react';

const FEATURES = [
  {
    id: 'search',
    icon: Search,
    emoji: '🔍',
    title: 'Cherchez en un clic',
    description:
      'Filtres intelligents adaptés à votre ville au Burkina et au Mali. Trouvez ce qui vous correspond en quelques secondes.',
    accent: '#1A3560',
    bg: 'from-[#1A3560]/5 to-[#1A3560]/0',
  },
  {
    id: 'map',
    icon: MapPin,
    emoji: '📍',
    title: 'Explorez sur la carte',
    description:
      'Tous les biens visibles sur une carte interactive de votre quartier. Zoomez, comparez, décidez.',
    accent: '#E8761A',
    bg: 'from-[#E8761A]/8 to-[#E8761A]/0',
  },
  {
    id: 'reserve',
    icon: CalendarCheck,
    emoji: '📅',
    title: 'Réservez en 3 étapes',
    description:
      'Calendrier, vos coordonnées, confirmation — rapide et sécurisé. Le propriétaire est notifié immédiatement.',
    accent: '#1A3560',
    bg: 'from-[#1A3560]/5 to-[#1A3560]/0',
  },
];

const FeaturesShowcase = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 md:mb-20"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#E8761A] font-bold mb-3">
            Comment ça marche
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-black text-[#1A3560] tracking-tight leading-tight">
            Votre bien immo,
            <br />
            <span className="text-[#E8761A]">en un clic.</span>
          </h2>
        </motion.div>

        <div className="space-y-16 md:space-y-24">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const reverse = i % 2 === 1;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 0.05, duration: 0.5, ease: [0, 0, 0.2, 1] }}
                className={`flex flex-col ${
                  reverse ? 'md:flex-row-reverse' : 'md:flex-row'
                } items-center gap-8 md:gap-16`}
              >
                {/* Visuel */}
                <div className="flex-1 w-full">
                  <div
                    className={`relative aspect-[4/3] rounded-3xl bg-gradient-to-br ${f.bg} border border-border/40 overflow-hidden flex items-center justify-center`}
                  >
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                      whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
                      className="text-8xl md:text-9xl"
                    >
                      {f.emoji}
                    </motion.div>
                    <div
                      className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-30"
                      style={{ backgroundColor: f.accent }}
                    />
                  </div>
                </div>

                {/* Texte */}
                <div className="flex-1 w-full">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
                    style={{ backgroundColor: `${f.accent}15`, color: f.accent }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    Étape {i + 1}
                  </div>
                  <h3 className="text-2xl md:text-4xl font-display font-black text-[#1A3560] mb-4 tracking-tight leading-tight">
                    {f.title}
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;

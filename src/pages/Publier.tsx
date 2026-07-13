import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Camera, MapPin, Sparkles, Shield,
  BadgeCheck, Zap, Eye, Home, Building2, Store, Warehouse,
  Bed, Bath, Ruler, Star,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const STEPS = [
  {
    n: 1,
    icon: Home,
    title: 'Décrivez votre bien',
    desc: 'Type, surface, pièces — quelques champs, l’essentiel.',
    time: '2 min',
  },
  {
    n: 2,
    icon: Camera,
    title: 'Ajoutez vos photos',
    desc: 'Glissez-déposez, la première devient la couverture.',
    time: '3 min',
  },
  {
    n: 3,
    icon: MapPin,
    title: 'Localisez sur la carte',
    desc: 'Point exact ou quartier — les visiteurs vous trouvent.',
    time: '1 min',
  },
  {
    n: 4,
    icon: Sparkles,
    title: 'Publiez & recevez',
    desc: 'Validation rapide par notre équipe, puis les demandes arrivent.',
    time: '< 24 h',
  },
];

const TYPES = [
  { icon: Home, label: 'Maison / Villa' },
  { icon: Building2, label: 'Appartement' },
  { icon: Store, label: 'Commerce' },
  { icon: Warehouse, label: 'Entrepôt' },
];

const TRUST = [
  { icon: Shield, title: 'Sans intermédiaire', desc: 'Vous parlez directement aux locataires.' },
  { icon: BadgeCheck, title: 'Bien vérifié', desc: 'Un badge de confiance après validation.' },
  { icon: Zap, title: 'Diffusion immédiate', desc: 'Web + app mobile, dès la mise en ligne.' },
  { icon: Eye, title: 'Visibilité locale', desc: 'Ciblage par ville et quartier.' },
];

export default function Publier() {
  const navigate = useNavigate();
  const { user, isOwner, isAdmin, requireAuth } = useAuth();
  const [activeStep, setActiveStep] = useState(0);

  const cta = () => {
    requireAuth('publier un bien', () => {
      if (isOwner || isAdmin) navigate('/proprietaire/biens?new=1');
      else navigate('/mon-compte?becomeOwner=1');
    });
  };

  const previewCard = useMemo(() => {
    switch (activeStep) {
      case 0:
        return { title: 'Villa moderne', sub: '4 pièces · 180 m²', img: 0 };
      case 1:
        return { title: 'Villa moderne', sub: '5 photos ajoutées', img: 1 };
      case 2:
        return { title: 'Villa moderne', sub: 'Ouaga 2000, Ouagadougou', img: 2 };
      default:
        return { title: 'Villa moderne — Publié', sub: '3 demandes reçues', img: 3 };
    }
  }, [activeStep]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" /> Gratuit · Sans commission
              </span>
              <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.05] tracking-tight">
                Publiez votre bien<br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  en 4 étapes simples.
                </span>
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-xl">
                Location courte ou longue durée, vente, commerce — mettez en avant votre bien et
                recevez des demandes qualifiées, sans intermédiaire.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={cta} className="gap-2 h-12 px-6 text-base shadow-lg shadow-primary/20">
                  Publier mon bien <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-6 text-base">
                  <Link to="/resultats">Voir un exemple</Link>
                </Button>
              </div>

              {/* Micro-preuves */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Publication en moins de 10 min
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Vérification humaine
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Contact direct
                </div>
              </div>
            </motion.div>

            {/* Aperçu live */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative"
            >
              <div className="relative mx-auto max-w-md">
                {/* Carte aperçu */}
                <div className="rounded-3xl bg-card border border-border shadow-2xl shadow-primary/10 overflow-hidden">
                  <div className="relative h-56 bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <motion.div
                      key={previewCard.img}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-6xl"
                    >
                      {['🏡', '📸', '📍', '✅'][previewCard.img]}
                    </motion.div>
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-xs font-semibold text-foreground shadow">
                      <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Vérifié
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-foreground">{previewCard.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{previewCard.sub}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">4.8</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> 4</span>
                      <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> 2</span>
                      <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" /> 180 m²</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-bold text-foreground">250 000</span>
                        <span className="text-sm text-muted-foreground"> FCFA/mois</span>
                      </div>
                      <span className="text-xs text-primary font-semibold">Aperçu</span>
                    </div>
                  </div>
                </div>

                {/* Puce d'étape flottante */}
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute -left-4 -bottom-4 md:-left-8 rounded-2xl bg-card border border-border shadow-xl px-4 py-3 flex items-center gap-3"
                >
                  <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-bold">
                    {activeStep + 1}
                  </span>
                  <div className="text-xs">
                    <div className="font-bold text-foreground">Étape {activeStep + 1}/4</div>
                    <div className="text-muted-foreground">{STEPS[activeStep].title}</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ÉTAPES */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Comment ça marche</h2>
          <p className="mt-3 text-muted-foreground">
            Un parcours guidé, une prévisualisation en direct, aucune surprise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = activeStep === i;
            return (
              <button
                key={s.n}
                onMouseEnter={() => setActiveStep(i)}
                onFocus={() => setActiveStep(i)}
                onClick={() => setActiveStep(i)}
                className={`text-left rounded-2xl p-5 border transition-all ${
                  active
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 -translate-y-0.5'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`h-10 w-10 rounded-xl grid place-items-center transition-colors ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">0{s.n}</span>
                </div>
                <h3 className="mt-4 font-bold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-3 text-xs font-semibold text-primary">⏱ {s.time}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* TYPES */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">Tous types de biens acceptés</h2>
            <span className="text-sm text-muted-foreground">Résidentiel, commercial, professionnel</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TYPES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3.5"
              >
                <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm font-semibold text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONFIANCE */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Pourquoi SapSapHouse</h2>
          <p className="mt-3 text-muted-foreground">
            Une plateforme pensée pour les propriétaires du Burkina Faso et d’Afrique de l’Ouest.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-6 bg-card border border-border">
              <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center shadow-lg shadow-primary/20">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-10 md:p-14 text-center">
          <div aria-hidden className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Prêt à publier votre premier bien&nbsp;?
            </h2>
            <p className="mt-3 text-primary-foreground/85 max-w-xl mx-auto">
              La création est gratuite. Vous gardez le contrôle total, à tout moment.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={cta}
              className="mt-8 h-12 px-8 text-base gap-2 bg-white text-primary hover:bg-white/95"
            >
              Commencer maintenant <ArrowRight className="h-4 w-4" />
            </Button>
            {!user && (
              <p className="mt-4 text-xs text-primary-foreground/80">
                Vous serez invité à créer un compte gratuit à l’étape suivante.
              </p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

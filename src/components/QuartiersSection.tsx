import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';

interface Quartier {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  latitude: number;
  longitude: number;
}

interface QuartiersSectionProps {
  quartiers: Quartier[];
  onQuartierClick: (quartier: Quartier) => void;
}

const QUARTIER_BADGES: Record<string, string> = {
  'Ouaga 2000': 'Haut Standing',
  'Zone du Bois': 'Expatriés',
  'Koulouba': 'Historique',
  'Tampouy': 'Populaire',
  "Patte d'Oie": 'Commerçant',
  'Dassasgho': 'En dev.',
  'Zogona': 'Universitaire',
};

const QuartiersSection = ({ quartiers, onQuartierClick }: QuartiersSectionProps) => {
  return (
    <section className="bg-muted/40 border-y border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Mon <span className="text-primary">Quartier</span> en un clic
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Explorez les zones de Ouagadougou avant de chercher
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {quartiers.map((quartier, i) => (
            <motion.button
              key={quartier.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              onClick={() => onQuartierClick(quartier)}
              className="group relative h-36 rounded-xl overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <img
                src={quartier.image_url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400'}
                alt={quartier.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

              {/* Badge type */}
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-semibold bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded-full">
                  {QUARTIER_BADGES[quartier.name] || 'Résidentiel'}
                </span>
              </div>

              {/* Name + CTA */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-card font-bold text-sm leading-tight mb-1">{quartier.name}</p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MapPin className="h-3 w-3 text-card/80" />
                  <span className="text-[10px] text-card/80">Explorer</span>
                  <ArrowRight className="h-3 w-3 text-card/80 ml-auto" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuartiersSection;

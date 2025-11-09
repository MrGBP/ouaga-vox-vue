import { motion } from 'framer-motion';
import { MapPin, Building2, School, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

const QuartiersSection = ({ quartiers, onQuartierClick }: QuartiersSectionProps) => {
  const getQuartierIcon = (name: string) => {
    if (name.toLowerCase().includes('centre')) return Building2;
    if (name.toLowerCase().includes('school') || name.toLowerCase().includes('université')) return School;
    if (name.toLowerCase().includes('marché')) return ShoppingCart;
    return MapPin;
  };

  return (
    <section className="container mx-auto px-4 py-12 bg-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Mon <span className="text-primary">Quartier</span> en un clic
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explorez les différents quartiers de Ouagadougou et découvrez leurs particularités
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quartiers.map((quartier, index) => {
            const Icon = getQuartierIcon(quartier.name);
            return (
              <motion.div
                key={quartier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-warm transition-all hover:-translate-y-1 h-full"
                  onClick={() => onQuartierClick(quartier)}
                >
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={quartier.image_url || `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80`}
                      alt={quartier.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{quartier.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {quartier.description || 'Découvrez ce quartier dynamique de Ouagadougou'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Voir sur la carte</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};

export default QuartiersSection;

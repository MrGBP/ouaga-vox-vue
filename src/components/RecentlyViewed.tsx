import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye } from 'lucide-react';

interface RecentItem {
  id: string;
  title: string;
  quartier: string;
  price: number;
  image: string;
  type: string;
  timestamp: number;
}

const STORAGE_KEY = 'sapsap_recently_viewed';
const MAX_ITEMS = 4;
const EXPIRE_DAYS = 7;

export function addToRecentlyViewed(property: {
  id: string;
  title: string;
  quartier: string;
  price: number;
  images?: string[];
  type: string;
}) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as RecentItem[];
    const filtered = stored.filter(item => item.id !== property.id);
    filtered.unshift({
      id: property.id,
      title: property.title,
      quartier: property.quartier,
      price: property.price,
      image: property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
      type: property.type,
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 8)));
  } catch {}
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

interface RecentlyViewedProps {
  onViewProperty: (id: string) => void;
}

const RecentlyViewed = ({ onViewProperty }: RecentlyViewedProps) => {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as RecentItem[];
      const cutoff = Date.now() - EXPIRE_DAYS * 86400000;
      const valid = stored.filter(i => i.timestamp > cutoff).slice(0, MAX_ITEMS);
      setItems(valid);
      // Clean expired
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    } catch {}
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Vous avez récemment consulté</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onViewProperty(item.id)}
            className="shrink-0 w-56 snap-start bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-warm transition-all text-left"
          >
            <img src={item.image} alt={item.title} className="w-full h-32 object-cover" loading="lazy" />
            <div className="p-3">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.quartier}</p>
              <p className="text-sm font-bold text-primary mt-1">{fmt(item.price)} FCFA</p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;

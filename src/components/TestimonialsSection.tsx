import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    name: 'Adama K.',
    quartier: 'Ouaga 2000',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop',
    quote: "J'ai trouvé ma villa en moins de 48h grâce à SapSapHouse. La carte interactive m'a permis de visualiser le quartier avant même de visiter.",
  },
  {
    name: 'Fatoumata S.',
    quartier: 'Tampouy',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
    quote: "Le système de réservation est simple et rapide. J'ai pu réserver un studio meublé pour ma sœur qui arrivait du village en un clic.",
  },
  {
    name: 'Ousmane T.',
    quartier: 'Zone du Bois',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop',
    quote: "En tant qu'expatrié, SapSapHouse m'a fait gagner un temps précieux. Les photos, la visite 360° et les POI autour du bien sont très utiles.",
  },
];

const TestimonialsSection = () => (
  <section className="container mx-auto px-4 py-10">
    <h2 className="text-2xl font-bold text-foreground text-center mb-8">
      Ils ont trouvé leur bien sur <span className="text-primary">SapSapHouse</span>
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {TESTIMONIALS.map((t, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="bg-primary text-primary-foreground rounded-xl p-6 flex flex-col gap-4"
        >
          <p className="text-sm leading-relaxed opacity-90 flex-1">"{t.quote}"</p>
          <div className="flex items-center gap-3">
            <img src={t.photo} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-primary-foreground/30" />
            <div>
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="text-xs opacity-70">{t.quartier}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default TestimonialsSection;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageCircle, Phone, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isTypeFurnished, pricePerNight } from '@/lib/mockData';
import ReservationFlow from './ReservationFlow';

interface Props {
  property: any;
}

/**
 * Sticky reservation card (Airbnb/Booking-style) — desktop right-rail.
 * Fitts's Law : CTA gros et toujours visible pendant le scroll.
 * Progressive disclosure : contact rapide + résa au clic.
 */
const StickyReservationCard = ({ property }: Props) => {
  const [showReservation, setShowReservation] = useState(false);
  const furnished = isTypeFurnished(property.type);
  const nightly = furnished ? pricePerNight(property.price) : null;
  const currency = property.currency || 'FCFA';
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  const phone = property.agent_phone || property.whatsapp_phone;
  const waPhone = (property.whatsapp_phone || property.agent_phone || '').replace(/\D/g, '');

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-24 bg-card rounded-2xl border border-border shadow-elevation-2 p-6 w-full max-w-sm"
      >
        {/* Prix */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-display text-3xl font-bold text-foreground">
            {fmt(nightly || property.price)}
          </span>
          <span className="text-sm text-muted-foreground">{currency}</span>
          <span className="text-sm text-muted-foreground">/ {nightly ? 'nuit' : 'mois'}</span>
        </div>
        {nightly && (
          <p className="text-xs text-muted-foreground mb-4">
            soit {fmt(property.price)} {currency} / mois
          </p>
        )}
        {!nightly && <div className="h-4" />}

        {/* CTA principal */}
        <Button
          onClick={() => setShowReservation(true)}
          className="w-full h-12 text-base font-semibold rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-elevation-1 hover:shadow-elevation-2 transition-all"
        >
          <Calendar className="h-4 w-4 mr-2" />
          {furnished ? 'Réserver' : 'Faire une demande'}
        </Button>

        {/* Contacts rapides */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {phone && (
            <a href={`tel:${phone}`}>
              <Button variant="outline" className="w-full h-11 rounded-xl gap-2">
                <Phone className="h-4 w-4" />
                Appeler
              </Button>
            </a>
          )}
          {waPhone && (
            <a
              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Bonjour, je suis intéressé par "${property.title}" sur SapSapHouse.`)}`}
              target="_blank" rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full h-11 rounded-xl gap-2 border-accent/40 text-accent hover:bg-accent/5">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
          )}
        </div>

        <div className="mt-5 pt-5 border-t border-border space-y-2.5">
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span><span className="font-semibold text-foreground">Bien vérifié</span> — annonce contrôlée par SapSapHouse.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span><span className="font-semibold text-foreground">Réponse rapide</span> — le propriétaire répond souvent en moins d'1h.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span><span className="font-semibold text-foreground">Sans intermédiaire</span> — zéro commission cachée.</span>
          </div>
        </div>
      </motion.aside>

      {showReservation && (
        <div className="fixed inset-0 z-[250] bg-foreground/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-elevation-3">
            <ReservationFlow property={property} onClose={() => setShowReservation(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default StickyReservationCard;

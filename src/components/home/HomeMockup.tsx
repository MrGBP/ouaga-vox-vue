import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search, ChevronDown, ChevronRight, ArrowRight, Star } from 'lucide-react';
import logo from '@/assets/sapsap-logo.png';
import salon from '@/assets/home/salon.jpg';
import chambre from '@/assets/home/chambre.jpg';
import zoneDuBois from '@/assets/home/zone-du-bois.jpg';
import koulouba from '@/assets/home/koulouba.jpg';
import paspanga from '@/assets/home/paspanga.jpg';
import zogona from '@/assets/home/zogona.jpg';
import wayalghin from '@/assets/home/wayalghin.jpg';

/** Positions en % d'un canevas 1280×720 (fidèle à la maquette) */
const box = (x: number, y: number, w: number, h: number) => ({
  left: `${(x / 1280) * 100}%`, top: `${(y / 720) * 100}%`, width: `${(w / 1280) * 100}%`, height: `${(h / 720) * 100}%`,
});

const TILES = [
  { name: 'Zone du Bois', img: zoneDuBois, b: box(30, 472, 250, 198), rot: -2 },
  { name: 'Koulouba', img: koulouba, b: box(284, 464, 248, 228), rot: 1.5 },
  { name: 'Paspanga', img: paspanga, b: box(536, 488, 302, 206), rot: -1 },
  { name: 'Zogona', img: zogona, b: box(828, 444, 228, 220), rot: 1.5 },
  { name: 'Wayalghin', img: wayalghin, b: box(1018, 370, 250, 240), rot: -3 },
];
const QUARTIERS = ['Ouaga 2000', 'Zone du Bois', 'Koulouba', 'Paspanga', 'Zogona', 'Wayalghin', 'Tampouy', 'Gounghin', 'Dassasgho', 'Patte d\'Oie'];

const HomeMockup = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const go = (v: string) => navigate(`/resultats?q=${encodeURIComponent(v)}`);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="relative mx-auto w-full max-w-[1600px]" style={{ aspectRatio: '1280 / 720' }}>
        {/* Décors */}
        <div className="absolute rounded-xl bg-secondary/80" style={box(1040, 125, 40, 65)} />
        <div className="absolute rounded-xl bg-secondary/70" style={box(975, 405, 50, 40)} />
        <div className="absolute rounded-xl bg-secondary/70" style={box(8, 545, 22, 45)} />
        <div className="absolute rounded-xl bg-secondary/50" style={box(500, 680, 66, 28)} />
        <div className="absolute rounded-xl bg-primary/20" style={box(838, 660, 78, 38)} />

        {/* Grande photo salon */}
        <motion.img initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}
          src={salon} alt="Salon meublé à Ouagadougou" className="absolute object-cover rounded-[28px]" style={box(470, 72, 552, 430)} />
        {/* Chambre */}
        <motion.img initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          src={chambre} alt="Chambre meublée" className="absolute object-cover rounded-[22px] shadow-elevation-2" style={{ ...box(1078, 94, 190, 280), transform: 'rotate(-2deg)' }} />

        {/* Header */}
        <header className="absolute inset-x-0 top-0 flex items-center justify-between z-20" style={{ padding: '1.4% 4.7%' }}>
          <img src={logo} alt="SapSapHouse — Mon bien Immo en un clic" className="h-14 w-auto object-contain mix-blend-multiply" />
          <nav className="flex items-center gap-8 text-sm font-medium text-foreground">
            <button onClick={() => navigate('/publier')} className="hover:text-secondary">Devenir hôte</button>
            <button onClick={() => navigate('/resultats')} className="hover:text-secondary">Nos logements</button>
            <button onClick={() => navigate('/legal/aide')} className="hover:text-secondary">Aide</button>
            <button onClick={() => navigate('/auth')} className="h-11 px-5 rounded-xl border-2 border-primary/70 text-primary font-semibold hover:bg-primary/5">Se connecter</button>
            <button onClick={() => navigate('/auth?mode=signup')} className="h-11 px-6 rounded-xl bg-secondary text-secondary-foreground font-semibold inline-flex items-center gap-2 hover:bg-secondary/90">
              S'inscrire <ArrowRight className="h-4 w-4" />
            </button>
          </nav>
        </header>

        {/* Texte */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="absolute z-10" style={{ left: '5.3%', top: '17.5%', width: '42%' }}>
          <p className="flex items-center gap-3 text-[clamp(10px,0.9vw,13px)] font-semibold tracking-[0.12em] uppercase text-primary/70">
            <span className="h-0.5 w-7 bg-secondary" /> Séjours courts • Maisons meublées
          </p>
          <h1 className="mt-[4%] font-display font-extrabold leading-[1.08] tracking-tight text-primary text-[clamp(30px,3.9vw,58px)]">
            Réservez des<br />
            <span className="text-secondary">logements meublés</span><br />
            à Ouagadougou.
          </h1>
          <p className="mt-[3%] text-[clamp(13px,1.35vw,19px)] text-primary/80 leading-snug">
            Des maisons et appartements meublés<br />pour vos séjours courts, au bon endroit.
          </p>
        </motion.div>

        {/* Carte flottante Ouaga 2000 */}
        <button onClick={() => go('Ouaga 2000')} className="absolute z-10 bg-card rounded-2xl shadow-elevation-3 text-left flex items-center justify-between px-[1.4%]" style={box(918, 278, 220, 95)}>
          <span>
            <span className="flex items-center gap-2 font-semibold text-primary text-[clamp(11px,1.1vw,15px)]"><MapPin className="h-4 w-4 text-secondary" /> Ouaga 2000</span>
            <span className="block text-[clamp(9px,0.85vw,12px)] text-muted-foreground mt-1 ml-6">Maison meublée</span>
            <span className="flex items-center gap-0.5 mt-1 ml-6">
              {[0, 1, 2, 3, 4].map(i => <Star key={i} className="h-3 w-3 fill-secondary text-secondary" />)}
              <span className="text-[11px] text-muted-foreground ml-1">(4.8)</span>
            </span>
          </span>
          <span className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center self-end mb-3"><ChevronRight className="h-5 w-5" /></span>
        </button>

        {/* Barre de recherche */}
        <form onSubmit={(e) => { e.preventDefault(); go(q); }}
          className="absolute z-20 bg-card rounded-full shadow-elevation-3 flex items-center gap-3 pl-[2.3%] pr-[0.8%]" style={box(66, 378, 640, 76)}>
          <MapPin className="h-7 w-7 text-secondary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[clamp(11px,1.05vw,15px)] font-semibold text-primary">Où souhaitez-vous séjourner ?</p>
            <input list="mock-quartiers" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Ex. Ouaga 2000, Zone du Bois, Koulouba..." aria-label="Quartier"
              className="w-full bg-transparent outline-none text-[clamp(10px,0.9vw,13px)] text-foreground placeholder:text-muted-foreground" />
            <datalist id="mock-quartiers">{QUARTIERS.map(n => <option key={n} value={n} />)}</datalist>
          </div>
          <ChevronDown className="h-5 w-5 text-primary/70 mr-4" />
          <button type="submit" aria-label="Rechercher" className="h-[80%] aspect-square rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-secondary/90 active:scale-95 transition">
            <Search className="h-6 w-6" />
          </button>
        </form>

        {/* Carreaux quartiers */}
        {TILES.map((t, i) => (
          <motion.button key={t.name} onClick={() => go(t.name)}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
            whileHover={{ y: -6 }}
            className="absolute z-10 rounded-[20px] overflow-hidden bg-card p-[0.35%] shadow-elevation-2"
            style={{ ...t.b, rotate: t.rot } as any}>
            <img src={t.img} alt={t.name} className="w-full h-full object-cover rounded-[16px]" />
            <span className="absolute left-[7%] bottom-[9%] bg-card rounded-xl shadow-elevation-2 px-3 py-2 flex items-center gap-2 text-[clamp(10px,1vw,14px)] font-semibold text-primary">
              <MapPin className="h-4 w-4 text-secondary" /> {t.name} <ChevronRight className="h-4 w-4 text-primary/60" />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HomeMockup;

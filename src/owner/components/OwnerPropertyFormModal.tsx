import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { X, Plus, Upload, Link2, Trash2, Image as ImageIcon, Video, Globe, MapPin, Sparkles, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import DescriptionParser, { type ParsedProperty } from '@/components/owner/DescriptionParser';
import CustomTypeSuggestModal from '@/components/owner/CustomTypeSuggestModal';
import { useTranslation } from 'react-i18next';
import { RAW_MOCK_QUARTIERS as mockQuartiers, PROPERTY_TYPES, isTypeFurnished, getTypeLabel } from '@/lib/mockData';
import { FEATURE_CATALOG, FEATURE_CATEGORIES, featureLabel, categoryLabel, type FeatureCategoryId } from '@/lib/featureCatalog';
import { supabase } from '@/integrations/supabase/client';
import MapPicker from '@/admin/components/MapPicker';
import MediaUploader from '@/admin/components/MediaUploader';
import { uploadPropertyMedia, addPropertyMediaUrl, listPropertyMedia } from '@/lib/propertiesService';
import { Loader2 } from 'lucide-react';
import type { OwnerPropertyRow } from '../lib/ownerService';
import { isCommercialType, isOfficeType } from '@/lib/typeHelpers';
import { useLockBackdrop } from '@/hooks/useLockBackdrop';
import { useCountryConfig } from '@/hooks/useCountryConfig';
import { CITIES, COUNTRY_TO_CITY } from '@/lib/geoConfig';
import QuartierAutocomplete from '@/components/QuartierAutocomplete';
import ConfirmDialog from '@/admin/components/ConfirmDialog';
import {
  POI_TYPES, poiLabel, addPoiToProperty, listPoisForProperty, removePoi, type PropertyPoi,
} from '@/lib/propertyPoisService';
import { useAuth } from '@/hooks/useAuth';
import { useOverpassPOI } from '@/hooks/useOverpassPOI';

// Mapping OSM type → préréglage POI (emoji + libellé FR/EN)
const OSM_TYPE_TO_PRESET: Record<string, { type: string; emoji: string; label: string; labelEn: string }> = {
  school:           { type: 'school',      emoji: '🏫', label: 'École',             labelEn: 'School' },
  university:       { type: 'school',      emoji: '🎓', label: 'Université',        labelEn: 'University' },
  college:          { type: 'school',      emoji: '🎓', label: 'Collège',           labelEn: 'College' },
  marketplace:      { type: 'market',      emoji: '🛒', label: 'Marché',            labelEn: 'Market' },
  place_of_worship: { type: 'mosque',      emoji: '🕌', label: 'Lieu de culte',     labelEn: 'Place of worship' },
  pharmacy:         { type: 'pharmacy',    emoji: '💊', label: 'Pharmacie',         labelEn: 'Pharmacy' },
  hospital:         { type: 'hospital',    emoji: '🏥', label: 'Hôpital',           labelEn: 'Hospital' },
  clinic:           { type: 'hospital',    emoji: '🏥', label: 'Clinique',          labelEn: 'Clinic' },
  doctors:          { type: 'hospital',    emoji: '🩺', label: 'Cabinet médical',   labelEn: 'Doctors' },
  supermarket:      { type: 'supermarket', emoji: '🛍️', label: 'Supermarché',       labelEn: 'Supermarket' },
  convenience:      { type: 'supermarket', emoji: '🏪', label: 'Épicerie',          labelEn: 'Convenience' },
  mall:             { type: 'supermarket', emoji: '🏬', label: 'Centre commercial', labelEn: 'Mall' },
  fuel:             { type: 'transport',   emoji: '⛽', label: 'Station-service',   labelEn: 'Gas station' },
  bus_station:      { type: 'transport',   emoji: '🚌', label: 'Gare routière',     labelEn: 'Bus station' },
  taxi:             { type: 'transport',   emoji: '🚖', label: 'Station taxi',      labelEn: 'Taxi stand' },
  bank:             { type: 'bank',        emoji: '🏦', label: 'Banque',            labelEn: 'Bank' },
  atm:              { type: 'bank',        emoji: '🏧', label: 'Distributeur',      labelEn: 'ATM' },
  restaurant:       { type: 'restaurant',  emoji: '🍽️', label: 'Restaurant',        labelEn: 'Restaurant' },
  cafe:             { type: 'restaurant',  emoji: '☕', label: 'Café',              labelEn: 'Cafe' },
  fast_food:        { type: 'restaurant',  emoji: '🍔', label: 'Fast-food',         labelEn: 'Fast food' },
  bar:              { type: 'restaurant',  emoji: '🍻', label: 'Bar',               labelEn: 'Bar' },
  park:             { type: 'park',        emoji: '🌳', label: 'Parc',              labelEn: 'Park' },
  playground:       { type: 'park',        emoji: '🛝', label: 'Aire de jeux',      labelEn: 'Playground' },
  sports_centre:    { type: 'park',        emoji: '🏟️', label: 'Centre sportif',    labelEn: 'Sports centre' },
  police:           { type: 'admin',       emoji: '🚓', label: 'Police',            labelEn: 'Police' },
  fire_station:     { type: 'admin',       emoji: '🚒', label: 'Caserne pompiers',  labelEn: 'Fire station' },
  hotel:            { type: 'admin',       emoji: '🏨', label: 'Hôtel',             labelEn: 'Hotel' },
  attraction:       { type: 'park',        emoji: '🎡', label: 'Attraction',        labelEn: 'Attraction' },
};

type PendingMedia =
  | { kind: 'image' | 'video'; source: 'file'; file: File; previewUrl: string }
  | { kind: 'image' | 'video' | 'video_360'; source: 'url'; url: string };

interface Props {
  open: boolean;
  initial?: OwnerPropertyRow | null;
  ownerId: string;
  onClose: (didChange: boolean) => void;
}

const DRAFT_KEY = 'sapsap_owner_draft_v2';
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const PHONE_PREFIX: Record<string, string> = {
  BF: '+226', ML: '+223', GH: '+233', CI: '+225', SN: '+221', TG: '+228', BJ: '+229', NE: '+227',
};

// POI catégories simples cochables (nom du lieu facultatif)
const POI_PRESETS: { type: string; emoji: string; label: string; labelEn: string }[] = [
  { type: 'school',      emoji: '🏫', label: 'École',           labelEn: 'School' },
  { type: 'school',      emoji: '🎓', label: 'Université',      labelEn: 'University' },
  { type: 'market',      emoji: '🛒', label: 'Marché',          labelEn: 'Market' },
  { type: 'mosque',      emoji: '🕌', label: 'Mosquée',         labelEn: 'Mosque' },
  { type: 'church',      emoji: '⛪', label: 'Église',          labelEn: 'Church' },
  { type: 'pharmacy',    emoji: '💊', label: 'Pharmacie',       labelEn: 'Pharmacy' },
  { type: 'hospital',    emoji: '🏥', label: 'Hôpital',         labelEn: 'Hospital' },
  { type: 'supermarket', emoji: '🏬', label: 'Centre commercial', labelEn: 'Mall' },
  { type: 'supermarket', emoji: '🛍️', label: 'Supermarché',    labelEn: 'Supermarket' },
  { type: 'transport',   emoji: '🚌', label: 'Arrêt transport', labelEn: 'Transport stop' },
  { type: 'bank',        emoji: '🏦', label: 'Banque',          labelEn: 'Bank' },
  { type: 'restaurant',  emoji: '🍽️', label: 'Restaurant',      labelEn: 'Restaurant' },
];

type PoiChoice = { key: string; type: string; emoji: string; label: string; name: string };

export default function OwnerPropertyFormModal({ open, initial, ownerId, onClose }: Props) {
  const { i18n } = useTranslation();
  const country = useCountryConfig();
  const { user } = useAuth();
  // Pays auto-détecté depuis le contexte de navigation (plus de sélecteur visible)
  const [selectedCountry, setSelectedCountry] = useState<string>(country.code || 'BF');
  const formLang = selectedCountry === 'GH' ? 'en' : (i18n.language || 'fr');
  const t = useMemo(() => i18n.getFixedT(formLang), [formLang, i18n]);
  const lang = formLang;
  const cur = country.currency_symbol;
  const isEdit = !!initial;
  const phonePrefix = PHONE_PREFIX[selectedCountry] || '+226';

  useLockBackdrop(open);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Étape 1 — Informations principales
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>(PROPERTY_TYPES[0].value);
  const [price, setPrice] = useState<number | ''>('');
  const [rentMode, setRentMode] = useState<'nuit' | 'mois'>('nuit');

  // Étape 2 — Détails + caractéristiques + POI + médias
  const [bedrooms, setBedrooms] = useState<number | ''>(1);
  const [bathrooms, setBathrooms] = useState<number | ''>(1);
  const [surface, setSurface] = useState<number | ''>(50);
  const [floor, setFloor] = useState<number | ''>(0);
  const [rooms, setRooms] = useState<number | ''>(3);
  const [capacity, setCapacity] = useState<number | ''>('');
  const [features, setFeatures] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [confirmCoherence, setConfirmCoherence] = useState(false);

  // Étape 3 — Localisation + contacts
  const [quartier, setQuartier] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(12.3714);
  const [lng, setLng] = useState<number>(-1.5197);
  const [waLocal, setWaLocal] = useState('');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [profilePhone, setProfilePhone] = useState<string>('');

  // Étape 4 — Aperçu
  const [confirmTruthful, setConfirmTruthful] = useState(false);

  // POI cochables (key = type+label, ou osm_<id> pour les suggestions OSM)
  const [poiChoices, setPoiChoices] = useState<PoiChoice[]>([]);
  const [existingPois, setExistingPois] = useState<PropertyPoi[]>([]);

  // POI auto-détectés via OpenStreetMap (Overpass) autour du point sélectionné
  const overpassEnabled = open && step === 2 && Number.isFinite(lat) && Number.isFinite(lng);
  const { pois: osmPois, loading: osmLoading } = useOverpassPOI(
    overpassEnabled ? lat : null,
    overpassEnabled ? lng : null,
    overpassEnabled,
  );
  const osmSuggestions = useMemo(() => {
    return (osmPois ?? [])
      .map(p => {
        const preset = OSM_TYPE_TO_PRESET[p.type];
        if (!preset) return null;
        return { id: p.id, name: p.name, latitude: p.latitude, longitude: p.longitude, ...preset };
      })
      .filter(Boolean) as Array<{ id: string; name: string; latitude: number; longitude: number; type: string; emoji: string; label: string; labelEn: string }>;
  }, [osmPois]);

  // Médias
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [pendingUrl, setPendingUrl] = useState('');
  const [pendingKind, setPendingKind] = useState<'image' | 'video' | 'video_360'>('image');
  const [existingMediaCount, setExistingMediaCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const pendingFileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const [showParser, setShowParser] = useState(false);
  const [showCustomType, setShowCustomType] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [hasResumableDraft, setHasResumableDraft] = useState(false);
  const dirtyRef = useRef(false);

  // Wizard 4 étapes
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const STEP_LABELS = [
    t('owner.form.step1', 'Infos principales'),
    t('owner.form.step2', 'Détails & médias'),
    t('owner.form.step3', 'Localisation'),
    t('owner.form.step4', 'Aperçu & publication'),
  ];

  const commercial = isCommercialType(type);
  const isFurn = isTypeFurnished(type);
  const needsBedrooms = !commercial;

  // ──────── Pré-remplissage : profil (WhatsApp), édition d'un bien, brouillon ────────
  // Charger le téléphone du profil pour pré-remplir WhatsApp
  useEffect(() => {
    if (!user?.id || !open || isEdit) return;
    supabase.from('profiles').select('phone').eq('id', user.id).maybeSingle().then(({ data }) => {
      const p = (data?.phone || '').trim();
      if (!p) return;
      setProfilePhone(p);
      const digits = p.replace(/^\+\d+/, '').replace(/\D/g, '');
      setWaLocal(prev => prev || digits);
    });
  }, [user?.id, open, isEdit]);

  // Détection du brouillon (création seulement)
  useEffect(() => {
    if (!open || isEdit) { setHasResumableDraft(false); return; }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d && d.updatedAt && Date.now() - d.updatedAt < DRAFT_TTL_MS) {
        setHasResumableDraft(true);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch { /* ignore */ }
  }, [open, isEdit]);

  // Auto-save debounced (création uniquement, hors médias File)
  useEffect(() => {
    if (!open || isEdit) return;
    if (!dirtyRef.current) return;
    const tm = setTimeout(() => {
      try {
        const draft = {
          updatedAt: Date.now(),
          step, title, description, type, price, rentMode,
          bedrooms, bathrooms, surface, floor, rooms, capacity,
          features, customFeatures, poiChoices,
          quartier, address, lat, lng,
          selectedCountry, waLocal, phoneLocal,
          pendingMediaUrls: pendingMedia.filter(m => m.source === 'url').map(m => ({ kind: m.kind, url: (m as any).url })),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch { /* quota or other */ }
    }, 5000);
    return () => clearTimeout(tm);
  }, [open, isEdit, step, title, description, type, price, rentMode, bedrooms, bathrooms, surface, floor, rooms, capacity, features, customFeatures, poiChoices, quartier, address, lat, lng, selectedCountry, waLocal, phoneLocal, pendingMedia]);

  const resumeDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      setStep(d.step ?? 1);
      setTitle(d.title ?? ''); setDescription(d.description ?? '');
      setType(d.type ?? PROPERTY_TYPES[0].value);
      setPrice(d.price ?? ''); setRentMode(d.rentMode ?? 'nuit');
      setBedrooms(d.bedrooms ?? 1); setBathrooms(d.bathrooms ?? 1);
      setSurface(d.surface ?? 50); setFloor(d.floor ?? 0);
      setRooms(d.rooms ?? 3); setCapacity(d.capacity ?? '');
      setFeatures(d.features ?? []); setCustomFeatures(d.customFeatures ?? []);
      setPoiChoices(d.poiChoices ?? []);
      setQuartier(d.quartier ?? ''); setAddress(d.address ?? '');
      setLat(d.lat ?? 12.3714); setLng(d.lng ?? -1.5197);
      setSelectedCountry(d.selectedCountry ?? (country.code || 'BF'));
      setWaLocal(d.waLocal ?? ''); setPhoneLocal(d.phoneLocal ?? '');
      const urls: PendingMedia[] = (d.pendingMediaUrls ?? []).map((m: any) => ({ kind: m.kind, source: 'url' as const, url: m.url }));
      setPendingMedia(urls);
      setHasResumableDraft(false);
      toast.success(t('owner.form.draft_resumed', 'Brouillon restauré'));
    } catch { /* ignore */ }
  }, [country.code, t]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasResumableDraft(false);
  }, []);

  // beforeunload : avertir si dirty
  useEffect(() => {
    if (!open) return;
    const h = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [open]);

  // marque dirty dès qu'un champ clé change
  useEffect(() => {
    if (!open) return;
    dirtyRef.current = true;
  }, [title, description, price, quartier, lat, lng, waLocal, features, pendingMedia, poiChoices, bedrooms, bathrooms, surface, rooms]);

  // Reset / hydratation initial
  useEffect(() => {
    if (!open) return;
    setPendingMedia(prev => { prev.forEach(p => p.source === 'file' && URL.revokeObjectURL(p.previewUrl)); return []; });
    setPendingUrl(''); setPendingKind('image'); setExistingMediaCount(0);
    setPoiChoices([]); setExistingPois([]);
    setConfirmCoherence(false); setConfirmTruthful(false);
    dirtyRef.current = false;

    if (initial) {
      (async () => {
        const { data } = await supabase.from('properties').select('*').eq('id', initial.id).single();
        if (data) {
          setTitle(data.title); setDescription(data.description ?? '');
          setType(data.type); setPrice(Number(data.price));
          setQuartier(data.quartier); setAddress(data.address ?? '');
          setBedrooms(data.bedrooms ?? 1); setBathrooms(data.bathrooms ?? 1);
          setSurface(data.surface_area ?? 50);
          setLat(Number(data.latitude)); setLng(Number(data.longitude));
          if ((data as any).country_code) setSelectedCountry((data as any).country_code);
          const f: Record<string, any> = (data.features ?? {}) as Record<string, any>;
          const active = FEATURE_CATALOG.filter(c => f[c.key]).map(c => c.key);
          setFeatures(active);
          setCustomFeatures(Array.isArray(f.__custom) ? (f.__custom as string[]) : []);
          setFloor(typeof f.__floor === 'number' ? f.__floor : 0);
          setRooms(typeof f.__rooms === 'number' ? f.__rooms : 3);
          setCapacity(typeof f.__capacity === 'number' ? f.__capacity : '');
          const storedMode = f.__rent_mode === 'mois' || f.__rent_mode === 'nuit' ? f.__rent_mode : null;
          setRentMode(storedMode ?? (((data as any).country_code === 'GH') ? 'mois' : 'nuit'));
          setSavedId(initial.id);

          const pref = PHONE_PREFIX[(data as any).country_code as string] || phonePrefix;
          const stripPrefix = (raw: string | null) => {
            if (!raw) return '';
            const s = raw.replace(/[\s\-()]/g, '');
            return s.startsWith(pref) ? s.slice(pref.length) : s.replace(/^\+\d+/, '');
          };
          setWaLocal(stripPrefix((data as any).whatsapp_phone ?? ''));
          setPhoneLocal(stripPrefix((data as any).agent_phone ?? ''));
        }
        const media = await listPropertyMedia(initial.id).catch(() => []);
        setExistingMediaCount(media?.length ?? 0);
        const pois = await listPoisForProperty(initial.id).catch(() => []);
        setExistingPois(pois);
      })();
    } else {
      const defaultCity = CITIES[COUNTRY_TO_CITY[country.code] ?? 'ouagadougou'] ?? CITIES.ouagadougou;
      setTitle(''); setDescription(''); setType(PROPERTY_TYPES[0].value);
      setPrice(''); setQuartier('');
      setAddress(''); setBedrooms(1); setBathrooms(1); setSurface(50);
      setFloor(0); setRooms(3); setCapacity('');
      setLat(defaultCity.center[0]); setLng(defaultCity.center[1]);
      setSelectedCountry(country.code || 'BF');
      setFeatures([]); setCustomFeatures([]); setSavedId(null);
      setWaLocal(''); setPhoneLocal('');
    }

    setCustomInput('');
    setStep(1);
    setTimeout(() => titleRef.current?.focus(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  // ──────── Carte auto-centrée sur le quartier ────────
  useEffect(() => {
    if (!open || !quartier) return;
    let aborted = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('locations')
          .select('lat,lng')
          .eq('country_code', selectedCountry)
          .ilike('quartier', quartier)
          .not('lat', 'is', null)
          .limit(1)
          .maybeSingle();
        if (aborted) return;
        if (data?.lat && data?.lng) {
          setLat(Number(data.lat)); setLng(Number(data.lng));
        }
      } catch { /* silent */ }
    })();
    return () => { aborted = true; };
  }, [quartier, selectedCountry, open]);

  // ──────── Helpers POI / médias / features ────────
  const togglePoi = (preset: typeof POI_PRESETS[number]) => {
    const key = `${preset.type}__${preset.label}`;
    setPoiChoices(prev => {
      if (prev.find(p => p.key === key)) return prev.filter(p => p.key !== key);
      return [...prev, { key, type: preset.type, emoji: preset.emoji, label: preset.label, name: '' }];
    });
  };
  const setPoiName = (key: string, name: string) =>
    setPoiChoices(prev => prev.map(p => p.key === key ? { ...p, name } : p));

  const addPendingFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: PendingMedia[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 20_000_000) { toast.error(t('owner.form.err_size', { name: file.name })); return; }
      const k: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
      next.push({ kind: k, source: 'file', file, previewUrl: URL.createObjectURL(file) });
    });
    if (next.length) setPendingMedia(prev => [...prev, ...next]);
  };
  const addPendingUrl = () => {
    const u = pendingUrl.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) { toast.error(t('owner.form.err_url')); return; }
    setPendingMedia(prev => [...prev, { kind: pendingKind, source: 'url', url: u }]);
    setPendingUrl('');
  };
  const removePending = (idx: number) => {
    setPendingMedia(prev => {
      const item = prev[idx];
      if (item?.source === 'file') URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };
  const setPendingAsMain = (idx: number) => {
    setPendingMedia(prev => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
    toast.success(t('owner.form.main_set', 'Image principale mise à jour'));
  };

  const featuresByCat = useMemo(() => {
    const map: Record<string, typeof FEATURE_CATALOG> = {};
    FEATURE_CATEGORIES.forEach(c => { map[c.id] = []; });
    FEATURE_CATALOG.forEach(f => { map[f.category].push(f); });
    return map;
  }, []);

  const toggleFeature = (key: string) =>
    setFeatures(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    if (customFeatures.some(c => c.toLowerCase() === v.toLowerCase())) { toast.error(t('owner.form.err_custom_dup')); return; }
    setCustomFeatures(prev => [...prev, v]); setCustomInput('');
  };
  const removeCustom = (idx: number) => setCustomFeatures(prev => prev.filter((_, i) => i !== idx));

  // AI parser
  const TYPE_AI_MAP: Record<string, string> = {
    villa_meublee: 'maison_villa_meublee', villa: 'maison_villa_simple',
    maison: 'maison_villa_simple', appartement: 'appartement_simple',
    appartement_meuble: 'appartement_meuble', studio: 'studio_meuble',
    bureau: 'bureau', local: 'local_commercial', chambre: 'studio_meuble',
    hotel: 'maison_villa_meublee', residence: 'maison_villa_simple',
  };
  const AMENITY_AI_MAP: Record<string, string> = { parking: 'parking_interne' };
  const applyParsed = (p: ParsedProperty) => {
    if (p.title_suggestion) setTitle(p.title_suggestion.slice(0, 80));
    if (p.description) setDescription(p.description);
    if (p.type) {
      const mapped = TYPE_AI_MAP[p.type] ?? p.type;
      if (PROPERTY_TYPES.some(pt => pt.value === mapped)) setType(mapped);
    }
    if (typeof p.price === 'number') setPrice(p.price);
    if (typeof p.bedrooms === 'number') setBedrooms(p.bedrooms);
    if (typeof p.bathrooms === 'number') setBathrooms(p.bathrooms);
    if (typeof p.surface_area === 'number') setSurface(p.surface_area);
    if (p.quartier) setQuartier(p.quartier);
    const aiMode = (p as any).rent_mode ?? (p as any).price_type;
    if (aiMode === 'nuit' || aiMode === 'mois') setRentMode(aiMode);
    else if (selectedCountry === 'GH') setRentMode('mois');
    if (p.amenities) {
      const validKeys = new Set(FEATURE_CATALOG.map(f => f.key));
      const next: string[] = [...features];
      Object.entries(p.amenities).forEach(([rawKey, on]) => {
        if (!on) return;
        const key = AMENITY_AI_MAP[rawKey] ?? rawKey;
        if (validKeys.has(key) && !next.includes(key)) next.push(key);
      });
      setFeatures(next);
    }
    setShowParser(false);
    toast.success(t('owner.form.ai_filled', 'Formulaire pré-rempli — vérifie et ajuste si besoin.'));
  };

  // ──────── Cohérence pièces ↔ chambres ────────
  const coherenceWarning = useMemo(() => {
    if (commercial) return null;
    const b = Number(bedrooms || 0); const r = Number(rooms || 0);
    if (!b || !r) return null;
    // Règle : chambres + 1 salon implicite ≤ pièces
    if (r < b + 1) return t('owner.form.coherence', "Le nombre de pièces semble inférieur au nombre d'espaces indiqués. Vérifiez vos informations.");
    return null;
  }, [commercial, bedrooms, rooms, t]);

  // ──────── Navigation wizard ────────
  const validateStep = (s: 1 | 2 | 3): string | null => {
    if (s === 1) {
      if (!title.trim()) return t('owner.form.err_titre');
      if (description.trim().length < 20) return t('owner.form.err_desc');
      if (!price || Number(price) <= 0) return t('owner.form.err_prix');
    }
    if (s === 2) {
      if (needsBedrooms && (bedrooms === '' || Number(bedrooms) < 1)) return t('owner.form.err_bedrooms', 'Le nombre de chambres est obligatoire');
      if (rooms === '' || Number(rooms) < 1) return t('owner.form.err_rooms', 'Le nombre de pièces est obligatoire');
      if (coherenceWarning && !confirmCoherence) return coherenceWarning;
      const totalMedia = pendingMedia.length + (isEdit ? existingMediaCount : 0);
      if (totalMedia < 1) return t('owner.form.err_media');
    }
    if (s === 3) {
      if (!quartier) return t('owner.form.err_quartier');
      const waDigits = waLocal.replace(/\D/g, '');
      if (waDigits.length < 6 || waDigits.length > 14) return t('owner.form.err_whatsapp');
      const ph = phoneLocal.replace(/\D/g, '');
      if (ph && (ph.length < 6 || ph.length > 14)) return t('owner.form.err_phone');
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step as 1 | 2 | 3);
    if (err) { toast.error(err); return; }
    setStep(s => (Math.min(4, s + 1) as 1 | 2 | 3 | 4));
    setTimeout(() => document.querySelector('[data-wizard-scroll]')?.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };
  const goBack = () => setStep(s => (Math.max(1, s - 1) as 1 | 2 | 3 | 4));

  const blockingErrors = useMemo(() => {
    const errs: string[] = [];
    if (!title.trim()) errs.push(t('owner.form.err_titre'));
    if (description.trim().length < 20) errs.push(t('owner.form.err_desc'));
    if (!price || Number(price) <= 0) errs.push(t('owner.form.err_prix'));
    if (needsBedrooms && (bedrooms === '' || Number(bedrooms) < 1)) errs.push(t('owner.form.err_bedrooms', 'Le nombre de chambres est obligatoire'));
    if (rooms === '' || Number(rooms) < 1) errs.push(t('owner.form.err_rooms', 'Le nombre de pièces est obligatoire'));
    if (!quartier) errs.push(t('owner.form.err_quartier'));
    const waDigits = waLocal.replace(/\D/g, '');
    if (waDigits.length < 6 || waDigits.length > 14) errs.push(t('owner.form.err_whatsapp'));
    const totalMedia = pendingMedia.length + (isEdit ? existingMediaCount : 0);
    if (totalMedia < 1) errs.push(t('owner.form.err_media'));
    return errs;
  }, [title, description, price, needsBedrooms, bedrooms, rooms, quartier, waLocal, pendingMedia.length, existingMediaCount, isEdit, t]);

  // ──────── Soumission ────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockingErrors.length) { toast.error(blockingErrors[0]); return; }
    if (!confirmTruthful) { toast.error(t('owner.form.must_confirm', 'Veuillez confirmer que les informations sont exactes')); return; }

    const waDigits = waLocal.replace(/\D/g, '');
    const phoneDigits = phoneLocal.replace(/\D/g, '');
    const whatsappE164 = `${phonePrefix}${waDigits}`;
    const phoneE164 = phoneDigits ? `${phonePrefix}${phoneDigits}` : null;

    setBusy(true);
    let createdPropertyId: string | null = null;
    try {
      const featuresObj: Record<string, any> = {};
      features.forEach(k => { featuresObj[k] = true; });
      if (customFeatures.length) featuresObj.__custom = customFeatures;
      if (floor !== '') featuresObj.__floor = Number(floor);
      if (rooms !== '') featuresObj.__rooms = Number(rooms);
      if (capacity !== '') featuresObj.__capacity = Number(capacity);
      if (isFurn) featuresObj.__rent_mode = rentMode;

      const defaultCity = CITIES[COUNTRY_TO_CITY[selectedCountry] ?? '']?.name ?? null;

      const payload: any = {
        title: title.trim(), description: description.trim(), type,
        price: Number(price), quartier, address: address.trim() || quartier,
        latitude: lat, longitude: lng,
        bedrooms: commercial ? null : (Number(bedrooms) || null),
        bathrooms: commercial ? null : (Number(bathrooms) || null),
        surface_area: Number(surface) || null,
        furnished: isFurn,
        features: featuresObj,
        owner_id: ownerId, country_code: selectedCountry, city: defaultCity,
        whatsapp_phone: whatsappE164, agent_phone: phoneE164,
      };

      let propertyId: string;
      let willRequireReview = false;
      if (isEdit && initial) {
        willRequireReview = ['rejected', 'corrections'].includes(initial.admin_status);
        const updatePayload: any = { ...payload, owner_updated_at: new Date().toISOString() };
        if (willRequireReview) updatePayload.admin_status = 'pending';
        const { data: updated, error } = await supabase
          .from('properties').update(updatePayload).eq('id', initial.id).select('id');
        if (error) throw error;
        if (!updated || updated.length === 0) throw new Error("Mise à jour refusée : vous n'êtes pas propriétaire de ce bien.");
        propertyId = initial.id;
      } else {
        const { data, error } = await supabase
          .from('properties')
          .insert({ ...payload, admin_status: 'pending' as any, status: 'available', owner_updated_at: new Date().toISOString() })
          .select('id').single();
        if (error) throw error;
        propertyId = data.id;
        createdPropertyId = propertyId;
      }

      // Upload médias
      if (pendingMedia.length) {
        const failures: string[] = [];
        let uploaded = 0;
        setUploadProgress({ done: 0, total: pendingMedia.length });
        const CONCURRENCY = 4;
        const queue = [...pendingMedia];
        const runWorker = async () => {
          while (queue.length) {
            const m = queue.shift();
            if (!m) break;
            try {
              if (m.source === 'file') await uploadPropertyMedia(propertyId, m.file, m.kind);
              else await addPropertyMediaUrl(propertyId, m.url, m.kind);
              uploaded++;
            } catch (err: any) { failures.push(err?.message ?? 'erreur'); }
            setUploadProgress({ done: uploaded + failures.length, total: pendingMedia.length });
          }
        };
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pendingMedia.length) }, runWorker));
        setUploadProgress(null);
        if (uploaded === 0 && (isEdit ? existingMediaCount : 0) === 0) {
          if (createdPropertyId) await supabase.from('properties').delete().eq('id', createdPropertyId);
          throw new Error(`Aucun média n'a pu être uploadé : ${failures[0] ?? 'erreur'}.`);
        }
        if (failures.length) toast.warning(`${uploaded}/${pendingMedia.length} médias uploadés.`);
        pendingMedia.forEach(p => p.source === 'file' && URL.revokeObjectURL(p.previewUrl));
        setPendingMedia([]);
      }

      // POIs cochés
      if (poiChoices.length) {
        for (const p of poiChoices) {
          const name = p.name.trim() || p.label;
          try { await addPoiToProperty(propertyId, { name, type: p.type, quartier, distance_m: null as any }); }
          catch (err: any) { console.warn('POI add failed', err); }
        }
      }

      // Mise à jour du téléphone du profil si modifié et création
      if (!isEdit && user?.id) {
        const newPhone = whatsappE164;
        if (newPhone && newPhone !== profilePhone) {
          supabase.from('profiles').update({ phone: newPhone }).eq('id', user.id).then(() => {});
        }
      }

      toast.success(
        isEdit
          ? (willRequireReview ? t('owner.form.ok_revalidate') : t('owner.form.ok_update'))
          : t('owner.form.ok_create')
      );
      localStorage.removeItem(DRAFT_KEY);
      dirtyRef.current = false;
      onClose(true);
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur');
    } finally { setBusy(false); }
  };

  // ──────── Fermeture avec confirmation ────────
  const requestClose = () => {
    if (dirtyRef.current && !busy) { setShowQuitConfirm(true); return; }
    onClose(!!savedId);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-3" onClick={requestClose}>
      <div data-wizard-scroll className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card flex items-center justify-between px-5 py-3 border-b z-10">
          <div>
            <h2 className="text-base font-bold text-foreground">{isEdit ? t('owner.form.modifier') : t('owner.form.nouveau')}</h2>
            {!isEdit && <p className="text-[11px] text-muted-foreground mt-0.5">{t('owner.form.soumis')}</p>}
          </div>
          <button onClick={requestClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Bannière reprise brouillon */}
        {hasResumableDraft && !isEdit && (
          <div className="mx-5 mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
            <Info size={16} className="text-primary shrink-0" />
            <p className="text-xs flex-1">{t('owner.form.draft_found', 'Une annonce non terminée a été trouvée. Souhaitez-vous reprendre votre travail ?')}</p>
            <button type="button" onClick={resumeDraft} className="text-xs font-semibold text-primary hover:underline">{t('owner.form.resume', 'Reprendre')}</button>
            <button type="button" onClick={discardDraft} className="text-xs text-muted-foreground hover:text-foreground">{t('owner.form.discard', 'Recommencer')}</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Stepper 4 étapes */}
          <div className="flex items-center gap-1 pb-1">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="flex items-center gap-1.5 flex-1">
                <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border transition ${step >= n ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>{n}</div>
                <span className={`text-[10px] font-semibold leading-tight ${step >= n ? 'text-foreground' : 'text-muted-foreground'} hidden sm:inline`}>
                  {STEP_LABELS[n - 1]}
                </span>
                {n < 4 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          {/* ÉTAPE 1 — Informations principales */}
          {step === 1 && (<div className="space-y-4">
            {showParser ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <DescriptionParser onConfirm={applyParsed} onCancel={() => setShowParser(false)} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Remplissage automatique</p>
                  <p className="text-[11px] text-muted-foreground">Décris ton bien en texte libre, l'IA remplit le formulaire pour toi.</p>
                </div>
                <button type="button" onClick={() => setShowParser(true)} className="text-xs text-primary font-semibold underline underline-offset-2 shrink-0">Utiliser →</button>
              </div>
            )}

            <Field label={t('owner.form.titre')}>
              <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder={t('owner.form.titre_ph')} />
            </Field>

            <Field label={t('owner.form.description')}>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} minLength={20} required className="form-input resize-none" placeholder={t('owner.form.description_ph')} />
              <p className="text-[10px] text-muted-foreground mt-1">{t('owner.form.desc_count', { n: description.trim().length })}</p>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('owner.form.type')}>
                <select value={type} onChange={e => setType(e.target.value)} className="form-input">
                  {PROPERTY_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.emoji} {getTypeLabel(pt.value, lang)}</option>)}
                </select>
                <button type="button" onClick={() => setShowCustomType(true)} className="mt-1.5 text-[10px] text-muted-foreground hover:text-primary underline underline-offset-2 flex items-center gap-1">
                  <Plus size={10} /> Mon type de bien n'est pas dans la liste
                </button>
              </Field>
              <Field label={commercial ? t('owner.form.loyer_mensuel', { cur }) : (isFurn && rentMode === 'nuit' ? t('owner.form.prix_nuit', { cur }) : t('owner.form.loyer_mensuel', { cur }))}>
                <input type="number" min={0} value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" placeholder="150000" />
                <p className="text-[10px] text-muted-foreground mt-0.5">{commercial ? t('owner.form.hint_commercial') : (isFurn && rentMode === 'nuit' ? t('owner.form.hint_nuit') : t('owner.form.hint_longue'))}</p>
              </Field>
            </div>

            {isFurn && !commercial && (
              <Field label={selectedCountry === 'GH' ? 'Billing cadence' : 'Cadence de facturation'}>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRentMode('nuit')} className={`flex-1 h-10 rounded-lg border text-xs font-semibold transition ${rentMode === 'nuit' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}>🌙 À la nuitée</button>
                  <button type="button" onClick={() => setRentMode('mois')} className={`flex-1 h-10 rounded-lg border text-xs font-semibold transition ${rentMode === 'mois' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}>📅 Au mois</button>
                </div>
              </Field>
            )}
          </div>)}

          {/* ÉTAPE 2 — Détails du bien + médias + caractéristiques + POI */}
          {step === 2 && (<div className="space-y-4">
            {commercial ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Field label={isOfficeType(type) ? t('owner.form.nb_bureaux') : t('owner.form.nb_locaux')}>
                    <input type="number" min={0} value={rooms} onChange={e => setRooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                  </Field>
                  <Field label={`${t('owner.form.nb_pieces')} *`}>
                    <input type="number" min={1} value={bedrooms} onChange={e => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                  </Field>
                  <Field label={t('owner.form.surface')}>
                    <input type="number" min={0} value={surface} onChange={e => setSurface(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('owner.form.etage')}>
                    <input type="number" min={0} value={floor} onChange={e => setFloor(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                  </Field>
                  <Field label={t('owner.form.capacite')}>
                    <input type="number" min={0} value={capacity} onChange={e => setCapacity(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" placeholder={t('owner.form.capacite_ph')} />
                  </Field>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Field label={`${t('owner.form.chambres')} *`}>
                    <input type="number" min={1} required value={bedrooms} onChange={e => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                  </Field>
                  <Field label={t('owner.form.sdb')}>
                    <input type="number" min={0} value={bathrooms} onChange={e => setBathrooms(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                  </Field>
                  <Field label={t('owner.form.surface')}>
                    <input type="number" min={0} value={surface} onChange={e => setSurface(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('owner.form.etage')}>
                    <input type="number" min={0} value={floor} onChange={e => setFloor(e.target.value === '' ? '' : Number(e.target.value))} className="form-input" />
                  </Field>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                      {t('owner.form.nb_pieces')} *
                      <span className="group relative inline-flex">
                        <Info size={11} className="text-muted-foreground cursor-help" />
                        <span className="hidden group-hover:block absolute left-0 top-4 z-20 w-60 text-[10px] bg-foreground text-background rounded-md p-2 shadow-lg leading-snug">
                          Le nombre de pièces correspond au total des espaces principaux du logement (salon, chambres, bureau, salle à manger, etc.)
                        </span>
                      </span>
                    </label>
                    <input type="number" min={1} required value={rooms} onChange={e => { setRooms(e.target.value === '' ? '' : Number(e.target.value)); setConfirmCoherence(false); }} className="form-input" />
                  </div>
                </div>

                {coherenceWarning && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1 text-[11px] text-amber-900">
                      <p className="font-semibold">{coherenceWarning}</p>
                      <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                        <input type="checkbox" checked={confirmCoherence} onChange={e => setConfirmCoherence(e.target.checked)} />
                        <span>Je confirme volontairement les valeurs saisies</span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Caractéristiques (déplacées ici) */}
            <div className="space-y-2 border-t pt-4">
              <label className="text-xs font-semibold text-foreground">
                {t('owner.form.caracteristiques', { n: features.length + customFeatures.length })}
              </label>
              <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                {FEATURE_CATEGORIES.map(cat => {
                  const items = featuresByCat[cat.id];
                  if (!items?.length) return null;
                  const count = items.filter(f => features.includes(f.key)).length;
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <span aria-hidden>{cat.emoji}</span>
                        <span>{categoryLabel(cat, lang)}</span>
                        {count > 0 && <span className="rounded-full bg-primary/10 text-primary px-1.5 text-[10px]">{count}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {items.map(f => {
                          const checked = features.includes(f.key);
                          return (
                            <label key={f.key} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer border transition ${checked ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:bg-muted'}`}>
                              <input type="checkbox" className="accent-primary" checked={checked} onChange={() => toggleFeature(f.key)} />
                              <span aria-hidden>{f.emoji}</span>
                              <span className="truncate">{featureLabel(f, lang)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input value={customInput} onChange={e => setCustomInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} className="form-input" placeholder={t('owner.form.custom_ph')} />
                <button type="button" onClick={addCustom} className="px-3 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1">
                  <Plus size={14} /> {t('owner.form.ajouter')}
                </button>
              </div>
              {customFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customFeatures.map((c, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs">
                      ✨ {c}
                      <button type="button" onClick={() => removeCustom(idx)} className="ml-1 hover:text-primary/70"><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* À proximité — POI cochables */}
            <div className="space-y-2 border-t pt-4">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <MapPin size={13} /> À proximité du bien
              </label>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Cochez les lieux présents à proximité (rayon ~500 m). Plus vous renseignez d'informations précises, mieux les visiteurs comprendront l'emplacement. Le nom du lieu est facultatif mais recommandé — nous le vérifierons et calculerons la distance automatiquement quand c'est possible.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {POI_PRESETS.map(p => {
                  const key = `${p.type}__${p.label}`;
                  const choice = poiChoices.find(c => c.key === key);
                  const checked = !!choice;
                  return (
                    <label key={key} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer border transition ${checked ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:bg-muted'}`}>
                      <input type="checkbox" className="accent-primary" checked={checked} onChange={() => togglePoi(p)} />
                      <span aria-hidden>{p.emoji}</span>
                      <span className="truncate">{lang === 'en' ? p.labelEn : p.label}</span>
                    </label>
                  );
                })}
              </div>
              {poiChoices.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {poiChoices.map(c => (
                    <div key={c.key} className="flex items-center gap-2">
                      <span className="text-[11px] w-32 truncate">{c.emoji} {c.label}</span>
                      <input value={c.name} onChange={e => setPoiName(c.key, e.target.value)} placeholder={`Nom du lieu (facultatif) — ex. "${c.label} central"`} className="form-input flex-1 text-[11px]" />
                    </div>
                  ))}
                </div>
              )}
              {existingPois.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {existingPois.map(p => {
                    const pt = POI_TYPES.find(x => x.value === p.type);
                    return (
                      <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-muted text-foreground px-2.5 py-1 text-[11px]">
                        {pt?.emoji ?? '📍'} {p.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Médias */}
            <div className="space-y-2 border-t pt-4">
              <label className="text-xs font-semibold text-foreground">{t('owner.form.medias_label')}</label>
              {savedId && <MediaUploader propertyId={savedId} />}
              {!savedId && (
                <>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); addPendingFiles(e.dataTransfer.files); }}
                    onClick={() => pendingFileRef.current?.click()}
                    className={`cursor-pointer rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 py-6 px-3 text-center transition ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                  >
                    <Upload size={22} className="text-primary" />
                    <span className="text-xs font-semibold">{t('owner.form.choisir_fichiers')}</span>
                    <span className="text-[10px] text-muted-foreground">{t('owner.form.bulk_hint') ?? 'Drag & drop or select multiple photos/videos at once'}</span>
                    <input ref={pendingFileRef} type="file" accept="image/*,video/*" multiple hidden onChange={e => { addPendingFiles(e.target.files); if (pendingFileRef.current) pendingFileRef.current.value = ''; }} />
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-stretch">
                    <select value={pendingKind} onChange={e => setPendingKind(e.target.value as any)} className="form-input col-span-3 text-[11px]">
                      <option value="image">🖼️ Image</option>
                      <option value="video">🎬 Vidéo</option>
                      <option value="video_360">🔭 360°</option>
                    </select>
                    <input value={pendingUrl} onChange={e => setPendingUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPendingUrl(); } }} placeholder="https://… (lien)" className="form-input col-span-7" />
                    <button type="button" onClick={addPendingUrl} className="col-span-2 h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1">
                      <Link2 size={13} /> {t('owner.form.ajouter')}
                    </button>
                  </div>
                  {pendingMedia.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {pendingMedia.map((m, i) => (
                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                          {m.kind === 'image' && m.source === 'file' ? (
                            <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                          ) : m.kind === 'image' && m.source === 'url' ? (
                            <img src={m.url} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.src='/placeholder.svg')} />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground p-2 text-center">
                              {m.kind === 'video_360' ? <Globe size={22} /> : <Video size={22} />}
                              <span className="truncate mt-1 w-full text-[10px]">{m.kind === 'video_360' ? '360°' : t('owner.form.video')}</span>
                            </div>
                          )}
                          <button type="button" onClick={() => removePending(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center" title="Supprimer">
                            <Trash2 size={11} />
                          </button>
                          {i === 0 ? (
                            <span className="absolute top-1 left-1 text-[9px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold shadow">⭐ {t('owner.form.principale')}</span>
                          ) : m.kind === 'image' && (
                            <button type="button" onClick={() => setPendingAsMain(i)} className="absolute inset-x-1 top-1 mx-auto w-fit px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-semibold opacity-0 group-hover:opacity-100 hover:bg-yellow-400 hover:text-black transition flex items-center gap-1" title="Définir comme image principale">⭐ Définir principale</button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground text-center py-3 rounded-lg border border-dashed">{t('owner.form.aucun_media')}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">💡 Survole une image et clique « ⭐ Définir principale » pour choisir la photo de couverture.</p>
                  {uploadProgress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground"><span>Upload… {uploadProgress.done}/{uploadProgress.total}</span><span>{Math.round((uploadProgress.done / uploadProgress.total) * 100)}%</span></div>
                      <div className="h-1.5 bg-muted rounded overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }} /></div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>)}

          {/* ÉTAPE 3 — Localisation + contacts */}
          {step === 3 && (<div className="space-y-4">
            <div className="relative z-[1100]">
              <label className="block text-xs font-semibold mb-1">{t('owner.form.quartier')} *</label>
              <QuartierAutocomplete countryCode={selectedCountry} value={quartier} onChange={(q, loc) => { setQuartier(q); if (loc?.lat && loc?.lng) { setLat(loc.lat); setLng(loc.lng); } }} />
              <p className="text-[10px] text-muted-foreground mt-1">Sélectionnez d'abord le quartier — la carte se centrera automatiquement dessus.</p>
            </div>

            <Field label={t('owner.form.adresse')}>
              <input value={address} onChange={e => setAddress(e.target.value)} className="form-input" placeholder={t('owner.form.adresse_ph')} />
            </Field>

            <Field label={t('owner.form.carte')}>
              <MapPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} height={260} satellite locked lockRadiusKm={0.8} />
              <p className="text-[10px] text-muted-foreground mt-1">
                🛰️ Vue satellite centrée sur le quartier sélectionné. Déplacez le marqueur pour indiquer l'emplacement exact du bien.
              </p>
            </Field>


            {/* Contacts */}
            <div className="space-y-2 border-t pt-4">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">💬 {t('owner.form.contacts_label')}</label>
              <p className="text-[10px] text-muted-foreground -mt-1">
                {profilePhone ? '✓ Numéro WhatsApp pré-rempli depuis votre profil. Modifiez-le si nécessaire.' : t('owner.form.contacts_intro', { prefix: phonePrefix })}
              </p>

              <Field label={`${t('owner.form.whatsapp_label')} *`}>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 h-10 rounded-lg border border-border bg-muted text-xs font-mono text-muted-foreground select-none">{phonePrefix}</span>
                  <input type="tel" inputMode="numeric" maxLength={14} value={waLocal} onChange={e => setWaLocal(e.target.value.replace(/[^\d\s\-]/g, ''))} placeholder={t('owner.form.whatsapp_ph')} className="form-input flex-1" required />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{t('owner.form.whatsapp_hint')}</p>
              </Field>

              <Field label={`${t('owner.form.phone_label')} (facultatif)`}>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 h-10 rounded-lg border border-border bg-muted text-xs font-mono text-muted-foreground select-none">{phonePrefix}</span>
                  <input type="tel" inputMode="numeric" maxLength={14} value={phoneLocal} onChange={e => setPhoneLocal(e.target.value.replace(/[^\d\s\-]/g, ''))} placeholder={t('owner.form.phone_ph')} className="form-input flex-1" />
                </div>
              </Field>
            </div>
          </div>)}

          {/* ÉTAPE 4 — Aperçu & validation */}
          {step === 4 && (
            <StepReview
              title={title} description={description} type={type} price={Number(price) || 0} cur={cur}
              rentMode={rentMode} isFurn={isFurn} commercial={commercial}
              bedrooms={Number(bedrooms) || 0} bathrooms={Number(bathrooms) || 0} surface={Number(surface) || 0}
              rooms={Number(rooms) || 0} features={features} customFeatures={customFeatures}
              quartier={quartier} address={address} lat={lat} lng={lng}
              whatsapp={`${phonePrefix}${waLocal.replace(/\D/g, '')}`}
              phone={phoneLocal ? `${phonePrefix}${phoneLocal.replace(/\D/g, '')}` : ''}
              poiChoices={poiChoices} pendingMedia={pendingMedia} existingMediaCount={existingMediaCount}
              lang={lang} confirmed={confirmTruthful} setConfirmed={setConfirmTruthful}
              blockingErrors={blockingErrors}
            />
          )}

          {/* Navigation */}
          <div className="flex gap-2 pt-3 border-t">
            {step > 1 ? (
              <button type="button" onClick={goBack} className="flex-1 h-10 rounded-lg border text-xs font-semibold hover:bg-muted">← {t('owner.form.precedent', 'Précédent')}</button>
            ) : (
              <button type="button" onClick={requestClose} className="flex-1 h-10 rounded-lg border text-xs font-semibold hover:bg-muted">{savedId ? t('owner.form.fermer') : t('owner.form.annuler')}</button>
            )}
            {step < 4 ? (
              <button type="button" onClick={goNext} className="flex-[1.4] h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">{t('owner.form.suivant', 'Suivant')} →</button>
            ) : (
              <button type="submit" disabled={busy || !confirmTruthful || blockingErrors.length > 0} className="flex-[1.4] h-10 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <CheckCircle2 size={13} /> {isEdit ? t('owner.form.mettre_a_jour') : t('owner.form.enregistrer')}
              </button>
            )}
          </div>
        </form>

        <style>{`.form-input{display:block;width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.8125rem;outline:none;transition:border-color .15s}.form-input:focus{border-color:hsl(var(--primary))}`}</style>
      </div>

      <CustomTypeSuggestModal open={showCustomType} onClose={() => setShowCustomType(false)} />

      <ConfirmDialog
        open={showQuitConfirm}
        title={t('owner.form.confirm_quit_title', 'Quitter la publication ?')}
        message={t('owner.form.confirm_quit_msg', 'Vous êtes sur le point de quitter. Vos modifications non publiées sont sauvegardées en brouillon et vous pourrez reprendre plus tard.')}
        confirmLabel={t('owner.form.confirm_quit_btn', 'Quitter')}
        onCancel={() => setShowQuitConfirm(false)}
        onConfirm={() => { setShowQuitConfirm(false); onClose(!!savedId); }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

// ─────────────────────── Étape 4 — Récapitulatif ───────────────────────
function StepReview(props: {
  title: string; description: string; type: string; price: number; cur: string;
  rentMode: 'nuit' | 'mois'; isFurn: boolean; commercial: boolean;
  bedrooms: number; bathrooms: number; surface: number; rooms: number;
  features: string[]; customFeatures: string[];
  quartier: string; address: string; lat: number; lng: number;
  whatsapp: string; phone: string;
  poiChoices: PoiChoice[]; pendingMedia: PendingMedia[]; existingMediaCount: number;
  lang: string; confirmed: boolean; setConfirmed: (b: boolean) => void;
  blockingErrors: string[];
}) {
  const typeLabel = PROPERTY_TYPES.find(t => t.value === props.type);
  const priceUnit = props.isFurn && props.rentMode === 'nuit' ? '/nuit' : '/mois';
  const firstImage = props.pendingMedia.find(m => m.kind === 'image');
  const firstImageUrl = firstImage
    ? (firstImage.source === 'file' ? firstImage.previewUrl : firstImage.url)
    : null;
  const featureLabels = props.features.map(k => {
    const f = FEATURE_CATALOG.find(x => x.key === k);
    return f ? `${f.emoji} ${featureLabel(f, props.lang)}` : k;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
        <p className="font-semibold flex items-center gap-1.5"><CheckCircle2 size={14} className="text-primary" /> Vérifiez votre annonce avant publication</p>
        <p className="text-[11px] text-muted-foreground mt-1">Relisez attentivement chaque section ci-dessous. Vous pourrez revenir en arrière pour corriger.</p>
      </div>

      {/* Le bien */}
      <Section title="🏠 Le bien">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1 aspect-video rounded-lg bg-muted overflow-hidden">
            {firstImageUrl ? <img src={firstImageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon size={24} /></div>}
          </div>
          <div className="col-span-3 sm:col-span-2 space-y-1.5 text-xs">
            <p className="font-bold text-sm">{props.title || '—'}</p>
            <p className="text-muted-foreground">{typeLabel?.emoji} {typeLabel?.label ?? props.type}</p>
            <p className="text-primary font-bold text-sm">{props.price > 0 ? `${props.price.toLocaleString('fr-FR')} ${props.cur}${priceUnit}` : '—'}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {!props.commercial && <span>🛏 {props.bedrooms} chambre{props.bedrooms > 1 ? 's' : ''}</span>}
              <span>🚿 {props.bathrooms} SDB</span>
              <span>📐 {props.surface} m²</span>
              <span>🏠 {props.rooms} pièces</span>
            </div>
            <p className="text-[11px] text-foreground/80 line-clamp-3 pt-1">{props.description || '—'}</p>
          </div>
        </div>
      </Section>

      {/* Caractéristiques */}
      {(featureLabels.length > 0 || props.customFeatures.length > 0) && (
        <Section title="✨ Caractéristiques">
          <div className="flex flex-wrap gap-1.5">
            {featureLabels.map((l, i) => <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted text-foreground px-2 py-0.5 text-[11px]">{l}</span>)}
            {props.customFeatures.map((c, i) => <span key={`c-${i}`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px]">✨ {c}</span>)}
          </div>
        </Section>
      )}

      {/* À proximité */}
      {props.poiChoices.length > 0 && (
        <Section title="📍 À proximité">
          <div className="flex flex-wrap gap-1.5">
            {props.poiChoices.map(p => (
              <span key={p.key} className="inline-flex items-center gap-1 rounded-full bg-muted text-foreground px-2 py-0.5 text-[11px]">
                {p.emoji} {p.name.trim() || p.label}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Localisation */}
      <Section title="🗺️ Localisation">
        <p className="text-xs"><span className="font-semibold">Quartier :</span> {props.quartier || '—'}</p>
        {props.address && <p className="text-xs"><span className="font-semibold">Adresse :</span> {props.address}</p>}
        <p className="text-[11px] text-muted-foreground">GPS : {props.lat.toFixed(5)}, {props.lng.toFixed(5)}</p>
      </Section>

      {/* Contacts */}
      <Section title="📞 Contacts">
        <p className="text-xs"><span className="font-semibold">WhatsApp :</span> {props.whatsapp || '—'}</p>
        {props.phone && <p className="text-xs"><span className="font-semibold">Téléphone secondaire :</span> {props.phone}</p>}
      </Section>

      {/* Médias */}
      <Section title={`📸 Médias (${props.pendingMedia.length + props.existingMediaCount})`}>
        {props.pendingMedia.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {props.pendingMedia.map((m, i) => (
              <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted">
                {m.kind === 'image' ? (
                  <img src={m.source === 'file' ? m.previewUrl : m.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">{m.kind === 'video_360' ? <Globe size={16} /> : <Video size={16} />}</div>
                )}
                {i === 0 && <span className="absolute top-0.5 left-0.5 text-[8px] bg-yellow-400 text-black px-1 rounded font-bold">⭐</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">{props.existingMediaCount} médias déjà enregistrés</p>
        )}
      </Section>

      {/* Erreurs bloquantes */}
      {props.blockingErrors.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-900 flex items-center gap-1.5"><AlertTriangle size={14} /> Informations manquantes</p>
          <ul className="mt-1.5 space-y-0.5 text-[11px] text-red-800 list-disc list-inside">
            {props.blockingErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Case confirmation */}
      <label className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition ${props.confirmed ? 'bg-primary/5 border-primary/40' : 'bg-card border-border hover:bg-muted'}`}>
        <input type="checkbox" checked={props.confirmed} onChange={e => props.setConfirmed(e.target.checked)} className="accent-primary mt-0.5 h-4 w-4" />
        <span className="text-xs">
          <span className="font-semibold">Je confirme que toutes les informations fournies sont exactes.</span>
          <br />
          <span className="text-muted-foreground text-[11px]">En publiant cette annonce, je certifie être autorisé(e) à proposer ce bien à la location et accepter les conditions générales de la plateforme.</span>
        </span>
      </label>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-3 space-y-2">
      <p className="text-xs font-bold text-foreground">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

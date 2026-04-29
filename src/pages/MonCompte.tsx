import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Search as SearchIcon, Calendar, User as UserIcon, MessageSquare, LogOut, Trash2, Bell, BellOff, Loader2, Home as HomeIcon, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { listMyReservations, cancelReservation, reservationKindLabel, reservationStatusLabel, type ReservationRow } from '@/lib/reservationsService';
import { listSavedSearches, deleteSavedSearch, updateSavedSearch, type SavedSearchRow } from '@/lib/savedSearchesService';
import { supabase } from '@/integrations/supabase/client';
import { mockProperties } from '@/lib/mockData';
import ReservationChat from '@/components/ReservationChat';
import { toast } from 'sonner';

export default function MonCompte() {
  const { user, loading, signOut, isOwner, refreshRoles } = useAuth();
  const [becomingOwner, setBecomingOwner] = useState(false);
  const { ids: favIds, toggle: toggleFav } = useFavorites();
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [searches, setSearches] = useState<SavedSearchRow[]>([]);
  const [profile, setProfile] = useState<{ full_name: string; phone: string }>({ full_name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [chatOpenId, setChatOpenId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setDataLoading(true);
      try {
        const [res, sav, prof] = await Promise.all([
          listMyReservations().catch(() => []),
          listSavedSearches().catch(() => []),
          supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
        ]);
        setReservations(res);
        setSearches(sav);
        if (prof.data) setProfile({ full_name: prof.data.full_name ?? '', phone: prof.data.phone ?? '' });
      } finally { setDataLoading(false); }
    })();
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth?redirect=/mon-compte" replace />;

  const favoriteProperties = mockProperties.filter(p => favIds.includes(p.id));

  const onSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: profile.full_name.trim(), phone: profile.phone.trim()
      }).eq('id', user.id);
      if (error) throw error;
      toast.success('Profil mis à jour');
    } catch (e: any) { toast.error(e?.message ?? 'Erreur'); }
    finally { setSavingProfile(false); }
  };

  const onCancelReservation = async (id: string) => {
    if (!confirm('Annuler cette demande ?')) return;
    try {
      await cancelReservation(id);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
      toast.success('Demande annulée');
    } catch (e: any) { toast.error(e?.message ?? 'Erreur'); }
  };

  const onToggleAlert = async (s: SavedSearchRow) => {
    try {
      await updateSavedSearch(s.id, { alert_enabled: !s.alert_enabled });
      setSearches(prev => prev.map(x => x.id === s.id ? { ...x, alert_enabled: !s.alert_enabled } : x));
    } catch (e: any) { toast.error(e?.message ?? 'Erreur'); }
  };

  const onDeleteSearch = async (id: string) => {
    if (!confirm('Supprimer cette recherche ?')) return;
    try {
      await deleteSavedSearch(id);
      setSearches(prev => prev.filter(x => x.id !== id));
    } catch (e: any) { toast.error(e?.message ?? 'Erreur'); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <h1 className="text-base font-bold text-foreground">Mon compte</h1>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Bonjour</p>
          <h2 className="text-2xl font-bold text-foreground">{profile.full_name || user.email}</h2>
        </div>

        <Tabs defaultValue="reservations" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="reservations" className="gap-1.5"><Calendar className="h-4 w-4" /><span className="hidden sm:inline">Demandes</span></TabsTrigger>
            <TabsTrigger value="favorites" className="gap-1.5"><Heart className="h-4 w-4" /><span className="hidden sm:inline">Favoris</span></TabsTrigger>
            <TabsTrigger value="searches" className="gap-1.5"><SearchIcon className="h-4 w-4" /><span className="hidden sm:inline">Recherches</span></TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5"><UserIcon className="h-4 w-4" /><span className="hidden sm:inline">Profil</span></TabsTrigger>
          </TabsList>

          {/* RESERVATIONS */}
          <TabsContent value="reservations" className="mt-6 space-y-3">
            {dataLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
            {!dataLoading && reservations.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                Aucune demande pour le moment. <Link to="/" className="text-primary underline">Trouver un bien</Link>
              </Card>
            )}
            {reservations.map(r => {
              const prop = mockProperties.find(p => p.id === r.property_id);
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <Badge variant="outline" className="mb-1.5">{reservationKindLabel(r.kind)}</Badge>
                      <h3 className="font-semibold text-foreground">{prop?.title ?? 'Bien'}</h3>
                      <p className="text-xs text-muted-foreground">
                        {r.start_date && new Date(r.start_date).toLocaleDateString('fr-FR')}
                        {r.end_date && ` → ${new Date(r.end_date).toLocaleDateString('fr-FR')}`}
                        {r.visit_at && new Date(r.visit_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Badge className={
                      r.status === 'confirmed' ? 'bg-green-500/10 text-green-700 border-green-500/30' :
                      r.status === 'cancelled' ? 'bg-red-500/10 text-red-700 border-red-500/30' :
                      r.status === 'completed' ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' :
                      'bg-amber-500/10 text-amber-700 border-amber-500/30'
                    } variant="outline">{reservationStatusLabel(r.status)}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setChatOpenId(chatOpenId === r.id ? null : r.id)}>
                      <MessageSquare className="h-3.5 w-3.5" /> {chatOpenId === r.id ? 'Fermer' : 'Messages'}
                    </Button>
                    {r.status !== 'cancelled' && r.status !== 'completed' && (
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => onCancelReservation(r.id)}>
                        Annuler
                      </Button>
                    )}
                  </div>
                  {chatOpenId === r.id && (
                    <div className="mt-3">
                      <ReservationChat reservationId={r.id} viewerRole="client" viewerName={profile.full_name || r.contact_name || 'Client'} />
                    </div>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          {/* FAVORITES */}
          <TabsContent value="favorites" className="mt-6">
            {favoriteProperties.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                Aucun favori. Ajoutez des biens depuis la <Link to="/" className="text-primary underline">page d'accueil</Link>.
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoriteProperties.map(p => (
                  <Card key={p.id} className="p-3 flex gap-3">
                    <img src={p.images?.[0]} alt={p.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">{p.title}</h3>
                      <p className="text-xs text-muted-foreground">{p.quartier}</p>
                      <p className="text-sm font-bold text-primary mt-1">{p.price.toLocaleString('fr-FR')} FCFA</p>
                      <button onClick={() => toggleFav(p.id)} className="text-xs text-red-600 hover:underline mt-1">
                        Retirer
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* SAVED SEARCHES */}
          <TabsContent value="searches" className="mt-6 space-y-3">
            {searches.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                Aucune recherche sauvegardée.
              </Card>
            )}
            {searches.map(s => (
              <Card key={s.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(s.filters).length} filtre(s) · {new Date(s.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onToggleAlert(s)} className="gap-1.5">
                    {s.alert_enabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDeleteSearch(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* PROFILE */}
          <TabsContent value="profile" className="mt-6">
            <Card className="p-6 space-y-4 max-w-md">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input value={user.email ?? ''} disabled className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nom complet</label>
                <Input value={profile.full_name} maxLength={100} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
                <Input value={profile.phone} maxLength={30} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="mt-1" placeholder="+226 ..." />
              </div>
              <Button onClick={onSaveProfile} disabled={savingProfile} className="w-full">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

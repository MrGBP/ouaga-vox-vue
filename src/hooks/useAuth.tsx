import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import AuthModal from '@/components/AuthModal';
import { finalizePendingOwnerRole, ensureSignedInProfile } from '@/lib/authProfile';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isOwner: boolean;
  loading: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Open auth modal. If user already signed in, runs the action immediately. */
  requireAuth: (reasonOrAction: string | (() => void), action?: () => void) => void;
  /** Open the modal without an action (e.g. from the Login button in the header). */
  openAuthModal: (reason?: string) => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, isAdmin: false, isOwner: false, loading: true,
  refreshRoles: async () => {}, signOut: async () => {},
  requireAuth: () => {}, openAuthModal: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<string | undefined>(undefined);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const userRef = useRef<User | null>(null);

  useEffect(() => { userRef.current = user; }, [user]);

  const fetchRoles = async (uid: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', uid);
    setIsAdmin(!!data?.some(r => r.role === 'admin'));
    setIsOwner(!!data?.some(r => r.role === 'owner'));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        const fullName = sess.user.user_metadata?.full_name as string | undefined;
        const phone = sess.user.user_metadata?.phone as string | undefined;
        setTimeout(() => {
          ensureSignedInProfile(fullName, phone)
            .then(() => finalizePendingOwnerRole())
            .finally(() => fetchRoles(sess.user.id));
        }, 0);
      } else {
        setIsAdmin(false);
        setIsOwner(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const fullName = s.user.user_metadata?.full_name as string | undefined;
        const phone = s.user.user_metadata?.phone as string | undefined;
        ensureSignedInProfile(fullName, phone)
          .then(() => finalizePendingOwnerRole())
          .finally(() => fetchRoles(s.user.id).finally(() => setLoading(false)));
      } else {
        setLoading(false);
      }
    });

    const onRolesChanged = () => { if (userRef.current) void fetchRoles(userRef.current.id); };
    window.addEventListener('sapsap_roles_changed', onRolesChanged);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener('sapsap_roles_changed', onRolesChanged);
    };
  }, []);

  const refreshRoles = async () => { if (user) await fetchRoles(user.id); };
  const signOut = async () => { await supabase.auth.signOut(); };

  const openAuthModal = useCallback((reason?: string) => {
    setModalReason(reason);
    pendingActionRef.current = null;
    setModalOpen(true);
  }, []);

  const requireAuth = useCallback((reasonOrAction: string | (() => void), action?: () => void) => {
    const reason = typeof reasonOrAction === 'string' ? reasonOrAction : undefined;
    const cb = typeof reasonOrAction === 'function' ? reasonOrAction : action;
    if (user) {
      cb?.();
      return;
    }
    setModalReason(reason);
    pendingActionRef.current = cb ?? null;
    setModalOpen(true);
  }, [user]);

  const onAuthSuccess = useCallback(() => {
    const cb = pendingActionRef.current;
    pendingActionRef.current = null;
    // Defer so user state propagates first.
    if (cb) setTimeout(cb, 50);
  }, []);

  return (
    <Ctx.Provider value={{ user, session, isAdmin, isOwner, loading, refreshRoles, signOut, requireAuth, openAuthModal }}>
      {children}
      <AuthModal
        open={modalOpen}
        reason={modalReason}
        onClose={() => { setModalOpen(false); pendingActionRef.current = null; }}
        onSuccess={onAuthSuccess}
      />
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

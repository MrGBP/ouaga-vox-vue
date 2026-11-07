import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchNotifications, fetchUnreadCount, markNotificationRead, markAllRead as serverMarkAllRead,
  type AppNotification,
} from './notificationsService';
import { countUnread, markEveryRead, markOneRead, unreadTotal, upsertNotification } from './notificationState';

/**
 * One shared, live notification list per signed-in user.
 * Every bell, badge and list reads from here, so reading a notification
 * anywhere updates every counter at once; the database feed keeps other
 * devices in sync, with a periodic check as a safety net.
 */
type Snapshot = { userId: string | null; items: AppNotification[]; unread: number; loading: boolean };

const LIMIT = 300;
const POLL_MS = 30_000;
let snap: Snapshot = { userId: null, items: [], unread: 0, loading: true };
let base = { serverUnread: 0, loadedUnread: 0 };
const pendingRead = new Set<string>();
const listeners = new Set<() => void>();
let activeUser: string | null = null;
let refs = 0;
let fetchSeq = 0;
let teardown: (() => void) | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const emit = () => listeners.forEach(l => l());
const setItems = (items: AppNotification[]) => {
  snap = { ...snap, items, unread: unreadTotal(base.serverUnread, base.loadedUnread, items) };
  emit();
};

async function refresh() {
  const uid = activeUser;
  if (!uid) return;
  const seq = ++fetchSeq;
  try {
    const [list, count] = await Promise.all([fetchNotifications(uid, LIMIT), fetchUnreadCount(uid)]);
    if (seq !== fetchSeq || uid !== activeUser) return;
    base = { serverUnread: count, loadedUnread: countUnread(list) };
    let items = list;
    pendingRead.forEach(id => { items = markOneRead(items, id); });
    snap = { userId: uid, items, unread: unreadTotal(base.serverUnread, base.loadedUnread, items), loading: false };
    emit();
  } catch {
    if (seq === fetchSeq) { snap = { ...snap, userId: uid, loading: false }; emit(); }
  }
}

function scheduleRefresh(delay = 600) {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => { refreshTimer = null; void refresh(); }, delay);
}

function start(uid: string) {
  const onRow = (row: AppNotification) => {
    if (!row?.id || activeUser !== uid) return;
    setItems(upsertNotification(snap.items, row));
    scheduleRefresh();
  };
  const channel = supabase
    .channel(`notif-store-${uid}-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
      p => onRow(p.new as AppNotification))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
      p => onRow(p.new as AppNotification))
    .subscribe(status => { if (status === 'SUBSCRIBED') scheduleRefresh(0); });
  const poll = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, POLL_MS);
  const onFocus = () => scheduleRefresh(0);
  const onVisible = () => { if (document.visibilityState === 'visible') scheduleRefresh(0); };
  window.addEventListener('focus', onFocus);
  window.addEventListener('online', onFocus);
  document.addEventListener('visibilitychange', onVisible);
  teardown = () => {
    clearInterval(poll);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('online', onFocus);
    document.removeEventListener('visibilitychange', onVisible);
    supabase.removeChannel(channel);
  };
}

function stop() {
  teardown?.(); teardown = null;
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
  activeUser = null; pendingRead.clear(); fetchSeq++;
  snap = { userId: null, items: [], unread: 0, loading: true };
  emit();
}

function acquire(uid: string) {
  if (releaseTimer) { clearTimeout(releaseTimer); releaseTimer = null; }
  if (activeUser !== uid) {
    if (activeUser) stop();
    activeUser = uid;
    snap = { userId: uid, items: [], unread: 0, loading: true };
    emit();
    start(uid);
    void refresh();
  }
  refs++;
  return () => {
    refs = Math.max(0, refs - 1);
    if (refs === 0) releaseTimer = setTimeout(() => { releaseTimer = null; if (refs === 0) stop(); }, 3000);
  };
}

export async function markRead(id: string) {
  const item = snap.items.find(i => i.id === id);
  if (!item || item.read) return;
  pendingRead.add(id);
  setItems(markOneRead(snap.items, id));
  try { await markNotificationRead(id); }
  finally { pendingRead.delete(id); scheduleRefresh(); }
}

export async function markAllRead() {
  const uid = activeUser;
  if (!uid) return;
  const previous = snap.items; const prevBase = base;
  base = { serverUnread: 0, loadedUnread: 0 };
  setItems(markEveryRead(snap.items));
  try { await serverMarkAllRead(uid); }
  catch (e) { base = prevBase; setItems(previous); throw e; }
  finally { scheduleRefresh(); }
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getSnap = () => snap;

export function useNotifications(userId?: string | null) {
  useEffect(() => (userId ? acquire(userId) : undefined), [userId]);
  const s = useSyncExternalStore(subscribe, getSnap, getSnap);
  const ready = !!userId && s.userId === userId;
  return {
    items: ready ? s.items : [],
    unread: ready ? s.unread : 0,
    loading: userId ? (!ready || s.loading) : false,
    markRead,
    markAllRead,
    refresh,
  };
}

/** Pure helpers that keep the notification list and unread counter consistent. */
export interface NotifLike { id: string; read: boolean; created_at: string }

export function countUnread(items: NotifLike[]): number {
  return items.reduce((n, i) => n + (i.read ? 0 : 1), 0);
}

/** Insert or replace one notification (newest first, no duplicates). */
export function upsertNotification<T extends NotifLike>(items: T[], next: T): T[] {
  const exists = items.some(i => i.id === next.id);
  const list = exists ? items.map(i => (i.id === next.id ? { ...i, ...next } : i)) : [next, ...items];
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function removeNotification<T extends NotifLike>(items: T[], id: string): T[] {
  return items.filter(i => i.id !== id);
}

export function markOneRead<T extends NotifLike>(items: T[], id: string, at = new Date().toISOString()): T[] {
  return items.map(i => (i.id === id && !i.read ? { ...i, read: true, read_at: at } : i));
}

export function markEveryRead<T extends NotifLike>(items: T[], at = new Date().toISOString()): T[] {
  return items.map(i => (i.read ? i : { ...i, read: true, read_at: at }));
}

/**
 * Unread counter: the server total, corrected by local changes not yet reflected.
 * `serverUnread` counts every unread row; `loaded` is the subset kept in memory.
 */
export function unreadTotal(serverUnread: number, serverLoadedUnread: number, loaded: NotifLike[]): number {
  const outside = Math.max(0, serverUnread - serverLoadedUnread);
  return outside + countUnread(loaded);
}

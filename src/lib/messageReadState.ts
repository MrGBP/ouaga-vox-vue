export function unreadIncoming<T extends { id: string; sender_id?: string | null; read_by_owner?: boolean; read_by_client?: boolean; read_by_admin?: boolean }>(messages: T[], userId: string, role: 'owner' | 'client' | 'admin') {
  const key = role === 'owner' ? 'read_by_owner' : role === 'client' ? 'read_by_client' : 'read_by_admin';
  return messages.filter(m => m.sender_id !== userId && !m[key]).map(m => m.id);
}
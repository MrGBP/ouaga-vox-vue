import { supabase } from '@/integrations/supabase/client';

export interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, any>;
  alert_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export async function listSavedSearches(): Promise<SavedSearchRow[]> {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedSearchRow[];
}

export async function createSavedSearch(name: string, filters: Record<string, any>, alert_enabled = false): Promise<SavedSearchRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Connexion requise');
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({ user_id: user.id, name: name.trim(), filters, alert_enabled })
    .select()
    .single();
  if (error) throw error;
  return data as SavedSearchRow;
}

export async function updateSavedSearch(id: string, patch: Partial<Pick<SavedSearchRow, 'name' | 'filters' | 'alert_enabled'>>): Promise<void> {
  const { error } = await supabase.from('saved_searches').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const { error } = await supabase.from('saved_searches').delete().eq('id', id);
  if (error) throw error;
}

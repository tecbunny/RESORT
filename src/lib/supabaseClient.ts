import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function fetchCollections(): Promise<Record<string, any>> {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('resort_collections')
      .select('name, data');
    if (error) {
      console.warn('Error fetching collections from Supabase:', error);
      return {};
    }
    const result: Record<string, any> = {};
    if (data) {
      data.forEach(row => {
        result[row.name] = row.data;
      });
    }
    return result;
  } catch (err) {
    console.error('Supabase fetch failed:', err);
    return {};
  }
}

export async function saveCollection(name: string, data: any) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('resort_collections')
      .upsert({
        name,
        data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'name' });
    if (error) {
      console.error(`Error saving collection "${name}" to Supabase:`, error);
    }
  } catch (err) {
    console.error(`Failed to save collection "${name}" to Supabase:`, err);
  }
}

export function subscribeToCollections(onUpdate: (name: string, data: any) => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('resort-collections-changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'resort_collections' },
      (payload) => {
        const { name, data } = payload.new as { name: string; data: any };
        if (name && data) {
          onUpdate(name, data);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'resort_collections' },
      (payload) => {
        const { name, data } = payload.new as { name: string; data: any };
        if (name && data) {
          onUpdate(name, data);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

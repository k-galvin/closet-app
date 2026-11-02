import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from env or local storage config
const getEnvOrStorage = (key: string, storageKey: string): string => {
  const envVal = (import.meta.env as unknown as Record<string, string | undefined>)[key];
  return envVal || localStorage.getItem(storageKey) || '';
};

export const getSupabaseConfig = () => {
  const url = getEnvOrStorage('VITE_SUPABASE_URL', 'archival_supabase_url');
  const anonKey = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'archival_supabase_anon_key');
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey);
  }
  return supabaseInstance;
};

export const setSupabaseConfig = (url: string, anonKey: string) => {
  localStorage.setItem('archival_supabase_url', url);
  localStorage.setItem('archival_supabase_anon_key', anonKey);
  supabaseInstance = url && anonKey ? createClient(url, anonKey) : null;
};

// Storage upload helper
export const uploadClothingImage = async (file: File): Promise<string | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `items/${filename}`;

    const { error: uploadError } = await client.storage
      .from('closet-images')
      .upload(filePath, file, { contentType: file.type || 'image/png' });

    if (uploadError) {
      console.warn('Supabase image upload error, using local fallback:', uploadError.message);
      return null;
    }

    const { data } = client.storage.from('closet-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn('Supabase storage error:', err);
    return null;
  }
};

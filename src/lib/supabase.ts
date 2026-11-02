import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://oaqzbymmhusbhvscfcrp.supabase.co';
const DEFAULT_KEY = 'sb_publishable_Y8hY9if-e5PdwcmCKALzsQ_bzUpYVHp';

// Read from env or local storage config with pre-configured defaults
const getEnvOrStorage = (key: string, storageKey: string, defaultValue: string): string => {
  const envVal = (import.meta.env as unknown as Record<string, string | undefined>)[key];
  return envVal || localStorage.getItem(storageKey) || defaultValue;
};

export const getSupabaseConfig = () => {
  const url = getEnvOrStorage('VITE_SUPABASE_URL', 'archival_supabase_url', DEFAULT_URL);
  const anonKey = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'archival_supabase_anon_key', DEFAULT_KEY);
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

    // Try 'closet-images' first, then 'item-photos'
    const bucketsToTry = ['closet-images', 'item-photos'];

    for (const bucketName of bucketsToTry) {
      const { error: uploadError } = await client.storage
        .from(bucketName)
        .upload(filePath, file, { contentType: file.type || 'image/png', upsert: true });

      if (!uploadError) {
        const { data } = client.storage.from(bucketName).getPublicUrl(filePath);
        return data.publicUrl;
      }
    }

    return null;
  } catch (err) {
    console.warn('Supabase storage upload error, falling back to local storage:', err);
    return null;
  }
};

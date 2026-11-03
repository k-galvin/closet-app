import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClothingItem } from '../types';

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

export const isCloudUrl = (url: string): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

export interface UploadResult {
  success: boolean;
  url: string;
  isCloud: boolean;
  error?: string;
}

export const SQL_STORAGE_SETUP = `-- Run this in your Supabase SQL Editor:
-- 1. Create public storage bucket
insert into storage.buckets (id, name, public)
values ('closet-images', 'closet-images', true)
on conflict (id) do nothing;

-- 2. Allow public access to upload and view photos
drop policy if exists "Allow Public All" on storage.objects;
create policy "Allow Public All"
on storage.objects for all
using (bucket_id = 'closet-images')
with check (bucket_id = 'closet-images');`;

export const SQL_TABLE_SETUP = `-- Optional: Closet Items table in Supabase
create table if not exists public.closet_items (
  id text primary key,
  catalog_number text,
  name text,
  category text,
  subcategory text,
  designer text,
  color text,
  fabric text,
  seasons text[],
  notes text,
  image_url text,
  created_at bigint,
  updated_at bigint
);

alter table public.closet_items enable row level security;
drop policy if exists "Allow public access to closet_items" on public.closet_items;
create policy "Allow public access to closet_items"
on public.closet_items for all
using (true)
with check (true);`;

// Test Supabase connectivity, bucket existence, and write permissions
export interface SupabaseHealth {
  connected: boolean;
  projectUrl: string;
  bucketExists: boolean;
  bucketName: string;
  canUpload: boolean;
  error?: string;
}

export const testSupabaseHealth = async (): Promise<SupabaseHealth> => {
  const client = getSupabaseClient();
  const { url } = getSupabaseConfig();

  if (!client) {
    return {
      connected: false,
      projectUrl: url,
      bucketExists: false,
      bucketName: 'closet-images',
      canUpload: false,
      error: 'Supabase client is not configured.',
    };
  }

  try {
    const bucketName = 'closet-images';
    const testFileName = `health-check-${Date.now()}.txt`;
    const testBlob = new Blob(['archival-health-ping'], { type: 'text/plain' });

    // Directly test upload permissions on closet-images bucket
    const { error: uploadError } = await client.storage
      .from(bucketName)
      .upload(testFileName, testBlob, { upsert: true });

    if (!uploadError) {
      // Clean up test file
      await client.storage.from(bucketName).remove([testFileName]);
      return {
        connected: true,
        projectUrl: url,
        bucketExists: true,
        bucketName,
        canUpload: true,
      };
    }

    // If upload had an error, analyze it
    const msg = uploadError.message.toLowerCase();
    const isBucketMissing = msg.includes('bucket not found') || msg.includes('not found');
    const isRls = msg.includes('policy') || msg.includes('row-level security') || msg.includes('violates');

    return {
      connected: true,
      projectUrl: url,
      bucketExists: !isBucketMissing,
      bucketName,
      canUpload: false,
      error: isBucketMissing
        ? 'Bucket "closet-images" was not found in Supabase.'
        : isRls
        ? `Upload was blocked by RLS policy: ${uploadError.message}`
        : uploadError.message,
    };
  } catch (err) {
    return {
      connected: false,
      projectUrl: url,
      bucketExists: false,
      bucketName: 'closet-images',
      canUpload: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

// Storage upload helper with fallback and detailed status
export const uploadClothingImage = async (
  file: File,
  fallbackDataUrl?: string
): Promise<UploadResult> => {
  const client = getSupabaseClient();
  const fallback = fallbackDataUrl || '';

  if (!client) {
    return {
      success: false,
      url: fallback,
      isCloud: false,
      error: 'Supabase client is not configured. Saved locally.',
    };
  }

  try {
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `items/${filename}`;

    const bucketsToTry = ['closet-images', 'item-photos'];
    let lastError: string | undefined;

    for (const bucketName of bucketsToTry) {
      const { error: uploadError } = await client.storage
        .from(bucketName)
        .upload(filePath, file, { contentType: file.type || 'image/png', upsert: true });

      if (!uploadError) {
        const { data } = client.storage.from(bucketName).getPublicUrl(filePath);
        return {
          success: true,
          url: data.publicUrl,
          isCloud: true,
        };
      } else {
        lastError = uploadError.message;
      }
    }

    return {
      success: false,
      url: fallback,
      isCloud: false,
      error: lastError || 'Bucket "closet-images" upload failed.',
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      url: fallback,
      isCloud: false,
      error: errMsg,
    };
  }
};

// Convert Data URL to a real File, supporting both Base64 and UTF-8/SVG data URIs
export const dataUrlToFile = (dataUrl: string, fileNamePrefix: string = 'garment'): File => {
  const parts = dataUrl.split(',');
  const header = parts[0];
  const data = parts.slice(1).join(',');

  const mimeMatch = header.match(/data:([^;,]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const isBase64 = header.includes(';base64');

  let u8arr: Uint8Array;
  if (isBase64) {
    const bstr = atob(data);
    let n = bstr.length;
    u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
  } else {
    // UTF-8 / URL-encoded (e.g. data:image/svg+xml;utf8,...)
    const decoded = decodeURIComponent(data);
    const encoder = new TextEncoder();
    u8arr = encoder.encode(decoded);
  }

  let ext = 'png';
  if (mime.includes('svg')) ext = 'svg';
  else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
  else if (mime.includes('webp')) ext = 'webp';

  return new File([u8arr], `${fileNamePrefix}.${ext}`, { type: mime });
};

// Convert Data URL to Blob and upload to Supabase
export const uploadDataUrlToSupabase = async (
  dataUrl: string,
  fileNamePrefix: string = 'garment'
): Promise<UploadResult> => {
  try {
    const file = dataUrlToFile(dataUrl, fileNamePrefix);
    return uploadClothingImage(file, dataUrl);
  } catch (err) {
    return {
      success: false,
      url: dataUrl,
      isCloud: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

// Sync item metadata to Supabase closet_items table if available
export const syncClothingItemToSupabase = async (item: ClothingItem): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: item.id,
      catalog_number: item.catalogNumber,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory || null,
      designer: item.designer || null,
      color: item.color,
      fabric: item.fabric || null,
      seasons: item.seasons,
      notes: item.notes || null,
      image_url: item.imageUrl,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };

    const { error } = await client.from('closet_items').upsert(row, { onConflict: 'id' });
    if (error) {
      // If table does not exist or RLS blocks it, log silently
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// Delete item from Supabase table if available
export const deleteClothingItemFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('closet_items').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
};

// Fetch all clothing items from Supabase closet_items table
export const fetchSupabaseItems = async (): Promise<ClothingItem[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client.from('closet_items').select('*');
    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      catalogNumber: row.catalog_number,
      name: row.name,
      category: row.category,
      subcategory: row.subcategory || undefined,
      designer: row.designer || undefined,
      color: row.color,
      fabric: row.fabric || undefined,
      seasons: row.seasons || [],
      notes: row.notes || undefined,
      imageUrl: row.image_url,
      createdAt: Number(row.created_at) || Date.now(),
      updatedAt: Number(row.updated_at) || Date.now(),
    }));
  } catch {
    return [];
  }
};

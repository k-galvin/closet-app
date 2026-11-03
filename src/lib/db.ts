import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ClothingItem, Collection, Outfit } from '../types';
import { INITIAL_ITEMS, INITIAL_COLLECTIONS, INITIAL_OUTFITS } from './seedData';
import { syncClothingItemToSupabase, deleteClothingItemFromSupabase, fetchSupabaseItems } from './supabase';

interface ClosetDB extends DBSchema {
  items: {
    key: string;
    value: ClothingItem;
    indexes: { 'by-category': string; 'by-created': number };
  };
  outfits: {
    key: string;
    value: Outfit;
    indexes: { 'by-created': number };
  };
  collections: {
    key: string;
    value: Collection;
    indexes: { 'by-created': number };
  };
}

const DB_NAME = 'archival_closet_db';
const DB_VERSION = 1;

const SEEDED_FLAG = 'archival_closet_seeded_v1';
const DELETED_ITEMS_KEY = 'archival_closet_deleted_ids_v1';
const DEMO_PURGED_FLAG = 'archival_demo_purged_v2';
export const DEMO_ITEM_IDS = [
  'item-1', 'item-2', 'item-3', 'item-4', 'item-5',
  'item-6', 'item-7', 'item-8', 'item-9'
];

export const getDeletedItemIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_ITEMS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

export const markItemAsDeleted = (id: string): void => {
  try {
    const set = getDeletedItemIds();
    set.add(id);
    localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify([...set]));
  } catch {}
};

let dbPromise: Promise<IDBPDatabase<ClosetDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<ClosetDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('items')) {
          const itemStore = db.createObjectStore('items', { keyPath: 'id' });
          itemStore.createIndex('by-category', 'category');
          itemStore.createIndex('by-created', 'createdAt');
        }

        if (!db.objectStoreNames.contains('outfits')) {
          const outfitStore = db.createObjectStore('outfits', { keyPath: 'id' });
          outfitStore.createIndex('by-created', 'createdAt');
        }

        if (!db.objectStoreNames.contains('collections')) {
          const colStore = db.createObjectStore('collections', { keyPath: 'id' });
          colStore.createIndex('by-created', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
};

// Seed initial data ONLY once on first app run if user has no data in cloud or locally.
// Never resurrect items deleted by the user.
export const initDB = async (): Promise<void> => {
  const hasSeeded = localStorage.getItem(SEEDED_FLAG);
  if (hasSeeded) return;

  const db = await getDB();
  const itemCount = await db.count('items');
  if (itemCount === 0) {
    // If Supabase already has user's real items, skip sample seeding
    try {
      const cloudItems = await fetchSupabaseItems();
      if (cloudItems.length > 0) {
        localStorage.setItem(SEEDED_FLAG, 'true');
        return;
      }
    } catch {}

    const tx = db.transaction(['items', 'collections', 'outfits'], 'readwrite');
    for (const item of INITIAL_ITEMS) {
      await tx.objectStore('items').put(item);
    }
    for (const col of INITIAL_COLLECTIONS) {
      await tx.objectStore('collections').put(col);
    }
    for (const outfit of INITIAL_OUTFITS) {
      await tx.objectStore('outfits').put(outfit);
    }
    await tx.done;
  }
  localStorage.setItem(SEEDED_FLAG, 'true');
};

// Purge the 9 demo placeholder garments permanently
export const purgeDemoItems = async (): Promise<void> => {
  for (const id of DEMO_ITEM_IDS) {
    markItemAsDeleted(id);
  }

  const db = await getDB();
  const tx = db.transaction(['items', 'collections', 'outfits'], 'readwrite');
  for (const id of DEMO_ITEM_IDS) {
    await tx.objectStore('items').delete(id);
  }
  await tx.done;

  // Ensure they are also deleted from Supabase cloud
  for (const id of DEMO_ITEM_IDS) {
    deleteClothingItemFromSupabase(id).catch(() => {});
  }
  localStorage.setItem(DEMO_PURGED_FLAG, 'true');
};

// Item Operations
export const getAllItems = async (): Promise<ClothingItem[]> => {
  await initDB();
  const db = await getDB();

  // One-time auto-purge of demo items if the user has custom items
  if (!localStorage.getItem(DEMO_PURGED_FLAG)) {
    const all = await db.getAll('items');
    const hasCustomItems = all.some((item) => !DEMO_ITEM_IDS.includes(item.id));
    if (hasCustomItems) {
      await purgeDemoItems();
    }
  }

  const deletedIds = getDeletedItemIds();

  // Clean out any lingering deleted items from IndexedDB
  const initialLocal = await db.getAll('items');
  const itemsToPurgeLocally = initialLocal.filter((i) => deletedIds.has(i.id));
  if (itemsToPurgeLocally.length > 0) {
    const purgeTx = db.transaction('items', 'readwrite');
    for (const item of itemsToPurgeLocally) {
      await purgeTx.objectStore('items').delete(item.id);
    }
    await purgeTx.done;
  }

  const localItems = (await db.getAll('items')).filter((i) => !deletedIds.has(i.id));

  // Automatic 2-way sync with Supabase cloud table
  try {
    const cloudItems = await fetchSupabaseItems();
    
    // Purge any cloud items that match locally deleted IDs
    for (const c of cloudItems) {
      if (deletedIds.has(c.id)) {
        deleteClothingItemFromSupabase(c.id).catch(() => {});
      }
    }

    const validCloudItems = cloudItems.filter((c) => !deletedIds.has(c.id));
    const cloudIds = new Set(validCloudItems.map((c) => c.id));

    // 1. Push any local custom garments that aren't yet in Supabase table
    for (const localItem of localItems) {
      if (!cloudIds.has(localItem.id) && !deletedIds.has(localItem.id)) {
        await syncClothingItemToSupabase(localItem);
      }
    }

    // 2. Pull down any cloud items saved from other devices
    if (validCloudItems.length > 0) {
      const tx = db.transaction('items', 'readwrite');
      for (const item of validCloudItems) {
        await tx.objectStore('items').put(item);
      }
      await tx.done;
    }
  } catch {
    // Offline mode: proceed with local items
  }

  const items = (await db.getAll('items')).filter((i) => !deletedIds.has(i.id));
  return items.sort((a, b) => b.createdAt - a.createdAt);
};

export const getItemById = async (id: string): Promise<ClothingItem | undefined> => {
  const db = await getDB();
  const item = await db.get('items', id);
  if (!item || getDeletedItemIds().has(id)) return undefined;
  return item;
};

export const saveItem = async (item: ClothingItem): Promise<void> => {
  // If item was previously deleted, un-delete it
  const deletedIds = getDeletedItemIds();
  if (deletedIds.has(item.id)) {
    deletedIds.delete(item.id);
    localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify([...deletedIds]));
  }

  const db = await getDB();
  await db.put('items', item);
  // Attempt background sync to Supabase table if configured
  syncClothingItemToSupabase(item).catch(() => {});
};

export const deleteItem = async (id: string): Promise<void> => {
  // 1. Mark as permanently deleted in local tombstone registry
  markItemAsDeleted(id);

  // 2. Remove from local IndexedDB
  const db = await getDB();
  const tx = db.transaction(['items', 'collections', 'outfits'], 'readwrite');
  await tx.objectStore('items').delete(id);

  // Remove from any collections
  const collections = await tx.objectStore('collections').getAll();
  for (const col of collections) {
    if (col.itemIds.includes(id)) {
      col.itemIds = col.itemIds.filter((itemId) => itemId !== id);
      await tx.objectStore('collections').put(col);
    }
  }

  // Remove from outfits if assigned
  const outfits = await tx.objectStore('outfits').getAll();
  for (const outfit of outfits) {
    let changed = false;
    const slots = { ...outfit.slots };
    (Object.keys(slots) as (keyof typeof slots)[]).forEach((slotKey) => {
      if (slots[slotKey] === id) {
        delete slots[slotKey];
        changed = true;
      }
    });
    if (changed) {
      outfit.slots = slots;
      await tx.objectStore('outfits').put(outfit);
    }
  }

  await tx.done;

  // 3. Await deletion from Supabase so it does not resurrect on refresh
  try {
    await deleteClothingItemFromSupabase(id);
  } catch {
    // Offline or network error: tombstone prevents resurrection
  }
};

// Collection Operations
export const getAllCollections = async (): Promise<Collection[]> => {
  await initDB();
  const db = await getDB();
  const collections = await db.getAll('collections');
  return collections.sort((a, b) => b.createdAt - a.createdAt);
};

export const saveCollection = async (collection: Collection): Promise<void> => {
  const db = await getDB();
  await db.put('collections', collection);
};

export const deleteCollection = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('collections', id);
};

export const toggleItemInCollection = async (collectionId: string, itemId: string): Promise<boolean> => {
  const db = await getDB();
  const col = await db.get('collections', collectionId);
  if (!col) return false;

  const exists = col.itemIds.includes(itemId);
  if (exists) {
    col.itemIds = col.itemIds.filter((id) => id !== itemId);
  } else {
    col.itemIds.push(itemId);
  }
  col.updatedAt = Date.now();
  await db.put('collections', col);
  return !exists;
};

// Outfit Operations
export const getAllOutfits = async (): Promise<Outfit[]> => {
  await initDB();
  const db = await getDB();
  const outfits = await db.getAll('outfits');
  return outfits.sort((a, b) => b.createdAt - a.createdAt);
};

export const saveOutfit = async (outfit: Outfit): Promise<void> => {
  const db = await getDB();
  await db.put('outfits', outfit);
};

export const deleteOutfit = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('outfits', id);
};

// Reset to sample catalog
export const resetToSeedData = async (): Promise<void> => {
  localStorage.removeItem(DELETED_ITEMS_KEY);
  localStorage.removeItem(DEMO_PURGED_FLAG);

  const db = await getDB();
  const tx = db.transaction(['items', 'collections', 'outfits'], 'readwrite');
  await tx.objectStore('items').clear();
  await tx.objectStore('collections').clear();
  await tx.objectStore('outfits').clear();

  for (const item of INITIAL_ITEMS) {
    await tx.objectStore('items').put(item);
  }
  for (const col of INITIAL_COLLECTIONS) {
    await tx.objectStore('collections').put(col);
  }
  for (const outfit of INITIAL_OUTFITS) {
    await tx.objectStore('outfits').put(outfit);
  }
  await tx.done;
  localStorage.setItem(SEEDED_FLAG, 'true');
};

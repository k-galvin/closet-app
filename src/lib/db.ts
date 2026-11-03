import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ClothingItem, Collection, Outfit } from '../types';
import { INITIAL_ITEMS, INITIAL_COLLECTIONS, INITIAL_OUTFITS } from './seedData';
import { syncClothingItemToSupabase, deleteClothingItemFromSupabase } from './supabase';

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

// Seed initial data ONLY once on first app run.
// Never resurrect items deleted by the user.
export const initDB = async (): Promise<void> => {
  const hasSeeded = localStorage.getItem(SEEDED_FLAG);
  if (hasSeeded) return;

  const db = await getDB();
  const itemCount = await db.count('items');
  if (itemCount === 0) {
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

// Item Operations
export const getAllItems = async (): Promise<ClothingItem[]> => {
  await initDB();
  const db = await getDB();
  const items = await db.getAll('items');
  return items.sort((a, b) => b.createdAt - a.createdAt);
};

export const getItemById = async (id: string): Promise<ClothingItem | undefined> => {
  const db = await getDB();
  return db.get('items', id);
};

export const saveItem = async (item: ClothingItem): Promise<void> => {
  const db = await getDB();
  await db.put('items', item);
  // Attempt background sync to Supabase table if configured
  syncClothingItemToSupabase(item).catch(() => {});
};

export const deleteItem = async (id: string): Promise<void> => {
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
  // Attempt to delete from Supabase table if configured
  deleteClothingItemFromSupabase(id).catch(() => {});
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

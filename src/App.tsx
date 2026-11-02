import { useState, useEffect, useCallback } from 'react';
import { ClothingItem, Collection, Outfit, ViewTab } from './types';
import {
  getAllItems,
  getAllCollections,
  getAllOutfits,
  saveItem,
  deleteItem,
  saveCollection,
  deleteCollection,
  toggleItemInCollection,
  saveOutfit,
  deleteOutfit,
  resetToSeedData,
} from './lib/db';
import { Spine } from './components/Layout/Spine';
import { TopNav } from './components/Layout/TopNav';
import { MobileTabBar } from './components/Layout/MobileTabBar';
import { ClosetView } from './components/Closet/ClosetView';
import { ItemDetailModal } from './components/Closet/ItemDetailModal';
import { OutfitBuilder } from './components/OutfitBuilder/OutfitBuilder';
import { CollectionsView } from './components/Collections/CollectionsView';
import { AcquireModal } from './components/Acquire/AcquireModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import './App.scss';

export function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('closet');
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isAcquireOpen, setIsAcquireOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [itemForBuilder, setItemForBuilder] = useState<ClothingItem | null>(null);

  // Load database items on start
  const refreshData = useCallback(async () => {
    try {
      const [dbItems, dbCollections, dbOutfits] = await Promise.all([
        getAllItems(),
        getAllCollections(),
        getAllOutfits(),
      ]);
      setItems(dbItems);
      setCollections(dbCollections);
      setOutfits(dbOutfits);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Next catalog code helper (e.g. ARC-CLO-009)
  const nextCatalogNumber = `ARC-CLO-${String(items.length + 1).padStart(3, '0')}`;

  // Item handlers
  const handleAcquire = async (newItem: ClothingItem) => {
    await saveItem(newItem);
    await refreshData();
  };

  const handleUpdateItem = async (updatedItem: ClothingItem) => {
    await saveItem(updatedItem);
    setSelectedItem(updatedItem);
    await refreshData();
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
    setSelectedItem(null);
    await refreshData();
  };

  // Collection handlers
  const handleCreateCollection = async (title: string, subtitle?: string) => {
    const newCol: Collection = {
      id: `col-${Date.now()}`,
      title,
      subtitle,
      itemIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveCollection(newCol);
    await refreshData();
  };

  const handleDeleteCollection = async (id: string) => {
    await deleteCollection(id);
    await refreshData();
  };

  const handleToggleCollection = async (collectionId: string, itemId: string) => {
    await toggleItemInCollection(collectionId, itemId);
    await refreshData();
  };

  const handleRemoveItemFromCollection = async (collectionId: string, itemId: string) => {
    const col = collections.find((c) => c.id === collectionId);
    if (!col) return;
    col.itemIds = col.itemIds.filter((id) => id !== itemId);
    col.updatedAt = Date.now();
    await saveCollection(col);
    await refreshData();
  };

  const handleAddItemToCollection = async (collectionId: string, itemId: string) => {
    const col = collections.find((c) => c.id === collectionId);
    if (!col || col.itemIds.includes(itemId)) return;
    col.itemIds.push(itemId);
    col.updatedAt = Date.now();
    await saveCollection(col);
    await refreshData();
  };

  // Outfit handlers
  const handleSaveOutfit = async (newOutfit: Outfit) => {
    await saveOutfit(newOutfit);
    await refreshData();
  };

  const handleDeleteOutfit = async (id: string) => {
    await deleteOutfit(id);
    await refreshData();
  };

  const handleSendToOutfitBuilder = (item: ClothingItem) => {
    setItemForBuilder(item);
    setSelectedItem(null);
    setActiveTab('outfits');
  };

  // Seed / Export handlers
  const handleResetSeedData = async () => {
    await resetToSeedData();
    await refreshData();
  };

  const handleExportData = () => {
    const backup = { items, collections, outfits, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archival-closet-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="app-loading-screen">
        <div className="loading-accent-dot" />
        <span className="font-mono loading-text">INITIALIZING ARCHIVE...</span>
      </div>
    );
  }

  return (
    <div className="archival-app-shell">
      {/* Desktop Magazine Spine */}
      <Spine activeTab={activeTab} />

      {/* Main Content Area */}
      <div className="app-main-canvas">
        {/* Top Header */}
        <TopNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAcquire={() => setIsAcquireOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          totalItems={items.length}
        />

        {/* View Switcher */}
        <main className="app-viewport">
          {activeTab === 'closet' && (
            <ClosetView
              items={items}
              collections={collections}
              onSelectItem={(item) => setSelectedItem(item)}
              onOpenAcquire={() => setIsAcquireOpen(true)}
            />
          )}

          {activeTab === 'outfits' && (
            <OutfitBuilder
              items={items}
              outfits={outfits}
              initialSlotItem={itemForBuilder}
              onSaveOutfit={handleSaveOutfit}
              onDeleteOutfit={handleDeleteOutfit}
            />
          )}

          {activeTab === 'collections' && (
            <CollectionsView
              collections={collections}
              items={items}
              onCreateCollection={handleCreateCollection}
              onDeleteCollection={handleDeleteCollection}
              onRemoveItemFromCollection={handleRemoveItemFromCollection}
              onAddItemToCollection={handleAddItemToCollection}
              onSelectItem={(item) => setSelectedItem(item)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (iOS) */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAcquire={() => setIsAcquireOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Modals */}
      <ItemDetailModal
        item={selectedItem}
        collections={collections}
        onClose={() => setSelectedItem(null)}
        onDelete={handleDeleteItem}
        onUpdate={handleUpdateItem}
        onToggleCollection={handleToggleCollection}
        onSendToOutfitBuilder={handleSendToOutfitBuilder}
      />

      <AcquireModal
        isOpen={isAcquireOpen}
        onClose={() => setIsAcquireOpen(false)}
        onAcquire={handleAcquire}
        nextCatalogNumber={nextCatalogNumber}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onResetSeedData={handleResetSeedData}
        onExportData={handleExportData}
      />
    </div>
  );
}

export default App;

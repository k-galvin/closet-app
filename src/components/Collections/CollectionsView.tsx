import React, { useState } from 'react';
import { ClothingItem, Collection } from '../../types';
import { Plus, Trash2, X, Bookmark, PlusCircle } from 'lucide-react';
import './CollectionsView.scss';

interface CollectionsViewProps {
  collections: Collection[];
  items: ClothingItem[];
  onCreateCollection: (title: string, subtitle?: string) => void;
  onDeleteCollection: (id: string) => void;
  onRemoveItemFromCollection: (collectionId: string, itemId: string) => void;
  onAddItemToCollection: (collectionId: string, itemId: string) => void;
  onSelectItem: (item: ClothingItem) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  items,
  onCreateCollection,
  onDeleteCollection,
  onRemoveItemFromCollection,
  onAddItemToCollection,
  onSelectItem,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pickerCollectionId, setPickerCollectionId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateCollection(newTitle.trim(), newSubtitle.trim() || undefined);
    setNewTitle('');
    setNewSubtitle('');
    setShowCreateModal(false);
  };

  const activePickerCollection = collections.find((c) => c.id === pickerCollectionId);

  return (
    <div className="collections-view-container">
      {/* Header with Inline Creation Trigger */}
      <section className="collections-header">
        <div className="header-meta">
          <span className="archival-overline text-accent">CURATORIAL GROUPINGS // TRAVEL & CAPSULES</span>
          <div className="title-row">
            <h1 className="view-title">Collections</h1>
            <span className="record-count font-mono">
              [ {String(collections.length).padStart(2, '0')} CAPSULES ACTIVE ]
            </span>
          </div>
        </div>

        <button
          type="button"
          className="archival-btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={13} strokeWidth={2.5} /> NEW COLLECTION
        </button>
      </section>

      {/* Collections Stack */}
      {collections.length > 0 ? (
        <div className="collections-stack">
          {collections.map((col) => {
            const collectionItems = col.itemIds
              .map((id) => items.find((i) => i.id === id))
              .filter(Boolean) as ClothingItem[];

            return (
              <article key={col.id} className="collection-card">
                <div className="card-header">
                  <div className="header-meta">
                    <span className="archival-overline text-accent">
                      {collectionItems.length} {collectionItems.length === 1 ? 'ITEM' : 'ITEMS'} PACKED
                    </span>
                    <h2 className="col-title">{col.title}</h2>
                    {col.subtitle && (
                      <p className="col-subtitle font-editorial">{col.subtitle}</p>
                    )}
                  </div>

                  <div className="card-actions">
                    <button
                      type="button"
                      className="add-items-quick-btn font-mono"
                      onClick={() => setPickerCollectionId(col.id)}
                    >
                      <PlusCircle size={13} /> ADD GARMENTS
                    </button>
                    <button
                      type="button"
                      className="delete-col-btn font-mono"
                      onClick={() => onDeleteCollection(col.id)}
                      title="De-archive collection"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Horizontal Item Strip (Matching Archival) */}
                <div className="items-strip hide-scrollbar">
                  {collectionItems.map((item) => (
                    <div key={item.id} className="item-thumb-wrapper">
                      <div className="thumb-box" onClick={() => onSelectItem(item)}>
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="thumb-img"
                        />
                        <button
                          type="button"
                          className="remove-item-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItemFromCollection(col.id, item.id);
                          }}
                          title="Remove from packing list"
                        >
                          <X size={10} />
                        </button>
                      </div>
                      <span className="thumb-label font-mono">{item.name}</span>
                      <span className="thumb-sub font-mono">{item.category}</span>
                    </div>
                  ))}

                  {/* Empty item placeholder trigger */}
                  <button
                    type="button"
                    className="add-item-strip-slot"
                    onClick={() => setPickerCollectionId(col.id)}
                  >
                    <Plus size={18} strokeWidth={1.5} />
                    <span className="slot-label font-mono">PACK ITEM</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-collections-state">
          <Bookmark size={28} color="#0047ab" strokeWidth={1.5} />
          <h2 className="empty-title">No collections curated yet</h2>
          <p className="empty-desc">
            Organize packing lists for trips (e.g. "Paris Spring Trip"), capsule wardrobes, or seasonal rotations.
          </p>
          <button
            type="button"
            className="archival-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            CREATE FIRST COLLECTION
          </button>
        </div>
      )}

      {/* New Collection Modal */}
      {showCreateModal && (
        <div className="archival-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="archival-modal" onClick={(e) => e.stopPropagation()}>
            <span className="archival-overline text-accent">NEW REGISTRY CAPSULE</span>
            <h2 className="modal-title">Create Collection</h2>
            <p className="modal-subtitle">
              Group items together for packing, seasonal capsules, or thematic curations.
            </p>

            <form onSubmit={handleCreate} className="create-col-form">
              <div className="form-group">
                <label className="font-mono field-label">TITLE *</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. 48 Hours in Copenhagen"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="font-mono field-label">SUBTITLE / THEME</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Autumn Weekend Packing Capsule"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                />
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="archival-btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="archival-btn-primary"
                  disabled={!newTitle.trim()}
                >
                  INITIALIZE CAPSULE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Garment Picker Modal (to pack garments into this collection) */}
      {pickerCollectionId && activePickerCollection && (
        <div className="archival-modal-overlay" onClick={() => setPickerCollectionId(null)}>
          <div className="archival-modal picker-modal" onClick={(e) => e.stopPropagation()}>
            <span className="archival-overline text-accent">
              PACKING // {activePickerCollection.title.toUpperCase()}
            </span>
            <h2 className="modal-title">Select Garments to Include</h2>
            <p className="modal-subtitle">
              Tap garments from your wardrobe to pack or un-pack from this collection.
            </p>

            <div className="picker-items-grid hide-scrollbar">
              {items.map((item) => {
                const isPacked = activePickerCollection.itemIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`picker-item-card ${isPacked ? 'is-packed' : ''}`}
                    onClick={() => {
                      if (isPacked) {
                        onRemoveItemFromCollection(activePickerCollection.id, item.id);
                      } else {
                        onAddItemToCollection(activePickerCollection.id, item.id);
                      }
                    }}
                  >
                    <div className="picker-thumb">
                      <img src={item.imageUrl} alt={item.name} />
                      <div className="packed-check font-mono">
                        {isPacked ? 'PACKED ✓' : '+ PACK'}
                      </div>
                    </div>
                    <span className="picker-name font-mono">{item.name}</span>
                    <span className="picker-meta font-mono">{item.designer || item.category}</span>
                  </button>
                );
              })}
            </div>

            <div className="picker-footer">
              <button
                type="button"
                className="archival-btn-primary"
                onClick={() => setPickerCollectionId(null)}
              >
                DONE PACKING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

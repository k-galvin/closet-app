import React, { useState } from 'react';
import { ClothingItem, Collection } from '../../types';
import { X, Trash2, Bookmark, Layers, Edit3, Check, Cloud, HardDrive, ArrowUpCircle } from 'lucide-react';
import { isCloudUrl, uploadDataUrlToSupabase } from '../../lib/supabase';
import './ItemDetailModal.scss';

interface ItemDetailModalProps {
  item: ClothingItem | null;
  collections: Collection[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (item: ClothingItem) => void;
  onToggleCollection: (collectionId: string, itemId: string) => void;
  onSendToOutfitBuilder: (item: ClothingItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  collections,
  onClose,
  onDelete,
  onUpdate,
  onToggleCollection,
  onSendToOutfitBuilder,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDesigner, setEditedDesigner] = useState('');
  const [editedFabric, setEditedFabric] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);

  if (!item) return null;

  const handleStartEdit = () => {
    setEditedName(item.name);
    setEditedDesigner(item.designer || '');
    setEditedFabric(item.fabric || '');
    setEditedNotes(item.notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdate({
      ...item,
      name: editedName.trim() || item.name,
      designer: editedDesigner.trim() || undefined,
      fabric: editedFabric.trim() || undefined,
      notes: editedNotes.trim() || undefined,
      updatedAt: Date.now(),
    });
    setIsEditing(false);
  };

  const handleSyncToCloud = async () => {
    if (!item.imageUrl.startsWith('data:')) return;
    setIsSyncingCloud(true);
    setCloudSyncMsg('Uploading to Supabase Storage...');
    const result = await uploadDataUrlToSupabase(item.imageUrl, item.catalogNumber);
    if (result.success && result.isCloud) {
      onUpdate({
        ...item,
        imageUrl: result.url,
        updatedAt: Date.now(),
      });
      setCloudSyncMsg('✓ Successfully synced to Supabase Cloud Storage!');
    } else {
      setCloudSyncMsg(`Cloud sync failed: ${result.error || 'Check Supabase bucket settings.'}`);
    }
    setIsSyncingCloud(false);
  };

  const isCloud = isCloudUrl(item.imageUrl);

  return (
    <div className="archival-modal-overlay" onClick={onClose}>
      <div
        className="archival-modal item-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="close-modal-btn"
          onClick={onClose}
          aria-label="Close record view"
        >
          <X size={20} />
        </button>

        {isConfirmingDelete ? (
          <div className="delete-confirmation-screen">
            <span className="archival-overline text-accent">RECORD DELETION</span>
            <h2 className="modal-title">De-archive this item?</h2>
            <p className="modal-subtitle">
              This will permanently remove <strong>{item.name}</strong> ({item.catalogNumber}) from your closet, saved outfits, and collections.
            </p>

            <div className="modal-actions-dual">
              <button
                type="button"
                className="archival-btn-secondary"
                onClick={() => setIsConfirmingDelete(false)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="archival-btn-danger"
                onClick={() => onDelete(item.id)}
              >
                CONFIRM DELETION
              </button>
            </div>
          </div>
        ) : (
          <div className="item-detail-content">
            {/* Specimen Exhibition Plate */}
            <div className="detail-specimen-plate">
              <div className="specimen-tag font-mono">{item.catalogNumber}</div>
              <div className="specimen-image-container">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="specimen-image"
                />
              </div>
            </div>

            {/* Information Column */}
            <div className="detail-info-pane">
              <div className="info-header">
                <div className="header-meta-row">
                  <span className="archival-overline text-accent">
                    {item.category.toUpperCase()} // REGISTRY RECORD
                  </span>

                  {/* Cloud / Local Storage Indicator Badge */}
                  <div className="storage-status-pill font-mono">
                    {isCloud ? (
                      <span className="badge-cloud" title="Hosted on Supabase Storage">
                        <Cloud size={10} /> SUPABASE CLOUD
                      </span>
                    ) : (
                      <span className="badge-local" title="Stored locally in device IndexedDB">
                        <HardDrive size={10} /> LOCAL OFFLINE
                      </span>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="edit-form-block">
                    <input
                      type="text"
                      className="edit-input title-input"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Item name"
                    />
                    <input
                      type="text"
                      className="edit-input"
                      value={editedDesigner}
                      onChange={(e) => setEditedDesigner(e.target.value)}
                      placeholder="Designer / Label"
                    />
                    <input
                      type="text"
                      className="edit-input"
                      value={editedFabric}
                      onChange={(e) => setEditedFabric(e.target.value)}
                      placeholder="Fabric composition"
                    />
                    <textarea
                      className="edit-textarea"
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Curatorial notes..."
                      rows={3}
                    />
                    <div className="edit-actions">
                      <button
                        type="button"
                        className="archival-btn-primary"
                        onClick={handleSaveEdit}
                      >
                        <Check size={12} /> SAVE CHANGES
                      </button>
                      <button
                        type="button"
                        className="archival-btn-secondary"
                        onClick={() => setIsEditing(false)}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="specimen-title">{item.name}</h2>
                    {item.designer && (
                      <p className="specimen-designer font-editorial">
                        {item.designer}
                      </p>
                    )}
                  </>
                )}
              </div>

              {!isEditing && (
                <>
                  <div className="specimen-specs-grid font-mono">
                    <div className="spec-item">
                      <span className="spec-label">COLORWAY</span>
                      <span className="spec-value">{item.color}</span>
                    </div>

                    {item.fabric && (
                      <div className="spec-item">
                        <span className="spec-label">FABRIC</span>
                        <span className="spec-value">{item.fabric}</span>
                      </div>
                    )}

                    <div className="spec-item">
                      <span className="spec-label">SEASONS</span>
                      <span className="spec-value">
                        {item.seasons.join(' · ')}
                      </span>
                    </div>

                    <div className="spec-item">
                      <span className="spec-label">REGISTERED</span>
                      <span className="spec-value">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Sync to Supabase button for offline items */}
                  {!isCloud && (
                    <div className="sync-cloud-prompt">
                      <button
                        type="button"
                        className="sync-cloud-btn font-mono"
                        onClick={handleSyncToCloud}
                        disabled={isSyncingCloud}
                      >
                        <ArrowUpCircle size={12} />
                        {isSyncingCloud ? 'UPLOADING TO SUPABASE...' : 'UPLOAD IMAGE TO SUPABASE CLOUD'}
                      </button>
                      {cloudSyncMsg && (
                        <span className="cloud-msg font-mono">{cloudSyncMsg}</span>
                      )}
                    </div>
                  )}

                  {item.notes && (
                    <div className="specimen-notes-box">
                      <span className="notes-label font-mono">CURATOR’S NOTES</span>
                      <p className="notes-text">{item.notes}</p>
                    </div>
                  )}

                  {/* Collections Management for this Item */}
                  <div className="collections-inclusion-section">
                    <span className="section-label font-mono">
                      <Bookmark size={11} /> PACKS & COLLECTIONS
                    </span>
                    <div className="collections-pill-list">
                      {collections.map((col) => {
                        const inCollection = col.itemIds.includes(item.id);
                        return (
                          <button
                            key={col.id}
                            type="button"
                            className={`collection-toggle-pill ${inCollection ? 'active' : ''}`}
                            onClick={() => onToggleCollection(col.id, item.id)}
                          >
                            <span className="pill-check">{inCollection ? '✓' : '+'}</span>
                            <span className="pill-name">{col.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="detail-action-bar">
                    <button
                      type="button"
                      className="archival-btn-primary match-action-btn"
                      onClick={() => onSendToOutfitBuilder(item)}
                    >
                      <Layers size={13} /> MIX & MATCH
                    </button>

                    <button
                      type="button"
                      className="archival-btn-secondary"
                      onClick={handleStartEdit}
                      title="Edit details"
                    >
                      <Edit3 size={13} /> EDIT
                    </button>

                    <button
                      type="button"
                      className="archival-btn-danger"
                      onClick={() => setIsConfirmingDelete(true)}
                      title="Delete item"
                    >
                      <Trash2 size={13} />
                    </button>

                    <button
                      type="button"
                      className="archival-btn-secondary close-bar-btn"
                      onClick={onClose}
                    >
                      CLOSE
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

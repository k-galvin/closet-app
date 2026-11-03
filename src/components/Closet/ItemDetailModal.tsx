import React, { useState, useRef } from 'react';
import { ClothingCategory, ClothingItem, Collection, Season } from '../../types';
import {
  X,
  Trash2,
  Bookmark,
  Layers,
  Edit3,
  Check,
  Cloud,
  HardDrive,
  ArrowUpCircle,
  Camera,
} from 'lucide-react';
import { isCloudUrl, uploadDataUrlToSupabase, uploadClothingImage } from '../../lib/supabase';
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

const CATEGORIES: { label: string; value: ClothingCategory }[] = [
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'One-Piece', value: 'one-piece' },
];

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

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

  // Form edit states
  const [editedName, setEditedName] = useState('');
  const [editedCategory, setEditedCategory] = useState<ClothingCategory>('tops');
  const [editedSubcategory, setEditedSubcategory] = useState('');
  const [editedDesigner, setEditedDesigner] = useState('');
  const [editedColor, setEditedColor] = useState('');
  const [editedFabric, setEditedFabric] = useState('');
  const [editedSeasons, setEditedSeasons] = useState<Season[]>([]);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');
  const [editedFile, setEditedFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!item) return null;

  const handleStartEdit = () => {
    setEditedName(item.name);
    setEditedCategory(item.category);
    setEditedSubcategory(item.subcategory || '');
    setEditedDesigner(item.designer || '');
    setEditedColor(item.color || '');
    setEditedFabric(item.fabric || '');
    setEditedSeasons(item.seasons ? [...item.seasons] : ['fall', 'winter']);
    setEditedNotes(item.notes || '');
    setEditedImageUrl(item.imageUrl);
    setEditedFile(null);
    setIsEditing(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditedImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleSeason = (season: Season) => {
    if (editedSeasons.includes(season)) {
      setEditedSeasons(editedSeasons.filter((s) => s !== season));
    } else {
      setEditedSeasons([...editedSeasons, season]);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    let finalImageUrl = editedImageUrl;

    // If user selected a new photo file, upload it
    if (editedFile) {
      const result = await uploadClothingImage(editedFile, editedImageUrl);
      if (result.success && result.isCloud) {
        finalImageUrl = result.url;
      }
    }

    const updatedItem: ClothingItem = {
      ...item,
      name: editedName.trim() || item.name,
      category: editedCategory,
      subcategory: editedSubcategory.trim() || undefined,
      designer: editedDesigner.trim() || undefined,
      color: editedColor.trim() || item.color || 'Monochrome',
      fabric: editedFabric.trim() || undefined,
      seasons: editedSeasons.length > 0 ? editedSeasons : item.seasons,
      notes: editedNotes.trim() || undefined,
      imageUrl: finalImageUrl,
      updatedAt: Date.now(),
    };

    onUpdate(updatedItem);
    setIsSaving(false);
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
                  src={isEditing ? editedImageUrl : item.imageUrl}
                  alt={isEditing ? editedName || item.name : item.name}
                  className="specimen-image"
                />

                {isEditing && (
                  <button
                    type="button"
                    className="replace-photo-btn font-mono"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={13} />
                    <span>{editedFile ? 'PHOTO READY TO SAVE' : 'CHANGE PHOTO'}</span>
                  </button>
                )}
              </div>

              {/* Hidden file input for changing the garment photo */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/webp,image/jpeg,image/svg+xml"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </div>

            {/* Information Column */}
            <div className="detail-info-pane">
              <div className="info-header">
                <div className="header-meta-row">
                  <span className="archival-overline text-accent">
                    {isEditing
                      ? `${editedCategory.toUpperCase()} // EDITING RECORD`
                      : `${item.category.toUpperCase()} // REGISTRY RECORD`}
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
                    {/* 1. Garment Name */}
                    <div className="edit-form-group">
                      <label className="edit-label font-mono">GARMENT NAME *</label>
                      <input
                        type="text"
                        className="edit-input title-input"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Garment name"
                        required
                      />
                    </div>

                    {/* 2. Category & Subcategory */}
                    <div className="edit-form-row-dual">
                      <div className="edit-form-group">
                        <label className="edit-label font-mono">CATEGORY *</label>
                        <select
                          className="edit-select font-mono"
                          value={editedCategory}
                          onChange={(e) => setEditedCategory(e.target.value as ClothingCategory)}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="edit-form-group">
                        <label className="edit-label font-mono">SUBCATEGORY</label>
                        <input
                          type="text"
                          className="edit-input font-mono"
                          value={editedSubcategory}
                          onChange={(e) => setEditedSubcategory(e.target.value)}
                          placeholder="e.g. Knitwear, Loafer"
                        />
                      </div>
                    </div>

                    {/* 3. Colorway & Designer */}
                    <div className="edit-form-row-dual">
                      <div className="edit-form-group">
                        <label className="edit-label font-mono">COLORWAY *</label>
                        <input
                          type="text"
                          className="edit-input"
                          value={editedColor}
                          onChange={(e) => setEditedColor(e.target.value)}
                          placeholder="e.g. Charcoal, Chalk White"
                          required
                        />
                      </div>

                      <div className="edit-form-group">
                        <label className="edit-label font-mono">DESIGNER / LABEL</label>
                        <input
                          type="text"
                          className="edit-input"
                          value={editedDesigner}
                          onChange={(e) => setEditedDesigner(e.target.value)}
                          placeholder="e.g. Margaret Howell, Lemaire"
                        />
                      </div>
                    </div>

                    {/* 4. Fabric Composition */}
                    <div className="edit-form-group">
                      <label className="edit-label font-mono">FABRIC COMPOSITION</label>
                      <input
                        type="text"
                        className="edit-input"
                        value={editedFabric}
                        onChange={(e) => setEditedFabric(e.target.value)}
                        placeholder="e.g. 100% Cashmere, Bonded Cotton"
                      />
                    </div>

                    {/* 5. Seasons */}
                    <div className="edit-form-group">
                      <label className="edit-label font-mono">SEASONS</label>
                      <div className="edit-seasons-row">
                        {SEASONS.map((s) => {
                          const isSelected = editedSeasons.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              className={`season-toggle-chip font-mono ${isSelected ? 'active' : ''}`}
                              onClick={() => toggleSeason(s)}
                            >
                              {s.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 6. Curatorial Notes */}
                    <div className="edit-form-group">
                      <label className="edit-label font-mono">CURATOR’S NOTES</label>
                      <textarea
                        className="edit-textarea"
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Curatorial notes, provenance, fit details..."
                        rows={3}
                      />
                    </div>

                    {/* 7. Save / Cancel Actions */}
                    <div className="edit-actions">
                      <button
                        type="button"
                        className="archival-btn-primary"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                      >
                        <Check size={12} /> {isSaving ? 'SAVING CHANGES...' : 'SAVE CHANGES'}
                      </button>
                      <button
                        type="button"
                        className="archival-btn-secondary"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
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
                      <span className="spec-label">CATEGORY</span>
                      <span className="spec-value">
                        {item.category.toUpperCase()}
                        {item.subcategory ? ` // ${item.subcategory}` : ''}
                      </span>
                    </div>

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
                        {item.seasons && item.seasons.length > 0
                          ? item.seasons.join(' · ')
                          : 'All Seasons'}
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

import React, { useState, useRef } from 'react';
import { ClothingCategory, ClothingItem, Season } from '../../types';
import { Upload, X, Check, Cloud, HardDrive } from 'lucide-react';
import { uploadClothingImage, getSupabaseConfig } from '../../lib/supabase';
import './AcquireModal.scss';

interface AcquireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcquire: (item: ClothingItem) => void;
  nextCatalogNumber: string;
}

const CATEGORIES: { label: string; value: ClothingCategory }[] = [
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
];

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

export const AcquireModal: React.FC<AcquireModalProps> = ({
  isOpen,
  onClose,
  onAcquire,
  nextCatalogNumber,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('tops');
  const [subcategory, setSubcategory] = useState('');
  const [designer, setDesigner] = useState('');
  const [color, setColor] = useState('');
  const [fabric, setFabric] = useState('');
  const [seasons, setSeasons] = useState<Season[]>(['fall', 'winter']);
  const [notes, setNotes] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isConfigured } = getSupabaseConfig();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageDataUrl(event.target?.result as string);
      setUploadStatus('');
    };
    reader.readAsDataURL(file);
  };

  const toggleSeason = (season: Season) => {
    if (seasons.includes(season)) {
      setSeasons(seasons.filter((s) => s !== season));
    } else {
      setSeasons([...seasons, season]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageDataUrl) return;

    setIsUploading(true);

    let finalImageUrl = imageDataUrl;

    if (selectedFile) {
      setUploadStatus('Uploading to Supabase Storage...');
      const result = await uploadClothingImage(selectedFile, imageDataUrl);
      if (result.success && result.isCloud) {
        finalImageUrl = result.url;
        setUploadStatus('✓ Uploaded to Supabase Cloud Storage');
      } else {
        setUploadStatus('Saved locally to device storage (Supabase bucket pending)');
      }
    }

    const newItem: ClothingItem = {
      id: `item-${Date.now()}`,
      name: name.trim(),
      category,
      subcategory: subcategory.trim() || undefined,
      designer: designer.trim() || undefined,
      color: color.trim() || 'Monochrome',
      fabric: fabric.trim() || undefined,
      seasons: seasons.length > 0 ? seasons : ['fall', 'winter'],
      notes: notes.trim() || undefined,
      imageUrl: finalImageUrl,
      catalogNumber: nextCatalogNumber,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onAcquire(newItem);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="archival-modal-overlay" onClick={onClose}>
      <div
        className="archival-modal acquire-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="close-modal-btn"
          onClick={onClose}
          aria-label="Close acquisition modal"
        >
          <X size={20} />
        </button>

        <span className="archival-overline text-accent">
          ACQUISITION PROTOCOL // {nextCatalogNumber}
        </span>
        <h2 className="modal-title">Register Garment</h2>
        <p className="modal-subtitle">
          Upload transparent cutout photograph and document garment provenance.
        </p>

        <form onSubmit={handleSubmit} className="acquire-form">
          <div className="acquire-grid">
            {/* Left: Transparent Image Uploader Area */}
            <div className="upload-plate-pane">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/webp,image/jpeg,image/svg+xml"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div
                className={`image-upload-box ${imageDataUrl ? 'has-image' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageDataUrl ? (
                  <div className="preview-container">
                    <img
                      src={imageDataUrl}
                      alt="Garment Preview"
                      className="preview-img"
                    />
                    <div className="change-overlay font-mono">
                      <span>TAP TO REPLACE PHOTO</span>
                    </div>
                  </div>
                ) : (
                  <div className="empty-upload-prompt">
                    <Upload size={28} className="upload-icon" />
                    <span className="prompt-title font-mono">SELECT CLOTHING PHOTO</span>
                    <span className="prompt-sub font-mono">
                      TRANSPARENT PNG RECOMMENDED
                    </span>
                  </div>
                )}
              </div>

              <div className="catalog-badge-display font-mono">
                <span className="label">ASSIGNED CODE:</span>
                <span className="value text-accent">{nextCatalogNumber}</span>
              </div>

              <div className="storage-target-badge font-mono">
                {isConfigured ? (
                  <span className="cloud-target">
                    <Cloud size={11} /> TARGET: SUPABASE CLOUD
                  </span>
                ) : (
                  <span className="local-target">
                    <HardDrive size={11} /> TARGET: LOCAL STORAGE
                  </span>
                )}
              </div>

              {uploadStatus && (
                <div className="upload-status-hint font-mono">{uploadStatus}</div>
              )}
            </div>

            {/* Right: Metadata fields */}
            <div className="metadata-pane">
              <div className="form-group">
                <label className="field-label font-mono">GARMENT NAME *</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Double-Breasted Wool Blazer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-dual">
                <div className="form-group">
                  <label className="field-label font-mono">CATEGORY *</label>
                  <select
                    className="field-select font-mono"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ClothingCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label font-mono">SUBCATEGORY</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. Knitwear, Loafer"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-dual">
                <div className="form-group">
                  <label className="field-label font-mono">DESIGNER / LABEL</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. Margaret Howell, Lemaire"
                    value={designer}
                    onChange={(e) => setDesigner(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="field-label font-mono">COLORWAY</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. Chalk White, Navy"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="field-label font-mono">FABRIC COMPOSITION</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. 100% Cashmere, Cotton Poplin"
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                />
              </div>

              {/* Seasons Selector */}
              <div className="form-group">
                <label className="field-label font-mono">SUITABLE SEASONS</label>
                <div className="seasons-pill-row">
                  {SEASONS.map((s) => {
                    const active = seasons.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`season-pill font-mono ${active ? 'active' : ''}`}
                        onClick={() => toggleSeason(s)}
                      >
                        {s.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="field-label font-mono">CURATOR’S NOTES</label>
                <textarea
                  className="field-textarea"
                  placeholder="Fit details, silhouettes, provenance..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="acquire-footer-actions">
            <button
              type="button"
              className="archival-btn-secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="archival-btn-primary"
              disabled={!name.trim() || !imageDataUrl || isUploading}
            >
              {isUploading ? (
                'CATALOGING...'
              ) : (
                <>
                  <Check size={13} /> REGISTER IN ARCHIVE
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

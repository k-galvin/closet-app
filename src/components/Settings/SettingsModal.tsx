import React, { useState } from 'react';
import { X, Check, Database, Smartphone, RotateCcw, Download, UploadCloud } from 'lucide-react';
import { getSupabaseConfig, setSupabaseConfig } from '../../lib/supabase';
import './SettingsModal.scss';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSeedData: () => void;
  onExportData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetSeedData,
  onExportData,
}) => {
  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentConfig.anonKey);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="archival-modal-overlay" onClick={onClose}>
      <div
        className="archival-modal settings-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="close-modal-btn"
          onClick={onClose}
          aria-label="Close configuration"
        >
          <X size={20} />
        </button>

        <span className="archival-overline text-accent">SYSTEM CONFIGURATION // ARCHIVAL</span>
        <h2 className="modal-title">Settings & Sync</h2>
        <p className="modal-subtitle">
          Configure remote Supabase cloud storage, backup data, or review iPhone installation.
        </p>

        <div className="settings-sections-list">
          {/* iOS Installation Instructions */}
          <section className="settings-block">
            <div className="block-title font-mono">
              <Smartphone size={13} /> IPHONE HOMESCREEN APP
            </div>
            <div className="ios-instructions-box">
              <p>
                To install as a dedicated fullscreen app on your iPhone without Safari UI:
              </p>
              <ol className="ios-steps font-mono">
                <li>1. Open this URL in Safari on your iPhone</li>
                <li>2. Tap the <strong>Share</strong> button (box with upward arrow)</li>
                <li>3. Select <strong>"Add to Home Screen"</strong></li>
                <li>4. Tap <strong>"Add"</strong> in the top-right corner</li>
              </ol>
            </div>
          </section>

          {/* Supabase Integration */}
          <section className="settings-block">
            <div className="block-title font-mono">
              <Database size={13} /> SUPABASE SYNC (OPTIONAL)
            </div>
            <p className="block-desc">
              Connect to your Supabase project (same backend as your Archival project) for multi-device sync and cloud image hosting. By default, everything works completely offline in your browser's IndexedDB.
            </p>

            <form onSubmit={handleSaveSupabase} className="supabase-form">
              <div className="form-group">
                <label className="field-label font-mono">SUPABASE PROJECT URL</label>
                <input
                  type="text"
                  className="field-input font-mono"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="field-label font-mono">SUPABASE ANON PUBLIC KEY</label>
                <input
                  type="password"
                  className="field-input font-mono"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                />
              </div>

              <div className="supabase-actions-row">
                <div className="connection-status font-mono">
                  STATUS: {currentConfig.isConfigured ? (
                    <span className="text-accent font-bold">CONNECTED TO CLOUD</span>
                  ) : (
                    <span className="text-muted">LOCAL OFFLINE STORAGE</span>
                  )}
                </div>

                <button type="submit" className="archival-btn-primary">
                  {saveSuccess ? (
                    <>
                      <Check size={12} /> SAVED
                    </>
                  ) : (
                    'SAVE CREDENTIALS'
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Data Maintenance */}
          <section className="settings-block">
            <div className="block-title font-mono">
              <UploadCloud size={13} /> DATA & BACKUP
            </div>
            <div className="data-actions-grid">
              <button
                type="button"
                className="archival-btn-secondary"
                onClick={onExportData}
              >
                <Download size={13} /> EXPORT BACKUP JSON
              </button>

              <button
                type="button"
                className="archival-btn-secondary"
                onClick={() => {
                  if (window.confirm('Reset catalog to sample items? Your custom additions will be cleared.')) {
                    onResetSeedData();
                    onClose();
                  }
                }}
              >
                <RotateCcw size={13} /> RESET SAMPLE WARDROBE
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

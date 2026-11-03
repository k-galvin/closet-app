import React, { useState } from 'react';
import {
  X,
  Check,
  Database,
  Smartphone,
  RotateCcw,
  Download,
  UploadCloud,
  Cloud,
  HardDrive,
  Copy,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { ClothingItem } from '../../types';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  testSupabaseHealth,
  SupabaseHealth,
  SQL_STORAGE_SETUP,
  SQL_TABLE_SETUP,
  isCloudUrl,
  uploadDataUrlToSupabase,
  syncClothingItemToSupabase,
} from '../../lib/supabase';
import { saveItem } from '../../lib/db';
import './SettingsModal.scss';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ClothingItem[];
  onRefreshData: () => Promise<void>;
  onResetSeedData: () => void;
  onExportData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  items,
  onRefreshData,
  onResetSeedData,
  onExportData,
}) => {
  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentConfig.anonKey);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Diagnostic state
  const [healthStatus, setHealthStatus] = useState<SupabaseHealth | null>(null);
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Batch sync state
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestHealth = async () => {
    setIsTestingHealth(true);
    setHealthStatus(null);
    try {
      const health = await testSupabaseHealth();
      setHealthStatus(health);
    } catch (err) {
      setHealthStatus({
        connected: false,
        projectUrl: supabaseUrl,
        bucketExists: false,
        bucketName: 'closet-images',
        canUpload: false,
        error: String(err),
      });
    } finally {
      setIsTestingHealth(false);
    }
  };

  const handleCopySql = () => {
    const fullSql = `${SQL_STORAGE_SETUP}\n\n${SQL_TABLE_SETUP}`;
    navigator.clipboard.writeText(fullSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSyncAllLocalItems = async () => {
    if (items.length === 0) {
      setSyncProgress('No items in closet to sync.');
      return;
    }

    setIsBatchSyncing(true);
    let successCount = 0;
    let lastError: string | undefined;

    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      setSyncProgress(`Syncing garment ${i + 1} of ${items.length}: ${item.name}...`);

      // If image is a local data URI, upload image to Supabase Storage first
      if (!isCloudUrl(item.imageUrl) && item.imageUrl.startsWith('data:')) {
        const result = await uploadDataUrlToSupabase(item.imageUrl, item.catalogNumber);
        if (result.success && result.isCloud) {
          item = {
            ...item,
            imageUrl: result.url,
            updatedAt: Date.now(),
          };
        } else {
          lastError = result.error;
        }
      }

      // Save locally and push row to Supabase closet_items table
      await saveItem(item);
      const tableSynced = await syncClothingItemToSupabase(item);
      if (tableSynced || isCloudUrl(item.imageUrl)) {
        successCount++;
      }
    }

    await onRefreshData();
    setIsBatchSyncing(false);
    setSyncProgress(
      `✓ Successfully synced ${successCount} of ${items.length} garments to Supabase!${
        lastError ? ` (${lastError})` : ''
      }`
    );
  };

  const cloudItemsCount = items.filter((item) => isCloudUrl(item.imageUrl)).length;
  const localItemsCount = items.length - cloudItemsCount;

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
        <h2 className="modal-title">Settings & Cloud Sync</h2>
        <p className="modal-subtitle">
          Manage Supabase storage, test cloud sync health, backup inventory, or review iPhone installation.
        </p>

        <div className="settings-sections-list">
          {/* Storage Status & Metrics Breakdown */}
          <section className="settings-block">
            <div className="block-title font-mono">
              <Database size={13} /> CLOUD STORAGE AUDIT
            </div>
            <div className="storage-audit-card font-mono">
              <div className="audit-metric">
                <span className="metric-label">TOTAL CATALOG</span>
                <span className="metric-num">{items.length}</span>
              </div>
              <div className="audit-metric">
                <span className="metric-label">
                  <Cloud size={11} className="text-accent" /> SUPABASE CLOUD
                </span>
                <span className="metric-num text-accent">{cloudItemsCount}</span>
              </div>
              <div className="audit-metric">
                <span className="metric-label">
                  <HardDrive size={11} /> LOCAL STORAGE
                </span>
                <span className="metric-num">{localItemsCount}</span>
              </div>
            </div>

            <div className="sync-all-action">
              <button
                type="button"
                className="archival-btn-secondary sync-all-btn font-mono"
                onClick={handleSyncAllLocalItems}
                disabled={isBatchSyncing}
              >
                <UploadCloud size={12} />
                {isBatchSyncing ? 'SYNCING TO SUPABASE...' : 'SYNC ALL ITEMS & PHOTOS TO SUPABASE'}
              </button>
              {syncProgress && (
                <span className="sync-progress-msg font-mono">{syncProgress}</span>
              )}
            </div>
          </section>

          {/* Supabase Integration & Credentials */}
          <section className="settings-block">
            <div className="block-title font-mono">
              <Database size={13} /> SUPABASE CONNECTION
            </div>
            <p className="block-desc">
              Your garments and photos connect to Supabase project{' '}
              <code className="font-mono text-accent">oaqzbymmhusbhvscfcrp</code>.
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
                <button
                  type="button"
                  className="archival-btn-secondary"
                  onClick={handleTestHealth}
                  disabled={isTestingHealth}
                >
                  <Activity size={12} /> {isTestingHealth ? 'TESTING...' : 'TEST CLOUD STORAGE'}
                </button>

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

            {/* Health Test Result Card */}
            {healthStatus && (
              <div className={`health-result-box ${healthStatus.canUpload ? 'success' : 'warning'}`}>
                <div className="result-header font-mono">
                  {healthStatus.canUpload ? (
                    <>
                      <Check size={14} className="text-accent" />
                      <span>SUPABASE STORAGE: VERIFIED & OPERATIONAL</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} color="#d9381e" />
                      <span>STORAGE SETUP REQUIRED</span>
                    </>
                  )}
                </div>

                <div className="result-details font-mono">
                  <p>Target Bucket: <strong>{healthStatus.bucketName}</strong></p>
                  <p>Bucket Exists: {healthStatus.bucketExists ? '✓ YES' : '✗ NO'}</p>
                  <p>Write Permissions: {healthStatus.canUpload ? '✓ PUBLIC UPLOAD OK' : '✗ BLOCKED'}</p>
                  {healthStatus.error && (
                    <p className="error-note">Diagnostic: {healthStatus.error}</p>
                  )}
                </div>

                {!healthStatus.canUpload && (
                  <div className="sql-action-card">
                    <p className="sql-hint">
                      Run this in Supabase <strong>SQL Editor</strong> to enable the public storage bucket:
                    </p>
                    <button
                      type="button"
                      className="archival-btn-secondary copy-sql-btn"
                      onClick={handleCopySql}
                    >
                      <Copy size={12} /> {copiedSql ? 'COPIED TO CLIPBOARD!' : 'COPY SUPABASE SQL SCRIPT'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

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
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                      for (const reg of registrations) reg.unregister();
                      window.location.reload();
                    });
                  } else {
                    window.location.reload();
                  }
                }}
              >
                <RotateCcw size={13} /> RELOAD & UPDATE PWA
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

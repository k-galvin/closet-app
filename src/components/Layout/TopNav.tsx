import React from 'react';
import { ViewTab } from '../../types';
import { Plus, SlidersHorizontal } from 'lucide-react';
import './TopNav.scss';

interface TopNavProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenAcquire: () => void;
  onOpenSettings: () => void;
  totalItems: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAcquire,
  onOpenSettings,
  totalItems,
}) => {
  return (
    <header className="archival-top-nav">
      <div className="nav-left">
        <div className="mobile-brand-mark">
          <div className="accent-dot" />
          <span className="brand-name">ARCHIVAL</span>
          <span className="brand-sub">WARDROBE</span>
        </div>

        <nav className="desktop-nav-tabs">
          <button
            type="button"
            className={`desktop-tab ${activeTab === 'closet' ? 'active' : ''}`}
            onClick={() => onTabChange('closet')}
          >
            inventory
            <div className="tab-underline" />
          </button>
          <button
            type="button"
            className={`desktop-tab ${activeTab === 'outfits' ? 'active' : ''}`}
            onClick={() => onTabChange('outfits')}
          >
            mix & match
            <div className="tab-underline" />
          </button>
          <button
            type="button"
            className={`desktop-tab ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => onTabChange('collections')}
          >
            collections
            <div className="tab-underline" />
          </button>
        </nav>
      </div>

      <div className="nav-right">
        <div className="inventory-badge font-mono">
          <span className="badge-bullet">•</span>
          {String(totalItems).padStart(2, '0')} RECORDS
        </div>

        <button
          type="button"
          className="desktop-acquire-btn"
          onClick={onOpenAcquire}
          title="Acquire New Item"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>REGISTER ITEM</span>
        </button>

        <button
          type="button"
          className="desktop-icon-btn"
          onClick={onOpenSettings}
          title="Configuration & Sync"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>
    </header>
  );
};

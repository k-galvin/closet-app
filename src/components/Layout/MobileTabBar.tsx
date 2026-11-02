import React from 'react';
import { ViewTab } from '../../types';
import { Grid, Layers, Bookmark, Plus, SlidersHorizontal } from 'lucide-react';
import './MobileTabBar.scss';

interface MobileTabBarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenAcquire: () => void;
  onOpenSettings: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  onOpenAcquire,
  onOpenSettings,
}) => {
  return (
    <nav className="mobile-tab-bar" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`tab-item ${activeTab === 'closet' ? 'active' : ''}`}
        onClick={() => onTabChange('closet')}
        aria-label="Closet Inventory"
      >
        <Grid size={18} strokeWidth={activeTab === 'closet' ? 2.2 : 1.5} />
        <span className="tab-label">Closet</span>
        {activeTab === 'closet' && <div className="active-dot" />}
      </button>

      <button
        type="button"
        className={`tab-item ${activeTab === 'outfits' ? 'active' : ''}`}
        onClick={() => onTabChange('outfits')}
        aria-label="Outfit Builder"
      >
        <Layers size={18} strokeWidth={activeTab === 'outfits' ? 2.2 : 1.5} />
        <span className="tab-label">Outfits</span>
        {activeTab === 'outfits' && <div className="active-dot" />}
      </button>

      <button
        type="button"
        className="acquire-center-btn"
        onClick={onOpenAcquire}
        aria-label="Acquire New Clothing Item"
      >
        <div className="btn-inner">
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
        </div>
      </button>

      <button
        type="button"
        className={`tab-item ${activeTab === 'collections' ? 'active' : ''}`}
        onClick={() => onTabChange('collections')}
        aria-label="Collections and Packing"
      >
        <Bookmark size={18} strokeWidth={activeTab === 'collections' ? 2.2 : 1.5} />
        <span className="tab-label">Packs</span>
        {activeTab === 'collections' && <div className="active-dot" />}
      </button>

      <button
        type="button"
        className="tab-item"
        onClick={onOpenSettings}
        aria-label="System Settings"
      >
        <SlidersHorizontal size={18} strokeWidth={1.5} />
        <span className="tab-label">Config</span>
      </button>
    </nav>
  );
};

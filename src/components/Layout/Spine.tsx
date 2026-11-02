import React from 'react';
import './Spine.scss';

interface SpineProps {
  activeTab: string;
}

export const Spine: React.FC<SpineProps> = ({ activeTab }) => {
  return (
    <aside className="archival-spine" aria-label="Magazine Spine Navigation">
      <div className="spine-texture-primary" />
      <div className="spine-texture-secondary" />

      <div className="spine-top">
        <div className="accent-dot" />
        <h1 className="spine-logo">ARCHIVAL</h1>
        <span className="archival-overline text-accent spine-sub">WARDROBE</span>
      </div>

      <div className="spine-center">
        <span className="spine-edition">VOL. 01 // PERSONAL INVENTORY</span>
      </div>

      <div className="spine-bottom">
        <span className="spine-current-view">
          {activeTab.toUpperCase()}
        </span>
        <span className="spine-catalog-code">ARC-26</span>
      </div>
    </aside>
  );
};

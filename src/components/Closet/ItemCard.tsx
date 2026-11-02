import React from 'react';
import { ClothingItem } from '../../types';
import './ItemCard.scss';

interface ItemCardProps {
  item: ClothingItem;
  onClick: (item: ClothingItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  return (
    <article className="archival-item-card" onClick={() => onClick(item)}>
      <div className="card-plate">
        <div className="plate-badge font-mono">{item.catalogNumber}</div>
        <div className="image-container">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="garment-cutout"
            loading="lazy"
          />
        </div>
        <div className="plate-overlay" />
      </div>

      <div className="card-metadata">
        <div className="meta-top">
          <h3 className="item-title">{item.name}</h3>
          <span className="item-category font-mono">{item.category}</span>
        </div>

        {item.designer && (
          <p className="item-designer font-editorial">{item.designer}</p>
        )}

        <div className="meta-bottom font-mono">
          <span className="item-color">{item.color}</span>
          {item.fabric && <span className="item-fabric">• {item.fabric}</span>}
        </div>
      </div>
    </article>
  );
};

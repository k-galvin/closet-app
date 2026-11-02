import React, { useState, useMemo } from 'react';
import { ClothingCategory, ClothingItem, Collection, Season } from '../../types';
import { ItemCard } from './ItemCard';
import { Search, Sliders, X, Sparkles } from 'lucide-react';
import './ClosetView.scss';

interface ClosetViewProps {
  items: ClothingItem[];
  collections: Collection[];
  onSelectItem: (item: ClothingItem) => void;
  onOpenAcquire: () => void;
}

const CATEGORIES: { label: string; value: ClothingCategory | 'all' }[] = [
  { label: 'All Items', value: 'all' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'One-Piece', value: 'one-piece' },
];

const SEASONS: { label: string; value: Season }[] = [
  { label: 'Spring', value: 'spring' },
  { label: 'Summer', value: 'summer' },
  { label: 'Fall', value: 'fall' },
  { label: 'Winter', value: 'winter' },
];

export const ClosetView: React.FC<ClosetViewProps> = ({
  items,
  collections: _collections,
  onSelectItem,
  onOpenAcquire,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all');
  const [selectedSeason, setSelectedSeason] = useState<Season | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'designer' | 'category'>('newest');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Filter & Sort Pipeline
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesigner = item.designer?.toLowerCase().includes(q);
          const matchFabric = item.fabric?.toLowerCase().includes(q);
          const matchColor = item.color.toLowerCase().includes(q);
          const matchCode = item.catalogNumber.toLowerCase().includes(q);
          if (!matchName && !matchDesigner && !matchFabric && !matchColor && !matchCode) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Season filter
        if (selectedSeason !== 'all' && !item.seasons.includes(selectedSeason)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        if (sortBy === 'designer') return (a.designer || '').localeCompare(b.designer || '');
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
      });
  }, [items, searchQuery, selectedCategory, selectedSeason, sortBy]);

  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedSeason !== 'all' ? 1 : 0);

  return (
    <div className="closet-view-container">
      {/* Editorial View Header */}
      <section className="closet-header">
        <div className="header-meta">
          <span className="archival-overline text-accent">CURATED ARCHIVE // SPECIMEN INDEX</span>
          <div className="title-row">
            <h1 className="view-title">Closet</h1>
            <span className="record-count font-mono">
              [ {String(filteredItems.length).padStart(2, '0')} / {String(items.length).padStart(2, '0')} EXHIBITED ]
            </span>
          </div>
        </div>

        <div className="header-controls">
          <div className="search-bar-wrapper">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="gallery-search font-mono"
              placeholder="SEARCH NAME, DESIGNER, CODE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`filter-drawer-toggle font-mono ${showFilterDrawer || activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          >
            <Sliders size={12} />
            <span>FILTER {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>
        </div>
      </section>

      {/* Collapsible Filter Drawer */}
      {showFilterDrawer && (
        <section className="filter-drawer-pane">
          <div className="drawer-grid">
            <div className="filter-group">
              <span className="group-label font-mono">CATEGORY</span>
              <div className="options-row">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`filter-btn ${selectedCategory === cat.value ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="group-label font-mono">SEASON</span>
              <div className="options-row">
                <button
                  type="button"
                  className={`filter-btn ${selectedSeason === 'all' ? 'selected' : ''}`}
                  onClick={() => setSelectedSeason('all')}
                >
                  All Seasons
                </button>
                {SEASONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`filter-btn ${selectedSeason === s.value ? 'selected' : ''}`}
                    onClick={() => setSelectedSeason(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="group-label font-mono">ORDERING</span>
              <div className="options-row">
                <button
                  type="button"
                  className={`filter-btn ${sortBy === 'newest' ? 'selected' : ''}`}
                  onClick={() => setSortBy('newest')}
                >
                  Recent First
                </button>
                <button
                  type="button"
                  className={`filter-btn ${sortBy === 'designer' ? 'selected' : ''}`}
                  onClick={() => setSortBy('designer')}
                >
                  Designer (A–Z)
                </button>
                <button
                  type="button"
                  className={`filter-btn ${sortBy === 'category' ? 'selected' : ''}`}
                  onClick={() => setSortBy('category')}
                >
                  Category
                </button>
              </div>
            </div>
          </div>

          {(activeFilterCount > 0 || searchQuery) && (
            <div className="drawer-reset-row">
              <button
                type="button"
                className="reset-filters-btn font-mono"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSeason('all');
                  setSearchQuery('');
                }}
              >
                RESET ALL FILTERS
              </button>
            </div>
          )}
        </section>
      )}

      {/* Horizontal Category Pill Bar (quick filter for mobile iPhone) */}
      <nav className="mobile-quick-categories hide-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            className={`quick-cat-chip ${selectedCategory === cat.value ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* Garments Grid */}
      {filteredItems.length > 0 ? (
        <section className="garments-grid">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onClick={onSelectItem} />
          ))}
        </section>
      ) : (
        <div className="empty-inventory-state">
          <Sparkles size={24} color="#0047ab" strokeWidth={1.5} />
          <h2 className="empty-title">No garments match current criteria</h2>
          <p className="empty-desc">
            {items.length === 0
              ? 'Your wardrobe archive is currently vacant. Begin by registering clothing items.'
              : 'Try clearing your search query or adjusting your category/season filters.'}
          </p>
          {items.length === 0 && (
            <button
              type="button"
              className="archival-btn-primary"
              onClick={onOpenAcquire}
            >
              REGISTER FIRST GARMENT
            </button>
          )}
        </div>
      )}
    </div>
  );
};

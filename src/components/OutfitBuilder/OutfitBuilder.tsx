import React, { useState, useMemo, useEffect } from 'react';
import { ClothingItem, Outfit, OutfitSlotAssignment } from '../../types';
import { Sparkles, Save, RotateCcw, ChevronLeft, ChevronRight, Check, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import './OutfitBuilder.scss';

interface OutfitBuilderProps {
  items: ClothingItem[];
  outfits: Outfit[];
  initialSlotItem?: ClothingItem | null;
  onSaveOutfit: (outfit: Outfit) => void;
  onDeleteOutfit: (id: string) => void;
}

export const OutfitBuilder: React.FC<OutfitBuilderProps> = ({
  items,
  outfits,
  initialSlotItem,
  onSaveOutfit,
  onDeleteOutfit,
}) => {
  const [activeSubView, setActiveSubView] = useState<'builder' | 'lookbook'>('builder');

  // Categorized items
  const outerwearItems = useMemo(() => items.filter((i) => i.category === 'outerwear'), [items]);
  const topItems = useMemo(() => items.filter((i) => i.category === 'tops' || i.category === 'one-piece'), [items]);
  const bottomItems = useMemo(() => items.filter((i) => i.category === 'bottoms'), [items]);
  const shoeItems = useMemo(() => items.filter((i) => i.category === 'shoes'), [items]);
  const accessoryItems = useMemo(() => items.filter((i) => i.category === 'accessories'), [items]);

  // Current slot selections (use 'none' to explicitly represent no selection)
  const [selectedOuterwearId, setSelectedOuterwearId] = useState<string | null>(null);
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null);
  const [selectedShoeId, setSelectedShoeId] = useState<string | null>(null);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null);

  // Sync / initialize slots whenever items change or initialSlotItem is provided
  useEffect(() => {
    if (initialSlotItem) {
      if (initialSlotItem.category === 'outerwear') setSelectedOuterwearId(initialSlotItem.id);
      if (initialSlotItem.category === 'tops' || initialSlotItem.category === 'one-piece') setSelectedTopId(initialSlotItem.id);
      if (initialSlotItem.category === 'bottoms') setSelectedBottomId(initialSlotItem.id);
      if (initialSlotItem.category === 'shoes') setSelectedShoeId(initialSlotItem.id);
      if (initialSlotItem.category === 'accessories') setSelectedAccessoryId(initialSlotItem.id);
    }
  }, [initialSlotItem]);

  // Ensure default selections if items are available and nothing is selected yet
  useEffect(() => {
    if (items.length > 0) {
      setSelectedOuterwearId((prev) => (prev === null && outerwearItems.length > 0 ? outerwearItems[0].id : prev));
      setSelectedTopId((prev) => (prev === null && topItems.length > 0 ? topItems[0].id : prev));
      setSelectedBottomId((prev) => (prev === null && bottomItems.length > 0 ? bottomItems[0].id : prev));
      setSelectedShoeId((prev) => (prev === null && shoeItems.length > 0 ? shoeItems[0].id : prev));
      setSelectedAccessoryId((prev) => (prev === null && accessoryItems.length > 0 ? accessoryItems[0].id : prev));
    }
  }, [items, outerwearItems, topItems, bottomItems, shoeItems, accessoryItems]);

  // Save Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [outfitTitle, setOutfitTitle] = useState('');
  const [outfitOccasion, setOutfitOccasion] = useState('Daily Rotation');
  const [outfitNotes, setOutfitNotes] = useState('');

  // Effective IDs with fallback to first item in category if not explicitly set to 'none'
  const effectiveOuterwearId = selectedOuterwearId === 'none' ? undefined : (selectedOuterwearId || outerwearItems[0]?.id);
  const effectiveTopId = selectedTopId === 'none' ? undefined : (selectedTopId || topItems[0]?.id);
  const effectiveBottomId = selectedBottomId === 'none' ? undefined : (selectedBottomId || bottomItems[0]?.id);
  const effectiveShoeId = selectedShoeId === 'none' ? undefined : (selectedShoeId || shoeItems[0]?.id);
  const effectiveAccessoryId = selectedAccessoryId === 'none' ? undefined : (selectedAccessoryId || accessoryItems[0]?.id);

  // Selected item objects for display
  const currentOuterwear = items.find((i) => i.id === effectiveOuterwearId);
  const currentTop = items.find((i) => i.id === effectiveTopId);
  const currentBottom = items.find((i) => i.id === effectiveBottomId);
  const currentShoe = items.find((i) => i.id === effectiveShoeId);
  const currentAccessory = items.find((i) => i.id === effectiveAccessoryId);

  // Randomize / Shuffle Generator
  const handleRandomize = () => {
    if (topItems.length) {
      setSelectedTopId(topItems[Math.floor(Math.random() * topItems.length)].id);
    }
    if (bottomItems.length) {
      setSelectedBottomId(bottomItems[Math.floor(Math.random() * bottomItems.length)].id);
    }
    if (shoeItems.length) {
      setSelectedShoeId(shoeItems[Math.floor(Math.random() * shoeItems.length)].id);
    }
    if (outerwearItems.length) {
      if (Math.random() > 0.35) {
        setSelectedOuterwearId(outerwearItems[Math.floor(Math.random() * outerwearItems.length)].id);
      } else {
        setSelectedOuterwearId('none');
      }
    }
    if (accessoryItems.length) {
      if (Math.random() > 0.35) {
        setSelectedAccessoryId(accessoryItems[Math.floor(Math.random() * accessoryItems.length)].id);
      } else {
        setSelectedAccessoryId('none');
      }
    }
  };

  // Clear / Reset
  const handleReset = () => {
    setSelectedOuterwearId(outerwearItems[0]?.id || 'none');
    setSelectedTopId(topItems[0]?.id || null);
    setSelectedBottomId(bottomItems[0]?.id || null);
    setSelectedShoeId(shoeItems[0]?.id || null);
    setSelectedAccessoryId(accessoryItems[0]?.id || 'none');
  };

  // Helper for cycle prev/next
  const cycleItem = (
    list: ClothingItem[],
    currentId: string | undefined,
    setter: (id: string | null) => void,
    direction: 1 | -1,
    allowNone: boolean
  ) => {
    if (list.length === 0) return;
    const currentIndex = currentId ? list.findIndex((i) => i.id === currentId) : -1;
    let nextIndex = currentIndex + direction;

    if (allowNone) {
      if (nextIndex < -1) nextIndex = list.length - 1;
      if (nextIndex >= list.length) nextIndex = -1;
      setter(nextIndex === -1 ? 'none' : list[nextIndex].id);
    } else {
      if (nextIndex < 0) nextIndex = list.length - 1;
      if (nextIndex >= list.length) nextIndex = 0;
      setter(list[nextIndex].id);
    }
  };

  const handleConfirmSave = () => {
    if (!outfitTitle.trim()) return;

    const slots: OutfitSlotAssignment = {
      outerwearId: effectiveOuterwearId,
      topId: effectiveTopId,
      bottomId: effectiveBottomId,
      shoesId: effectiveShoeId,
      accessoryId: effectiveAccessoryId,
    };

    const newOutfit: Outfit = {
      id: `outfit-${Date.now()}`,
      title: outfitTitle.trim(),
      occasion: outfitOccasion.trim() || undefined,
      notes: outfitNotes.trim() || undefined,
      slots,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSaveOutfit(newOutfit);
    setShowSaveModal(false);
    setOutfitTitle('');
    setOutfitNotes('');

    try {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#0047ab', '#1a1a1a', '#cfc2b0'],
      });
    } catch {
      // ignore
    }
  };

  const loadOutfitToBuilder = (outfit: Outfit) => {
    setSelectedOuterwearId(outfit.slots.outerwearId || 'none');
    setSelectedTopId(outfit.slots.topId || null);
    setSelectedBottomId(outfit.slots.bottomId || null);
    setSelectedShoeId(outfit.slots.shoesId || null);
    setSelectedAccessoryId(outfit.slots.accessoryId || 'none');
    setActiveSubView('builder');
  };

  return (
    <div className="outfit-builder-container">
      {/* Header with Sub-View Switcher */}
      <section className="builder-header">
        <div className="header-meta">
          <span className="archival-overline text-accent">CURATORIAL ENGINE // COMPOSITE SYSTEM</span>
          <div className="title-row">
            <h1 className="view-title">Mix & Match</h1>
            <div className="sub-view-tabs font-mono">
              <button
                type="button"
                className={`sub-tab ${activeSubView === 'builder' ? 'active' : ''}`}
                onClick={() => setActiveSubView('builder')}
              >
                STUDIO BUILDER
              </button>
              <button
                type="button"
                className={`sub-tab ${activeSubView === 'lookbook' ? 'active' : ''}`}
                onClick={() => setActiveSubView('lookbook')}
              >
                SAVED LOOKBOOK ({outfits.length})
              </button>
            </div>
          </div>
        </div>

        {activeSubView === 'builder' && (
          <div className="builder-actions-top">
            <button
              type="button"
              className="archival-btn-secondary icon-btn font-mono"
              onClick={handleRandomize}
              title="Serendipity Shuffle"
            >
              <Sparkles size={13} /> SHUFFLE
            </button>
            <button
              type="button"
              className="archival-btn-secondary icon-btn font-mono"
              onClick={handleReset}
              title="Reset slots"
            >
              <RotateCcw size={13} /> RESET
            </button>
            <button
              type="button"
              className="archival-btn-primary save-btn"
              onClick={() => setShowSaveModal(true)}
            >
              <Save size={13} /> SAVE LOOK
            </button>
          </div>
        )}
      </section>

      {activeSubView === 'builder' ? (
        <div className="builder-layout-split">
          {/* LEFT: Composite Mannequin Exhibition Plate */}
          <section className="composite-stage">
            <div className="stage-plate">
              <div className="stage-tag font-mono">EXHIBITION PLATE // LOOK PREVIEW</div>

              <div className="garment-layers-stack">
                {/* 1. Outerwear Layer */}
                <div className={`layer-slot layer-outerwear ${!currentOuterwear ? 'layer-slot-none' : ''}`}>
                  {currentOuterwear ? (
                    <img
                      src={currentOuterwear.imageUrl}
                      alt={currentOuterwear.name}
                      className="composite-img"
                    />
                  ) : (
                    <span className="slot-empty-label font-mono">NO OUTERWEAR</span>
                  )}
                </div>

                {/* 2. Top Layer */}
                <div className={`layer-slot layer-top ${!currentTop ? 'layer-slot-none' : ''}`}>
                  {currentTop ? (
                    <img
                      src={currentTop.imageUrl}
                      alt={currentTop.name}
                      className="composite-img"
                    />
                  ) : (
                    <span className="slot-empty-label font-mono">NO TOP SELECTED</span>
                  )}
                </div>

                {/* 3. Bottom Layer */}
                <div className={`layer-slot layer-bottom ${!currentBottom ? 'layer-slot-none' : ''}`}>
                  {currentBottom ? (
                    <img
                      src={currentBottom.imageUrl}
                      alt={currentBottom.name}
                      className="composite-img"
                    />
                  ) : (
                    <span className="slot-empty-label font-mono">NO TROUSERS SELECTED</span>
                  )}
                </div>

                {/* 4. Footwear & Accessories Row */}
                <div className="layer-bottom-row">
                  <div className={`layer-slot layer-shoes ${!currentShoe ? 'layer-slot-none' : ''}`}>
                    {currentShoe ? (
                      <img
                        src={currentShoe.imageUrl}
                        alt={currentShoe.name}
                        className="composite-img"
                      />
                    ) : (
                      <span className="slot-empty-label font-mono">NO SHOES</span>
                    )}
                  </div>

                  <div className={`layer-slot layer-accessory ${!currentAccessory ? 'layer-slot-none' : ''}`}>
                    {currentAccessory ? (
                      <img
                        src={currentAccessory.imageUrl}
                        alt={currentAccessory.name}
                        className="composite-img"
                      />
                    ) : (
                      <span className="slot-empty-label font-mono">NO ACC</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Garment Bill of Materials / Index */}
              <div className="composite-manifest font-mono">
                <div className="manifest-row">
                  <span className="manifest-cat">OUTER:</span>
                  <span className="manifest-item">{currentOuterwear?.name || '—'}</span>
                </div>
                <div className="manifest-row">
                  <span className="manifest-cat">TOP:</span>
                  <span className="manifest-item">{currentTop?.name || '—'}</span>
                </div>
                <div className="manifest-row">
                  <span className="manifest-cat">BOTTOM:</span>
                  <span className="manifest-item">{currentBottom?.name || '—'}</span>
                </div>
                <div className="manifest-row">
                  <span className="manifest-cat">SHOES:</span>
                  <span className="manifest-item">{currentShoe?.name || '—'}</span>
                </div>
                <div className="manifest-row">
                  <span className="manifest-cat">ACC:</span>
                  <span className="manifest-item">{currentAccessory?.name || '—'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Slot Control Carousels */}
          <section className="slot-strips-controls">
            {/* 1. Outerwear Carousel */}
            <SlotCarouselStrip
              title="01 // OUTERWEAR"
              items={outerwearItems}
              selectedId={effectiveOuterwearId}
              allowNone={true}
              onSelect={(id) => setSelectedOuterwearId(id || 'none')}
              onCycle={(dir) => cycleItem(outerwearItems, effectiveOuterwearId, setSelectedOuterwearId, dir, true)}
            />

            {/* 2. Top Carousel */}
            <SlotCarouselStrip
              title="02 // SHIRTS & KNITS"
              items={topItems}
              selectedId={effectiveTopId}
              allowNone={false}
              onSelect={(id) => setSelectedTopId(id)}
              onCycle={(dir) => cycleItem(topItems, effectiveTopId, setSelectedTopId, dir, false)}
            />

            {/* 3. Bottom Carousel */}
            <SlotCarouselStrip
              title="03 // TROUSERS & SKIRTS"
              items={bottomItems}
              selectedId={effectiveBottomId}
              allowNone={false}
              onSelect={(id) => setSelectedBottomId(id)}
              onCycle={(dir) => cycleItem(bottomItems, effectiveBottomId, setSelectedBottomId, dir, false)}
            />

            {/* 4. Footwear Carousel */}
            <SlotCarouselStrip
              title="04 // FOOTWEAR"
              items={shoeItems}
              selectedId={effectiveShoeId}
              allowNone={false}
              onSelect={(id) => setSelectedShoeId(id)}
              onCycle={(dir) => cycleItem(shoeItems, effectiveShoeId, setSelectedShoeId, dir, false)}
            />

            {/* 5. Accessories Carousel */}
            <SlotCarouselStrip
              title="05 // BAGS & ACCS"
              items={accessoryItems}
              selectedId={effectiveAccessoryId}
              allowNone={true}
              onSelect={(id) => setSelectedAccessoryId(id || 'none')}
              onCycle={(dir) => cycleItem(accessoryItems, effectiveAccessoryId, setSelectedAccessoryId, dir, true)}
            />
          </section>
        </div>
      ) : (
        /* Saved Outfits Lookbook View */
        <section className="saved-lookbook-section">
          {outfits.length > 0 ? (
            <div className="lookbook-grid">
              {outfits.map((outfit) => {
                const oOuter = items.find((i) => i.id === outfit.slots.outerwearId);
                const oTop = items.find((i) => i.id === outfit.slots.topId);
                const oBottom = items.find((i) => i.id === outfit.slots.bottomId);
                const oShoe = items.find((i) => i.id === outfit.slots.shoesId);
                const oAcc = items.find((i) => i.id === outfit.slots.accessoryId);
                const outfitItems = [oOuter, oTop, oBottom, oShoe, oAcc].filter(Boolean) as ClothingItem[];

                return (
                  <article key={outfit.id} className="lookbook-card">
                    <div className="card-top-header">
                      <div className="look-title-group">
                        <span className="archival-overline text-accent">
                          {outfit.occasion || 'LOOK'}
                        </span>
                        <h3 className="look-title">{outfit.title}</h3>
                      </div>
                      <button
                        type="button"
                        className="delete-look-btn font-mono"
                        onClick={() => onDeleteOutfit(outfit.id)}
                        title="Delete look"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Miniature Horizontal Strip of Garment Cutouts */}
                    <div className="look-garments-strip">
                      {outfitItems.map((item) => (
                        <div key={item.id} className="look-mini-thumb" title={item.name}>
                          <img src={item.imageUrl} alt={item.name} />
                          <span className="mini-cat-tag font-mono">{item.category[0].toUpperCase()}</span>
                        </div>
                      ))}
                    </div>

                    {outfit.notes && <p className="look-notes">{outfit.notes}</p>}

                    <div className="look-card-footer">
                      <span className="look-date font-mono">
                        {new Date(outfit.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        className="load-builder-btn font-mono"
                        onClick={() => loadOutfitToBuilder(outfit)}
                      >
                        LOAD IN STUDIO →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-lookbook">
              <span className="archival-overline text-accent">VACANT LOOKBOOK</span>
              <h2 className="empty-title">No outfits assembled yet</h2>
              <p className="empty-desc">
                Use the Studio Builder to mix and match tops, bottoms, outerwear, and footwear, then click "SAVE LOOK".
              </p>
              <button
                type="button"
                className="archival-btn-primary"
                onClick={() => setActiveSubView('builder')}
              >
                OPEN STUDIO BUILDER
              </button>
            </div>
          )}
        </section>
      )}

      {/* Save Outfit Modal */}
      {showSaveModal && (
        <div className="archival-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="archival-modal" onClick={(e) => e.stopPropagation()}>
            <span className="archival-overline text-accent">REGISTER COMPOSITE</span>
            <h2 className="modal-title">Catalog this outfit</h2>
            <p className="modal-subtitle">
              Name this combination to preserve it in your personal lookbook.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmSave();
              }}
              className="save-outfit-form"
            >
              <div className="form-group">
                <label className="field-label font-mono">LOOK TITLE *</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Rainy Day Studio Uniform"
                  value={outfitTitle}
                  onChange={(e) => setOutfitTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="field-label font-mono">OCCASION / MOOD</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Gallery Opening, Travel, Everyday"
                  value={outfitOccasion}
                  onChange={(e) => setOutfitOccasion(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="field-label font-mono">STYLING NOTES</label>
                <textarea
                  className="field-textarea"
                  placeholder="e.g. Trench unbuttoned, pants cuffed once, silver watch..."
                  value={outfitNotes}
                  onChange={(e) => setOutfitNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="archival-btn-secondary"
                  onClick={() => setShowSaveModal(false)}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="archival-btn-primary"
                  disabled={!outfitTitle.trim()}
                >
                  <Check size={12} /> CONFIRM REGISTRATION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Individual Slot Strip
interface SlotCarouselStripProps {
  title: string;
  items: ClothingItem[];
  selectedId: string | undefined;
  allowNone: boolean;
  onSelect: (id: string | null) => void;
  onCycle: (dir: 1 | -1) => void;
}

const SlotCarouselStrip: React.FC<SlotCarouselStripProps> = ({
  title,
  items,
  selectedId,
  allowNone,
  onSelect,
  onCycle,
}) => {
  return (
    <div className="slot-carousel-strip">
      <div className="strip-header">
        <span className="strip-title font-mono">{title}</span>
        <div className="strip-nav-arrows">
          <button
            type="button"
            className="arrow-btn"
            onClick={() => onCycle(-1)}
            aria-label="Previous garment"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="arrow-btn"
            onClick={() => onCycle(1)}
            aria-label="Next garment"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="strip-items-scroll hide-scrollbar">
        {allowNone && (
          <button
            type="button"
            className={`strip-item-chip chip-none font-mono ${!selectedId ? 'selected' : ''}`}
            onClick={() => onSelect(null)}
          >
            NONE
          </button>
        )}

        {items.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              className={`strip-item-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <div className="chip-img-wrap">
                <img src={item.imageUrl} alt={item.name} />
              </div>
              <span className="chip-label">{item.name}</span>
            </button>
          );
        })}

        {items.length === 0 && (
          <div className="strip-empty font-mono">No garments in this category</div>
        )}
      </div>
    </div>
  );
};

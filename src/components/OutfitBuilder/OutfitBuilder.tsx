import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ClothingItem, Outfit, OutfitSlotAssignment, CanvasItemPosition } from '../../types';
import {
  Sparkles,
  Save,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  ZoomIn,
  ZoomOut,
  Layers as LayersIcon,
  X,
  Move,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import './OutfitBuilder.scss';

interface OutfitBuilderProps {
  items: ClothingItem[];
  outfits: Outfit[];
  initialSlotItem?: ClothingItem | null;
  onSaveOutfit: (outfit: Outfit) => void;
  onDeleteOutfit: (id: string) => void;
}

// Compute default coordinates based on category and layer index
const getDefaultPositionForCategory = (category: string, indexInCategory: number = 0): CanvasItemPosition => {
  const offset = indexInCategory * 4;
  switch (category) {
    case 'outerwear':
      return { x: 50 + offset, y: 26 + offset, scale: 1.0, zIndex: 12 + indexInCategory };
    case 'tops':
      return { x: 50 + offset, y: 32 + offset, scale: 0.95, zIndex: 6 + indexInCategory };
    case 'bottoms':
      return { x: 50 + offset, y: 58 + offset, scale: 1.0, zIndex: 5 + indexInCategory };
    case 'dresses':
    case 'one-piece':
      return { x: 50 + offset, y: 45 + offset, scale: 1.05, zIndex: 7 + indexInCategory };
    case 'shoes':
      return { x: 42 + offset, y: 84 + offset, scale: 0.85, zIndex: 8 + indexInCategory };
    case 'accessories':
      if (indexInCategory === 0) {
        return { x: 74, y: 70, scale: 0.85, zIndex: 9 };
      } else if (indexInCategory === 1) {
        return { x: 68, y: 18, scale: 0.75, zIndex: 15 };
      } else {
        return { x: 26 + offset, y: 64 + offset, scale: 0.8, zIndex: 9 + indexInCategory };
      }
    default:
      return { x: 50, y: 50, scale: 1.0, zIndex: 10 };
  }
};

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
  const topItems = useMemo(() => items.filter((i) => i.category === 'tops'), [items]);
  const bottomItems = useMemo(() => items.filter((i) => i.category === 'bottoms'), [items]);
  const dressItems = useMemo(() => items.filter((i) => i.category === 'dresses' || i.category === 'one-piece'), [items]);
  const shoeItems = useMemo(() => items.filter((i) => i.category === 'shoes'), [items]);
  const accessoryItems = useMemo(() => items.filter((i) => i.category === 'accessories'), [items]);

  // Multi-item selection: array of active item IDs
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Freeform canvas transformation state for active items (keyed by item.id)
  const [canvasPositions, setCanvasPositions] = useState<Record<string, CanvasItemPosition>>({});
  const [selectedCanvasItemId, setSelectedCanvasItemId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    itemId: string;
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
  } | null>(null);

  // Initialize selections
  useEffect(() => {
    if (initialSlotItem) {
      const companionIds: string[] = [initialSlotItem.id];
      if (initialSlotItem.category === 'tops' && bottomItems[0]) companionIds.push(bottomItems[0].id);
      if (initialSlotItem.category === 'bottoms' && topItems[0]) companionIds.push(topItems[0].id);
      if (shoeItems[0]) companionIds.push(shoeItems[0].id);
      if (accessoryItems[0]) companionIds.push(accessoryItems[0].id);
      setSelectedItemIds(companionIds);
    } else if (selectedItemIds.length === 0 && items.length > 0) {
      // Default starting look
      const defaults: string[] = [];
      if (topItems[0]) defaults.push(topItems[0].id);
      if (bottomItems[0]) defaults.push(bottomItems[0].id);
      if (shoeItems[0]) defaults.push(shoeItems[0].id);
      if (accessoryItems[0]) defaults.push(accessoryItems[0].id);
      setSelectedItemIds(defaults);
    }
  }, [initialSlotItem]);

  // Resolved list of active items for canvas
  const canvasItems: ClothingItem[] = useMemo(() => {
    return selectedItemIds
      .map((id) => items.find((i) => i.id === id))
      .filter(Boolean) as ClothingItem[];
  }, [selectedItemIds, items]);

  // Save Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [outfitTitle, setOutfitTitle] = useState('');
  const [outfitOccasion, setOutfitOccasion] = useState('Daily Rotation');
  const [outfitNotes, setOutfitNotes] = useState('');

  // Position getter for an item
  const getItemPosition = (item: ClothingItem): CanvasItemPosition => {
    if (canvasPositions[item.id]) {
      return canvasPositions[item.id];
    }
    const sameCatItems = canvasItems.filter((i) => i.category === item.category);
    const index = sameCatItems.findIndex((i) => i.id === item.id);
    return getDefaultPositionForCategory(item.category, Math.max(0, index));
  };

  const updateItemPosition = (itemId: string, updates: Partial<CanvasItemPosition>) => {
    setCanvasPositions((prev) => {
      const item = items.find((i) => i.id === itemId);
      const current = prev[itemId] || (item ? getItemPosition(item) : { x: 50, y: 50, scale: 1, zIndex: 10 });
      return {
        ...prev,
        [itemId]: { ...current, ...updates },
      };
    });
  };

  // Adjust scale (+ / -)
  const adjustScale = (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const pos = getItemPosition(item);
    const newScale = Math.min(2.5, Math.max(0.35, Number((pos.scale + delta).toFixed(2))));
    updateItemPosition(itemId, { scale: newScale });
  };

  // Bring to front
  const bringToFront = (itemId: string) => {
    const allZ = Object.values(canvasPositions).map((p) => p.zIndex);
    const maxZ = allZ.length ? Math.max(...allZ) : 10;
    updateItemPosition(itemId, { zIndex: maxZ + 1 });
  };

  // Remove specific piece from canvas
  const handleRemoveItem = (itemId: string) => {
    setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
    if (selectedCanvasItemId === itemId) {
      setSelectedCanvasItemId(null);
    }
  };

  // Drag handling via Pointer Events
  const handlePointerDown = (item: ClothingItem, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedCanvasItemId(item.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const pos = getItemPosition(item);
    dragRef.current = {
      isDragging: true,
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: pos.x,
      initialPosY: pos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !dragRef.current.isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const deltaXPixels = e.clientX - dragRef.current.startX;
    const deltaYPixels = e.clientY - dragRef.current.startY;

    const deltaXPercent = (deltaXPixels / rect.width) * 100;
    const deltaYPercent = (deltaYPixels / rect.height) * 100;

    const newX = Math.round(dragRef.current.initialPosX + deltaXPercent);
    const newY = Math.round(dragRef.current.initialPosY + deltaYPercent);

    updateItemPosition(dragRef.current.itemId, { x: newX, y: newY });
  };

  const handlePointerUp = () => {
    if (dragRef.current) {
      dragRef.current = null;
    }
  };

  // Toggle selection of an item (supports layering tops, multiple accessories, etc.)
  const handleToggleItem = (id: string) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Clear all items belonging to a category
  const handleClearCategory = (categoryKey: string) => {
    setSelectedItemIds((prev) =>
      prev.filter((id) => {
        const item = items.find((i) => i.id === id);
        if (!item) return false;
        if (categoryKey === 'dresses') return item.category !== 'dresses' && item.category !== 'one-piece';
        return item.category !== categoryKey;
      })
    );
  };

  // Cycle helper
  const handleCycleCategory = (categoryList: ClothingItem[], direction: 1 | -1) => {
    if (categoryList.length === 0) return;
    const categoryIds = categoryList.map((i) => i.id);
    const currentSelected = selectedItemIds.filter((id) => categoryIds.includes(id));

    if (currentSelected.length === 0) {
      handleToggleItem(categoryList[0].id);
      return;
    }

    const lastId = currentSelected[currentSelected.length - 1];
    const currentIndex = categoryList.findIndex((i) => i.id === lastId);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = categoryList.length - 1;
    if (nextIndex >= categoryList.length) nextIndex = 0;

    // Replace current selected with next in cycle
    const nextItem = categoryList[nextIndex];
    setSelectedItemIds((prev) => [...prev.filter((id) => !categoryIds.includes(id)), nextItem.id]);
  };

  // Serendipity Randomize with smart layering
  const handleRandomize = () => {
    const randomized: string[] = [];

    // 40% chance of a Dress Look vs 60% Separates
    const useDress = dressItems.length > 0 && Math.random() > 0.6;

    if (useDress) {
      randomized.push(dressItems[Math.floor(Math.random() * dressItems.length)].id);
      // Optional layer over dress (e.g. cardigan/knitwear)
      if (topItems.length && Math.random() > 0.5) {
        randomized.push(topItems[Math.floor(Math.random() * topItems.length)].id);
      }
    } else {
      // Separates: 1 Bottom
      if (bottomItems.length) {
        randomized.push(bottomItems[Math.floor(Math.random() * bottomItems.length)].id);
      }
      // 1 or 2 Tops (e.g. Tank + Cardigan / Shirt)
      if (topItems.length) {
        const firstTop = topItems[Math.floor(Math.random() * topItems.length)];
        randomized.push(firstTop.id);

        if (topItems.length > 1 && Math.random() > 0.5) {
          const secondTop = topItems.find((t) => t.id !== firstTop.id);
          if (secondTop) randomized.push(secondTop.id);
        }
      }
    }

    // Outerwear (50% chance)
    if (outerwearItems.length && Math.random() > 0.5) {
      randomized.push(outerwearItems[Math.floor(Math.random() * outerwearItems.length)].id);
    }

    // Shoes
    if (shoeItems.length) {
      randomized.push(shoeItems[Math.floor(Math.random() * shoeItems.length)].id);
    }

    // Accessories: 1 or 2 (e.g. Bag + Sunglasses)
    if (accessoryItems.length) {
      const firstAcc = accessoryItems[Math.floor(Math.random() * accessoryItems.length)];
      randomized.push(firstAcc.id);

      if (accessoryItems.length > 1 && Math.random() > 0.4) {
        const secondAcc = accessoryItems.find((a) => a.id !== firstAcc.id);
        if (secondAcc) randomized.push(secondAcc.id);
      }
    }

    setSelectedItemIds(randomized);
    setCanvasPositions({});
    setSelectedCanvasItemId(null);
  };

  // Reset positions
  const handleResetPositions = () => {
    setCanvasPositions({});
    setSelectedCanvasItemId(null);
  };

  // Clear all pieces
  const handleClearAll = () => {
    setSelectedItemIds([]);
    setCanvasPositions({});
    setSelectedCanvasItemId(null);
  };

  const handleConfirmSave = () => {
    if (!outfitTitle.trim()) return;

    // Single slot fallbacks for backwards compatibility
    const oOuter = selectedItemIds.find((id) => items.find((i) => i.id === id)?.category === 'outerwear');
    const oTop = selectedItemIds.find((id) => items.find((i) => i.id === id)?.category === 'tops');
    const oBottom = selectedItemIds.find((id) => items.find((i) => i.id === id)?.category === 'bottoms');
    const oDress = selectedItemIds.find((id) => {
      const c = items.find((i) => i.id === id)?.category;
      return c === 'dresses' || c === 'one-piece';
    });
    const oShoe = selectedItemIds.find((id) => items.find((i) => i.id === id)?.category === 'shoes');
    const oAcc = selectedItemIds.find((id) => items.find((i) => i.id === id)?.category === 'accessories');

    const slots: OutfitSlotAssignment = {
      itemIds: selectedItemIds,
      outerwearId: oOuter,
      topId: oTop,
      bottomId: oBottom,
      dressId: oDress,
      shoesId: oShoe,
      accessoryId: oAcc,
      canvasPositions,
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
    if (outfit.slots.itemIds && outfit.slots.itemIds.length > 0) {
      setSelectedItemIds(outfit.slots.itemIds);
    } else {
      const fallbackIds = [
        outfit.slots.outerwearId,
        outfit.slots.topId,
        outfit.slots.bottomId,
        outfit.slots.dressId,
        outfit.slots.shoesId,
        outfit.slots.accessoryId,
      ].filter(Boolean) as string[];
      setSelectedItemIds(fallbackIds);
    }

    if (outfit.slots.canvasPositions) {
      setCanvasPositions(outfit.slots.canvasPositions);
    }
    setActiveSubView('builder');
  };

  const activeSelectedItem = selectedCanvasItemId
    ? items.find((i) => i.id === selectedCanvasItemId)
    : null;

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
                STUDIO CANVAS
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
              onClick={handleResetPositions}
              title="Reset positions"
            >
              <RotateCcw size={13} /> RE-ALIGN
            </button>
            <button
              type="button"
              className="archival-btn-secondary icon-btn font-mono"
              onClick={handleClearAll}
              title="Clear all items"
            >
              <X size={13} /> CLEAR
            </button>
            <button
              type="button"
              className="archival-btn-primary save-btn"
              onClick={() => setShowSaveModal(true)}
              disabled={canvasItems.length === 0}
            >
              <Save size={13} /> SAVE LOOK ({canvasItems.length})
            </button>
          </div>
        )}
      </section>

      {activeSubView === 'builder' ? (
        <div className="builder-layout-split">
          {/* LEFT: Draggable & Resizable Composite Exhibition Stage */}
          <section className="composite-stage">
            <div className="stage-plate">
              <div className="stage-top-meta">
                <span className="stage-tag font-mono">
                  DRAGGABLE COMPOSITE CANVAS // {canvasItems.length} ACTIVE PIECES
                </span>
                <span className="stage-hint font-mono">MULTI-SELECT ACTIVE • TAP TO RESIZE</span>
              </div>

              {/* Freeform Canvas Plate */}
              <div
                ref={canvasRef}
                className="freeform-canvas"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={() => setSelectedCanvasItemId(null)}
              >
                {/* Subtle blueprint grid */}
                <div className="canvas-grid-pattern" />

                {canvasItems.length === 0 ? (
                  <div className="canvas-vacant-prompt font-mono">
                    <span>[ VACANT CANVAS ]</span>
                    <p>Tap garments in the side panels to layer tops, mix bottoms, and style accessories</p>
                  </div>
                ) : (
                  canvasItems.map((item) => {
                    const pos = getItemPosition(item);
                    const isSelected = selectedCanvasItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`canvas-garment-node ${isSelected ? 'is-selected' : ''}`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: `translate(-50%, -50%) scale(${pos.scale})`,
                          zIndex: pos.zIndex,
                        }}
                        onPointerDown={(e) => handlePointerDown(item, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCanvasItemId(item.id);
                        }}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="canvas-garment-img"
                          draggable={false}
                        />

                        {isSelected && (
                          <div className="node-bounding-box">
                            <div className="bounding-handle top-left" />
                            <div className="bounding-handle top-right" />
                            <div className="bounding-handle bottom-left" />
                            <div className="bounding-handle bottom-right" />
                            <div className="node-drag-indicator font-mono">
                              <Move size={9} />
                              <span>{item.category}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Floating Scale & Layer Toolbar for Active Selected Garment */}
                {activeSelectedItem && (
                  <div className="canvas-floating-toolbar" onClick={(e) => e.stopPropagation()}>
                    <span className="toolbar-item-name font-mono">
                      {activeSelectedItem.name}
                    </span>

                    <div className="toolbar-btn-group font-mono">
                      <button
                        type="button"
                        className="tool-btn"
                        onClick={() => adjustScale(activeSelectedItem.id, -0.1)}
                        title="Scale Down"
                      >
                        <ZoomOut size={12} />
                      </button>

                      <span className="scale-indicator font-mono">
                        {Math.round(getItemPosition(activeSelectedItem).scale * 100)}%
                      </span>

                      <button
                        type="button"
                        className="tool-btn"
                        onClick={() => adjustScale(activeSelectedItem.id, 0.1)}
                        title="Scale Up"
                      >
                        <ZoomIn size={12} />
                      </button>

                      <button
                        type="button"
                        className="tool-btn"
                        onClick={() => bringToFront(activeSelectedItem.id)}
                        title="Bring to Front"
                      >
                        <LayersIcon size={12} />
                      </button>

                      <button
                        type="button"
                        className="tool-btn danger"
                        onClick={() => handleRemoveItem(activeSelectedItem.id)}
                        title="Remove piece from look"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Garment Manifest List */}
              <div className="composite-manifest font-mono">
                {canvasItems.map((item) => (
                  <div key={item.id} className="manifest-row">
                    <span className="manifest-cat">{item.category.toUpperCase().slice(0, 5)}:</span>
                    <span className="manifest-item">{item.name}</span>
                  </div>
                ))}
                {canvasItems.length === 0 && (
                  <div className="manifest-empty font-mono">NO ACTIVE PIECES IN LOOK</div>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT: Slot Control Carousels with MULTI-SELECT SUPPORT */}
          <section className="slot-strips-controls">
            {/* 1. Tops Carousel (Allows Multi-Select Layering: e.g. Tank + Cardigan) */}
            <SlotCarouselStrip
              title="01 // SHIRTS, KNITS & LAYERS"
              items={topItems}
              selectedIds={selectedItemIds}
              onToggle={handleToggleItem}
              onClear={() => handleClearCategory('tops')}
              onCycle={(dir) => handleCycleCategory(topItems, dir)}
            />

            {/* 2. Dresses Carousel */}
            <SlotCarouselStrip
              title="02 // DRESSES & ONE-PIECE"
              items={dressItems}
              selectedIds={selectedItemIds}
              onToggle={handleToggleItem}
              onClear={() => handleClearCategory('dresses')}
              onCycle={(dir) => handleCycleCategory(dressItems, dir)}
            />

            {/* 3. Outerwear Carousel */}
            <SlotCarouselStrip
              title="03 // OUTERWEAR & JACKETS"
              items={outerwearItems}
              selectedIds={selectedItemIds}
              onToggle={handleToggleItem}
              onClear={() => handleClearCategory('outerwear')}
              onCycle={(dir) => handleCycleCategory(outerwearItems, dir)}
            />

            {/* 4. Bottoms Carousel */}
            <SlotCarouselStrip
              title="04 // TROUSERS & SKIRTS"
              items={bottomItems}
              selectedIds={selectedItemIds}
              onToggle={handleToggleItem}
              onClear={() => handleClearCategory('bottoms')}
              onCycle={(dir) => handleCycleCategory(bottomItems, dir)}
            />

            {/* 5. Accessories Carousel (Allows Multi-Select: e.g. Bag + Sunglasses) */}
            <SlotCarouselStrip
              title="05 // BAGS & ACCESSORIES"
              items={accessoryItems}
              selectedIds={selectedItemIds}
              onToggle={handleToggleItem}
              onClear={() => handleClearCategory('accessories')}
              onCycle={(dir) => handleCycleCategory(accessoryItems, dir)}
            />

            {/* 6. Footwear Carousel */}
            <SlotCarouselStrip
              title="06 // FOOTWEAR"
              items={shoeItems}
              selectedIds={selectedItemIds}
              onToggle={handleToggleItem}
              onClear={() => handleClearCategory('shoes')}
              onCycle={(dir) => handleCycleCategory(shoeItems, dir)}
            />
          </section>
        </div>
      ) : (
        /* Saved Outfits Lookbook View */
        <section className="saved-lookbook-section">
          {outfits.length > 0 ? (
            <div className="lookbook-grid">
              {outfits.map((outfit) => {
                // Support both multi-select itemIds and legacy single slots
                const outfitItems: ClothingItem[] = outfit.slots.itemIds
                  ? (outfit.slots.itemIds
                      .map((id) => items.find((i) => i.id === id))
                      .filter(Boolean) as ClothingItem[])
                  : ([
                      items.find((i) => i.id === outfit.slots.outerwearId),
                      items.find((i) => i.id === outfit.slots.topId),
                      items.find((i) => i.id === outfit.slots.bottomId),
                      items.find((i) => i.id === outfit.slots.dressId),
                      items.find((i) => i.id === outfit.slots.shoesId),
                      items.find((i) => i.id === outfit.slots.accessoryId),
                    ].filter(Boolean) as ClothingItem[]);

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
                Use the Studio Canvas to mix, match, and layer tops, dresses, bottoms, accessories, and footwear, then click "SAVE LOOK".
              </p>
              <button
                type="button"
                className="archival-btn-primary"
                onClick={() => setActiveSubView('builder')}
              >
                OPEN STUDIO CANVAS
              </button>
            </div>
          )}
        </section>
      )}

      {/* Save Outfit Modal */}
      {showSaveModal && (
        <div className="archival-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="archival-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="close-modal-btn"
              onClick={() => setShowSaveModal(false)}
            >
              <X size={20} />
            </button>

            <span className="archival-overline text-accent">LOOK ARCHIVE ENTRY</span>
            <h2 className="modal-title">Catalog Ensemble</h2>
            <p className="modal-subtitle">
              Document this composite look ({canvasItems.length} pieces) into your personal wardrobe lookbook.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmSave();
              }}
              className="outfit-save-form"
            >
              <div className="form-group">
                <label className="field-label font-mono">LOOK TITLE *</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Saturday Studio, Gallery Opening"
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
                  placeholder="e.g. Cardigan unbuttoned over tank, silver accessories..."
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

// Subcomponent: Individual Slot Strip with MULTI-SELECT support
interface SlotCarouselStripProps {
  title: string;
  items: ClothingItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onCycle: (dir: 1 | -1) => void;
}

const SlotCarouselStrip: React.FC<SlotCarouselStripProps> = ({
  title,
  items,
  selectedIds,
  onToggle,
  onClear,
  onCycle,
}) => {
  const activeCount = items.filter((i) => selectedIds.includes(i.id)).length;

  return (
    <div className="slot-carousel-strip">
      <div className="strip-header">
        <div className="strip-title-group">
          <span className="strip-title font-mono">{title}</span>
          {activeCount > 0 && (
            <span className="strip-active-count font-mono">{activeCount} ACTIVE</span>
          )}
        </div>

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
        {/* Clear category button */}
        <button
          type="button"
          className={`strip-item-chip chip-none font-mono ${activeCount === 0 ? 'selected' : ''}`}
          onClick={onClear}
        >
          NONE
        </button>

        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`strip-item-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggle(item.id)}
            >
              {isSelected && <span className="chip-check-badge">✓</span>}
              <div className="chip-img-wrap">
                <img src={item.imageUrl} alt={item.name} />
              </div>
              <span className="chip-label">{item.name}</span>
            </button>
          );
        })}

        {items.length === 0 && (
          <div className="strip-empty font-mono">No garments registered yet</div>
        )}
      </div>
    </div>
  );
};

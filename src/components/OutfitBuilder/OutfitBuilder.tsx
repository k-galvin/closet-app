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

type SlotType = 'outerwear' | 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory';

const DEFAULT_POSITIONS: Record<SlotType, CanvasItemPosition> = {
  outerwear: { x: 50, y: 32, scale: 1.0, zIndex: 10 },
  top: { x: 50, y: 30, scale: 0.95, zIndex: 6 },
  bottom: { x: 50, y: 60, scale: 1.0, zIndex: 4 },
  dress: { x: 50, y: 46, scale: 1.05, zIndex: 5 },
  shoes: { x: 42, y: 84, scale: 0.85, zIndex: 7 },
  accessory: { x: 74, y: 70, scale: 0.85, zIndex: 8 },
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

  // Current slot selections (all 100% optional; null means none)
  const [selectedOuterwearId, setSelectedOuterwearId] = useState<string | null>(null);
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null);
  const [selectedDressId, setSelectedDressId] = useState<string | null>(null);
  const [selectedShoeId, setSelectedShoeId] = useState<string | null>(null);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(null);

  // Freeform canvas transformation state for active items
  const [canvasPositions, setCanvasPositions] = useState<Record<string, CanvasItemPosition>>({});
  const [selectedCanvasSlot, setSelectedCanvasSlot] = useState<SlotType | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    slot: SlotType;
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
  } | null>(null);

  // Sync / initialize slots whenever initialSlotItem is passed
  useEffect(() => {
    if (initialSlotItem) {
      if (initialSlotItem.category === 'outerwear') setSelectedOuterwearId(initialSlotItem.id);
      if (initialSlotItem.category === 'tops') setSelectedTopId(initialSlotItem.id);
      if (initialSlotItem.category === 'bottoms') setSelectedBottomId(initialSlotItem.id);
      if (initialSlotItem.category === 'dresses' || initialSlotItem.category === 'one-piece') {
        setSelectedDressId(initialSlotItem.id);
        setSelectedTopId(null);
        setSelectedBottomId(null);
      }
      if (initialSlotItem.category === 'shoes') setSelectedShoeId(initialSlotItem.id);
      if (initialSlotItem.category === 'accessories') setSelectedAccessoryId(initialSlotItem.id);
    }
  }, [initialSlotItem]);

  // Initial defaults if nothing set yet
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

  // Selected item objects for display
  const currentOuterwear = items.find((i) => i.id === selectedOuterwearId);
  const currentTop = items.find((i) => i.id === selectedTopId);
  const currentBottom = items.find((i) => i.id === selectedBottomId);
  const currentDress = items.find((i) => i.id === selectedDressId);
  const currentShoe = items.find((i) => i.id === selectedShoeId);
  const currentAccessory = items.find((i) => i.id === selectedAccessoryId);

  // Position getter for a slot
  const getSlotPosition = (slot: SlotType): CanvasItemPosition => {
    return canvasPositions[slot] || DEFAULT_POSITIONS[slot];
  };

  const updateSlotPosition = (slot: SlotType, updates: Partial<CanvasItemPosition>) => {
    setCanvasPositions((prev) => {
      const current = prev[slot] || DEFAULT_POSITIONS[slot];
      return {
        ...prev,
        [slot]: { ...current, ...updates },
      };
    });
  };

  // Adjust scale (+ / -)
  const adjustScale = (slot: SlotType, delta: number) => {
    const pos = getSlotPosition(slot);
    const newScale = Math.min(2.2, Math.max(0.4, Number((pos.scale + delta).toFixed(2))));
    updateSlotPosition(slot, { scale: newScale });
  };

  // Bring to front
  const bringToFront = (slot: SlotType) => {
    const allZ = Object.values(canvasPositions).map((p) => p.zIndex);
    const maxZ = allZ.length ? Math.max(...allZ) : 10;
    updateSlotPosition(slot, { zIndex: maxZ + 1 });
  };

  // Drag handling via Pointer Events
  const handlePointerDown = (slot: SlotType, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedCanvasSlot(slot);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pos = getSlotPosition(slot);
    dragRef.current = {
      isDragging: true,
      slot,
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

    updateSlotPosition(dragRef.current.slot, { x: newX, y: newY });
  };

  const handlePointerUp = () => {
    if (dragRef.current) {
      dragRef.current = null;
    }
  };

  // Serendipity Randomize
  const handleRandomize = () => {
    const useDress = dressItems.length > 0 && Math.random() > 0.6;

    if (useDress) {
      setSelectedDressId(dressItems[Math.floor(Math.random() * dressItems.length)].id);
      setSelectedTopId(null);
      setSelectedBottomId(null);
    } else {
      setSelectedDressId(null);
      if (topItems.length) setSelectedTopId(topItems[Math.floor(Math.random() * topItems.length)].id);
      if (bottomItems.length) setSelectedBottomId(bottomItems[Math.floor(Math.random() * bottomItems.length)].id);
    }

    if (shoeItems.length) {
      setSelectedShoeId(shoeItems[Math.floor(Math.random() * shoeItems.length)].id);
    }

    if (outerwearItems.length && Math.random() > 0.4) {
      setSelectedOuterwearId(outerwearItems[Math.floor(Math.random() * outerwearItems.length)].id);
    } else {
      setSelectedOuterwearId(null);
    }

    if (accessoryItems.length && Math.random() > 0.3) {
      setSelectedAccessoryId(accessoryItems[Math.floor(Math.random() * accessoryItems.length)].id);
    } else {
      setSelectedAccessoryId(null);
    }
  };

  // Reset positions
  const handleResetPositions = () => {
    setCanvasPositions({});
    setSelectedCanvasSlot(null);
  };

  // Clear all slots
  const handleClearAll = () => {
    setSelectedOuterwearId(null);
    setSelectedTopId(null);
    setSelectedBottomId(null);
    setSelectedDressId(null);
    setSelectedShoeId(null);
    setSelectedAccessoryId(null);
    setCanvasPositions({});
    setSelectedCanvasSlot(null);
  };

  // Helper for cycle prev/next
  const cycleItem = (
    list: ClothingItem[],
    currentId: string | null,
    setter: (id: string | null) => void,
    direction: 1 | -1
  ) => {
    if (list.length === 0) return;
    const currentIndex = currentId ? list.findIndex((i) => i.id === currentId) : -1;
    let nextIndex = currentIndex + direction;

    if (nextIndex < -1) nextIndex = list.length - 1;
    if (nextIndex >= list.length) nextIndex = -1;

    setter(nextIndex === -1 ? null : list[nextIndex].id);
  };

  const handleConfirmSave = () => {
    if (!outfitTitle.trim()) return;

    const slots: OutfitSlotAssignment = {
      outerwearId: selectedOuterwearId || undefined,
      topId: selectedTopId || undefined,
      bottomId: selectedBottomId || undefined,
      dressId: selectedDressId || undefined,
      shoesId: selectedShoeId || undefined,
      accessoryId: selectedAccessoryId || undefined,
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
    setSelectedOuterwearId(outfit.slots.outerwearId || null);
    setSelectedTopId(outfit.slots.topId || null);
    setSelectedBottomId(outfit.slots.bottomId || null);
    setSelectedDressId(outfit.slots.dressId || null);
    setSelectedShoeId(outfit.slots.shoesId || null);
    setSelectedAccessoryId(outfit.slots.accessoryId || null);
    if (outfit.slots.canvasPositions) {
      setCanvasPositions(outfit.slots.canvasPositions);
    }
    setActiveSubView('builder');
  };

  // Active items list to render on canvas
  const canvasItems: { slot: SlotType; item: ClothingItem }[] = [
    currentOuterwear && { slot: 'outerwear', item: currentOuterwear },
    currentTop && { slot: 'top', item: currentTop },
    currentBottom && { slot: 'bottom', item: currentBottom },
    currentDress && { slot: 'dress', item: currentDress },
    currentShoe && { slot: 'shoes', item: currentShoe },
    currentAccessory && { slot: 'accessory', item: currentAccessory },
  ].filter(Boolean) as { slot: SlotType; item: ClothingItem }[];

  const activeSelectedItem = selectedCanvasSlot
    ? canvasItems.find((c) => c.slot === selectedCanvasSlot)
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
              <Save size={13} /> SAVE LOOK
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
                  DRAGGABLE COMPOSITE CANVAS // {canvasItems.length} PIECES
                </span>
                <span className="stage-hint font-mono">DRAG TO MOVE • TAP TO RESIZE</span>
              </div>

              {/* Freeform Canvas Plate */}
              <div
                ref={canvasRef}
                className="freeform-canvas"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={() => setSelectedCanvasSlot(null)}
              >
                {/* Subtle blueprint grid */}
                <div className="canvas-grid-pattern" />

                {canvasItems.length === 0 ? (
                  <div className="canvas-vacant-prompt font-mono">
                    <span>[ VACANT CANVAS ]</span>
                    <p>Select any garment from the panels to begin curating</p>
                  </div>
                ) : (
                  canvasItems.map(({ slot, item }) => {
                    const pos = getSlotPosition(slot);
                    const isSelected = selectedCanvasSlot === slot;

                    return (
                      <div
                        key={`${slot}-${item.id}`}
                        className={`canvas-garment-node ${isSelected ? 'is-selected' : ''}`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: `translate(-50%, -50%) scale(${pos.scale})`,
                          zIndex: pos.zIndex,
                        }}
                        onPointerDown={(e) => handlePointerDown(slot, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCanvasSlot(slot);
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
                              <Move size={10} />
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
                      {activeSelectedItem.item.name}
                    </span>

                    <div className="toolbar-btn-group font-mono">
                      <button
                        type="button"
                        className="tool-btn"
                        onClick={() => adjustScale(activeSelectedItem.slot, -0.1)}
                        title="Scale Down"
                      >
                        <ZoomOut size={12} />
                      </button>

                      <span className="scale-indicator">
                        {Math.round(getSlotPosition(activeSelectedItem.slot).scale * 100)}%
                      </span>

                      <button
                        type="button"
                        className="tool-btn"
                        onClick={() => adjustScale(activeSelectedItem.slot, 0.1)}
                        title="Scale Up"
                      >
                        <ZoomIn size={12} />
                      </button>

                      <button
                        type="button"
                        className="tool-btn"
                        onClick={() => bringToFront(activeSelectedItem.slot)}
                        title="Bring to Front"
                      >
                        <LayersIcon size={12} />
                      </button>

                      <button
                        type="button"
                        className="tool-btn danger"
                        onClick={() => {
                          if (activeSelectedItem.slot === 'outerwear') setSelectedOuterwearId(null);
                          if (activeSelectedItem.slot === 'top') setSelectedTopId(null);
                          if (activeSelectedItem.slot === 'bottom') setSelectedBottomId(null);
                          if (activeSelectedItem.slot === 'dress') setSelectedDressId(null);
                          if (activeSelectedItem.slot === 'shoes') setSelectedShoeId(null);
                          if (activeSelectedItem.slot === 'accessory') setSelectedAccessoryId(null);
                          setSelectedCanvasSlot(null);
                        }}
                        title="Remove from Canvas"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Garment Bill of Materials / Index */}
              <div className="composite-manifest font-mono">
                {currentOuterwear && (
                  <div className="manifest-row">
                    <span className="manifest-cat">OUTER:</span>
                    <span className="manifest-item">{currentOuterwear.name}</span>
                  </div>
                )}
                {currentTop && (
                  <div className="manifest-row">
                    <span className="manifest-cat">TOP:</span>
                    <span className="manifest-item">{currentTop.name}</span>
                  </div>
                )}
                {currentBottom && (
                  <div className="manifest-row">
                    <span className="manifest-cat">BOTTOM:</span>
                    <span className="manifest-item">{currentBottom.name}</span>
                  </div>
                )}
                {currentDress && (
                  <div className="manifest-row">
                    <span className="manifest-cat">DRESS:</span>
                    <span className="manifest-item">{currentDress.name}</span>
                  </div>
                )}
                {currentShoe && (
                  <div className="manifest-row">
                    <span className="manifest-cat">SHOES:</span>
                    <span className="manifest-item">{currentShoe.name}</span>
                  </div>
                )}
                {currentAccessory && (
                  <div className="manifest-row">
                    <span className="manifest-cat">ACC:</span>
                    <span className="manifest-item">{currentAccessory.name}</span>
                  </div>
                )}
                {canvasItems.length === 0 && (
                  <div className="manifest-empty font-mono">NO ACTIVE PIECES IN LOOK</div>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT: Slot Control Carousels (ALL Categories Optional with 'NONE') */}
          <section className="slot-strips-controls">
            {/* 1. Outerwear Carousel */}
            <SlotCarouselStrip
              title="01 // OUTERWEAR"
              items={outerwearItems}
              selectedId={selectedOuterwearId}
              onSelect={setSelectedOuterwearId}
              onCycle={(dir) => cycleItem(outerwearItems, selectedOuterwearId, setSelectedOuterwearId, dir)}
            />

            {/* 2. Dresses Carousel */}
            <SlotCarouselStrip
              title="02 // DRESSES & ONE-PIECE"
              items={dressItems}
              selectedId={selectedDressId}
              onSelect={(id) => {
                setSelectedDressId(id);
                // If selecting dress, optionally clear top/bottom if desired, or let user layer!
              }}
              onCycle={(dir) => cycleItem(dressItems, selectedDressId, setSelectedDressId, dir)}
            />

            {/* 3. Top Carousel */}
            <SlotCarouselStrip
              title="03 // SHIRTS & KNITS"
              items={topItems}
              selectedId={selectedTopId}
              onSelect={setSelectedTopId}
              onCycle={(dir) => cycleItem(topItems, selectedTopId, setSelectedTopId, dir)}
            />

            {/* 4. Bottom Carousel */}
            <SlotCarouselStrip
              title="04 // TROUSERS & SKIRTS"
              items={bottomItems}
              selectedId={selectedBottomId}
              onSelect={setSelectedBottomId}
              onCycle={(dir) => cycleItem(bottomItems, selectedBottomId, setSelectedBottomId, dir)}
            />

            {/* 5. Footwear Carousel */}
            <SlotCarouselStrip
              title="05 // FOOTWEAR"
              items={shoeItems}
              selectedId={selectedShoeId}
              onSelect={setSelectedShoeId}
              onCycle={(dir) => cycleItem(shoeItems, selectedShoeId, setSelectedShoeId, dir)}
            />

            {/* 6. Accessories Carousel */}
            <SlotCarouselStrip
              title="06 // BAGS & ACCS"
              items={accessoryItems}
              selectedId={selectedAccessoryId}
              onSelect={setSelectedAccessoryId}
              onCycle={(dir) => cycleItem(accessoryItems, selectedAccessoryId, setSelectedAccessoryId, dir)}
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
                const oDress = items.find((i) => i.id === outfit.slots.dressId);
                const oShoe = items.find((i) => i.id === outfit.slots.shoesId);
                const oAcc = items.find((i) => i.id === outfit.slots.accessoryId);
                const outfitItems = [oOuter, oTop, oBottom, oDress, oShoe, oAcc].filter(Boolean) as ClothingItem[];

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
                Use the Studio Canvas to mix and match any combination of tops, dresses, bottoms, outerwear, and footwear, then click "SAVE LOOK".
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

// Subcomponent: Individual Slot Strip (ALL have NONE option)
interface SlotCarouselStripProps {
  title: string;
  items: ClothingItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCycle: (dir: 1 | -1) => void;
}

const SlotCarouselStrip: React.FC<SlotCarouselStripProps> = ({
  title,
  items,
  selectedId,
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
        {/* All categories can be set to NONE */}
        <button
          type="button"
          className={`strip-item-chip chip-none font-mono ${selectedId === null ? 'selected' : ''}`}
          onClick={() => onSelect(null)}
        >
          NONE
        </button>

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
          <div className="strip-empty font-mono">No garments registered yet</div>
        )}
      </div>
    </div>
  );
};

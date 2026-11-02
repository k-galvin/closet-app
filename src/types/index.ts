export type ClothingCategory = 
  | 'tops' 
  | 'bottoms' 
  | 'outerwear' 
  | 'shoes' 
  | 'accessories' 
  | 'one-piece';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subcategory?: string;
  designer?: string;
  color: string;
  secondaryColors?: string[];
  seasons: Season[];
  imageUrl: string;
  notes?: string;
  fabric?: string;
  catalogNumber: string; // e.g. "ARC-CLO-014"
  createdAt: number;
  updatedAt: number;
}

export interface OutfitSlotAssignment {
  topId?: string;
  bottomId?: string;
  shoesId?: string;
  outerwearId?: string;
  accessoryId?: string;
}

export interface Outfit {
  id: string;
  title: string;
  occasion?: string;
  notes?: string;
  slots: OutfitSlotAssignment;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  itemIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type ViewTab = 'closet' | 'outfits' | 'collections';

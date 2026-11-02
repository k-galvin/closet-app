import { ClothingItem, Collection, Outfit } from '../types';

// Helper to make high-fidelity transparent SVG clothing silhouettes for initial lookbook demo
function makeSvgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

const trenchSvg = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Trench Coat Silhouette in Warm Taupe/Khaki -->
    <path d="M150,70 L200,95 L250,70 L280,140 L310,240 L280,245 L260,170 L265,420 L135,420 L140,170 L120,245 L90,240 L120,140 Z" fill="#cfc2b0"/>
    <!-- Lapels -->
    <path d="M175,85 L200,165 L225,85 L215,75 L200,95 L185,75 Z" fill="#b9ab98"/>
    <!-- Collar & Belt line -->
    <path d="M140,240 L260,240 L255,258 L145,258 Z" fill="#b1a28e"/>
    <!-- Storm flap -->
    <path d="M200,95 L250,140 L235,180 L200,150 Z" fill="#c4b6a2"/>
    <!-- Subtle stitch details -->
    <line x1="200" y1="258" x2="200" y2="420" stroke="#b1a28e" stroke-width="2" stroke-dasharray="3,3"/>
  </g>
</svg>
`);

const shirtSvg = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Crisp White Poplin Oversized Shirt -->
    <path d="M155,80 L200,98 L245,80 L285,130 L320,230 L290,238 L265,160 L260,360 L140,360 L135,160 L110,238 L80,230 L115,130 Z" fill="#fdfbf7" stroke="#e8e4dc" stroke-width="2"/>
    <!-- Point Collar -->
    <polygon points="175,90 200,135 185,135 165,85" fill="#f4efe6"/>
    <polygon points="225,90 200,135 215,135 235,85" fill="#ece6dc"/>
    <!-- Placket & Buttons -->
    <line x1="200" y1="135" x2="200" y2="350" stroke="#ded8cc" stroke-width="3"/>
    <circle cx="200" cy="165" r="3" fill="#a8a29e"/>
    <circle cx="200" cy="205" r="3" fill="#a8a29e"/>
    <circle cx="200" cy="245" r="3" fill="#a8a29e"/>
    <circle cx="200" cy="285" r="3" fill="#a8a29e"/>
    <circle cx="200" cy="325" r="3" fill="#a8a29e"/>
  </g>
</svg>
`);

const knitSvg = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.1"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Deep Navy Cashmere Crewneck -->
    <path d="M150,85 C175,100 225,100 250,85 L285,120 L315,250 L280,256 L255,165 L255,340 L145,340 L145,165 L120,256 L85,250 L115,120 Z" fill="#182230"/>
    <!-- Ribbed Collar -->
    <path d="M160,88 C180,98 220,98 240,88 C235,105 165,105 160,88 Z" fill="#0f1620"/>
    <!-- Hem rib -->
    <rect x="145" y="328" width="110" height="12" fill="#111924"/>
    <rect x="85" y="244" width="35" height="12" fill="#111924" transform="rotate(-15 102 250)"/>
    <rect x="280" y="244" width="35" height="12" fill="#111924" transform="rotate(15 298 250)"/>
  </g>
</svg>
`);

const trouserSvg = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Charcoal Wide-Leg Wool Trousers -->
    <path d="M140,80 L260,80 L265,115 L255,440 L208,440 L200,165 L192,440 L145,440 L135,115 Z" fill="#23272a"/>
    <!-- Waistband & Pleats -->
    <rect x="140" y="80" width="120" height="16" fill="#1a1d1f"/>
    <!-- Press creases -->
    <line x1="172" y1="110" x2="175" y2="435" stroke="#373d42" stroke-width="1.5"/>
    <line x1="228" y1="110" x2="225" y2="435" stroke="#373d42" stroke-width="1.5"/>
  </g>
</svg>
`);

const jeansSvg = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.1"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Vintage Ecru Raw Denim -->
    <path d="M145,80 L255,80 L258,115 L250,430 L208,430 L200,160 L192,430 L150,430 L142,115 Z" fill="#ebe6dd" stroke="#ded8cc" stroke-width="1.5"/>
    <rect x="145" y="80" width="110" height="15" fill="#dfd8cb"/>
    <!-- Contrast stitching -->
    <line x1="200" y1="95" x2="200" y2="155" stroke="#a4937a" stroke-width="1.5"/>
    <path d="M152,105 Q175,105 180,125" fill="none" stroke="#a4937a" stroke-width="1.5"/>
    <path d="M248,105 Q225,105 220,125" fill="none" stroke="#a4937a" stroke-width="1.5"/>
  </g>
</svg>
`);

const loafersSvg = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Black Box-Calf Penny Loafers Pair -->
    <!-- Left shoe -->
    <path d="M100,210 C100,165 140,150 160,175 C180,190 185,250 180,270 C165,285 110,285 100,265 Z" fill="#141414"/>
    <path d="M115,190 C130,175 160,175 168,195 C155,205 125,205 115,190 Z" fill="#262626"/>
    <rect x="125" y="215" width="40" height="10" rx="3" fill="#333333"/>
    <rect x="98" y="260" width="35" height="15" rx="3" fill="#080808"/>

    <!-- Right shoe -->
    <path d="M220,175 C240,150 280,165 280,210 C280,265 270,285 220,285 C215,250 220,190 220,175 Z" fill="#141414"/>
    <path d="M232,195 C240,175 270,175 285,190 C275,205 245,205 232,195 Z" fill="#262626"/>
    <rect x="235" y="215" width="40" height="10" rx="3" fill="#333333"/>
    <rect x="247" y="260" width="35" height="15" rx="3" fill="#080808"/>
  </g>
</svg>
`);

const bootsSvg = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Chelsea Boots in Rich Espresso -->
    <path d="M140,120 L180,120 L185,210 C195,215 250,225 245,260 L140,260 Z" fill="#2e221b"/>
    <!-- Elastic Gusset -->
    <polygon points="155,120 170,120 168,175 158,175" fill="#150f0c"/>
    <!-- Chunky sole & heel -->
    <path d="M135,260 L250,260 L248,276 L135,276 Z" fill="#150f0c"/>
    <rect x="135" y="276" width="35" height="14" fill="#150f0c"/>
  </g>
</svg>
`);

const toteSvg = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 450" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.1"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Minimalist Smooth Black Leather Tote -->
    <!-- Handle -->
    <path d="M160,200 C160,80 240,80 240,200" fill="none" stroke="#1c1c1c" stroke-width="12" stroke-linecap="round"/>
    <!-- Body -->
    <polygon points="120,200 280,200 270,390 130,390" fill="#181818"/>
    <!-- Subtle top rim reflection -->
    <line x1="120" y1="200" x2="280" y2="200" stroke="#333333" stroke-width="3"/>
  </g>
</svg>
`);

export const INITIAL_ITEMS: ClothingItem[] = [
  {
    id: 'item-1',
    name: 'Oversized Gabardine Trench',
    category: 'outerwear',
    subcategory: 'Trench Coat',
    designer: 'Studio Nicholson',
    color: 'Taupe Khaki',
    secondaryColors: ['Beige'],
    seasons: ['spring', 'fall'],
    imageUrl: trenchSvg,
    notes: 'Raglan sleeves with deep back storm flap. Water-repellent bonded cotton gabardine.',
    fabric: '100% Bonded Cotton',
    catalogNumber: 'ARC-CLO-001',
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'item-2',
    name: 'Tailored Poplin Button-Down',
    category: 'tops',
    subcategory: 'Dress Shirt',
    designer: 'Margaret Howell',
    color: 'Chalk White',
    secondaryColors: ['Off-White'],
    seasons: ['spring', 'summer', 'fall', 'winter'],
    imageUrl: shirtSvg,
    notes: 'Crisp poplin with mother of pearl buttons. Structured spread collar.',
    fabric: 'Egyptian Cotton Poplin',
    catalogNumber: 'ARC-CLO-002',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'item-3',
    name: 'Seamless Cashmere Crewneck',
    category: 'tops',
    subcategory: 'Knitwear',
    designer: 'Lemaire',
    color: 'Midnight Navy',
    secondaryColors: ['Dark Blue'],
    seasons: ['fall', 'winter'],
    imageUrl: knitSvg,
    notes: 'Medium-weight 2-ply Mongolian cashmere. Dropped shoulder relaxed silhouette.',
    fabric: '100% Cashmere',
    catalogNumber: 'ARC-CLO-003',
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 86400000 * 9,
  },
  {
    id: 'item-4',
    name: 'Double-Pleated Wool Trousers',
    category: 'bottoms',
    subcategory: 'Trousers',
    designer: 'The Row',
    color: 'Charcoal Grey',
    secondaryColors: ['Black'],
    seasons: ['fall', 'winter', 'spring'],
    imageUrl: trouserSvg,
    notes: 'High-waisted with clean double front pleats and horn buttons. Wide fluid leg drape.',
    fabric: '100% Virgin Wool Flannel',
    catalogNumber: 'ARC-CLO-004',
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'item-5',
    name: 'Selvedge Ecru Straight Jeans',
    category: 'bottoms',
    subcategory: 'Denim',
    designer: 'Our Legacy',
    color: 'Raw Ecru',
    secondaryColors: ['Ivory'],
    seasons: ['spring', 'summer', 'fall'],
    imageUrl: jeansSvg,
    notes: 'Undyed natural cotton with seed specs visible. Custom steel hardware.',
    fabric: '13.5oz Italian Selvedge Denim',
    catalogNumber: 'ARC-CLO-005',
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'item-6',
    name: 'Polished Box-Calf Loafers',
    category: 'shoes',
    subcategory: 'Loafers',
    designer: 'J.M. Weston',
    color: 'Onyx Black',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    imageUrl: loafersSvg,
    notes: 'Handcrafted penny loafer on leather soles. Goodyear welted in Limoges.',
    fabric: 'French Box Calf Leather',
    catalogNumber: 'ARC-CLO-006',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'item-7',
    name: 'Commando-Sole Chelsea Boot',
    category: 'shoes',
    subcategory: 'Boots',
    designer: 'Tricker’s',
    color: 'Espresso Brown',
    secondaryColors: ['Dark Brown'],
    seasons: ['fall', 'winter'],
    imageUrl: bootsSvg,
    notes: 'Vibram commando lug sole with waxed kudu suede uppers. Weather-sealed welt.',
    fabric: 'Waxed Suede & Vibram Rubber',
    catalogNumber: 'ARC-CLO-007',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'item-8',
    name: 'Architectural Box Leather Tote',
    category: 'accessories',
    subcategory: 'Bag',
    designer: 'Jil Sander',
    color: 'Matte Black',
    seasons: ['spring', 'summer', 'fall', 'winter'],
    imageUrl: toteSvg,
    notes: 'Rigid geometry with blind embossed insignia. Sized for 13-inch laptop and sketchbook.',
    fabric: 'Full-Grain Calfskin',
    catalogNumber: 'ARC-CLO-008',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  }
];

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    title: '48 Hours in Tokyo',
    subtitle: 'Autumn Travel Capsule',
    description: 'Minimalist pack list focused on structured tailoring, weather resistance, and walkability.',
    itemIds: ['item-1', 'item-2', 'item-4', 'item-6', 'item-8'],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'col-2',
    title: 'Studio Uniform',
    subtitle: 'Daily High-Rotation',
    description: 'Comfortable natural fibers, relaxed silhouettes, and low visual noise.',
    itemIds: ['item-3', 'item-5', 'item-7', 'item-8'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  }
];

export const INITIAL_OUTFITS: Outfit[] = [
  {
    id: 'outfit-1',
    title: 'Gallery Walk / Rain',
    occasion: 'Exhibition',
    notes: 'Trench buttoned midway, ecru denim cuff over box loafers.',
    slots: {
      topId: 'item-2',
      bottomId: 'item-5',
      outerwearId: 'item-1',
      shoesId: 'item-6',
      accessoryId: 'item-8',
    },
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'outfit-2',
    title: 'Navy Cashmere & Flannel',
    occasion: 'Evening',
    notes: 'Monochrome navy and charcoal tones with chunky Chelsea boots.',
    slots: {
      topId: 'item-3',
      bottomId: 'item-4',
      shoesId: 'item-7',
      accessoryId: 'item-8',
    },
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  }
];

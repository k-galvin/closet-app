# Archival // Wardrobe Curation Engine

A bespoke personal closet management Progressive Web App (PWA) tailored specifically for your iPhone and desktop. Created as a quiet, editorial alternative to mass-market wardrobe apps (like Whering) that clash with minimal and curated aesthetics.

Built directly upon the design system of [Archival](https://github.com/k-galvin/archival) — featuring clean white museum exhibition plates, cobalt `#0047ab` accents, monospace overlines, Heldane-style editorial italics, and an uncompromising focus on your transparent garment photographs.

---

## Design Identity & Heritage

- **Color Foundation**: Stark `#ffffff` base, `#fafafa` surface, and `#1a1a1a` typography.
- **Cobalt Accent**: Signature Archival blue (`#0047ab`) for catalog tags, active underlines, and primary actions.
- **Editorial Typography**: *Heldane / Instrument Serif* italic for designers and collection subtitles; *JetBrains Mono* for catalog numbers (`ARC-CLO-XXX`) and metadata overlines; *Plus Jakarta Sans* for headings.
- **Museum Catalog Structure**: Each garment is exhibited as a specimen on a crisp white plate with subtle drop-shadows that make transparent PNG cutouts pop.

---

## Core Capabilities

### 1. Closet Vault (Inventory & Sorting)
- **High-contrast grid**: 2 columns on iPhone, up to 5 columns on desktop.
- **Categorical & Seasonal filtering**: Filter instantly by Tops, Bottoms, Outerwear, Shoes, Accessories, or One-Piece, as well as Spring/Summer/Fall/Winter.
- **Live Search**: Instant query across item names, designers, fabrics, colors, and catalog numbers.
- **Garment Detail Inspection**: Tap any specimen to view composition, curatorial notes, date registered, and collection inclusions.

### 2. Mix & Match Studio (Outfit Builder)
- **Digital Fitting Room & Mannequin**: Real-time composite preview displaying your selected Outerwear, Top, Bottom, Footwear, and Accessories stacked in true lookbook proportion.
- **Interactive Carousel Strips**: Thumb-scroll or cycle through garments per category with live preview updates.
- **Serendipity Shuffle**: Tap **SHUFFLE** to automatically generate unexpected styling combinations from your wardrobe.
- **Saved Lookbook**: Register composite outfits with titles, occasions (e.g. *Gallery Opening*, *Rainy Studio Uniform*), and styling notes.

### 3. Collections & Trip Packing Capsules
- **Exhibition Capsules**: Create custom collections such as *48 Hours in Tokyo*, *Capsule Wardrobe*, or *Studio Uniform*.
- **Horizontal Specimen Strips**: Mirroring Archival's collections interface, view packed items in a continuous horizontal scroll with single-tap removal or quick-pack drawer.

### 4. Transparent PNG Acquisition
- **Acquisition Protocol**: Single-tap photo upload directly from iPhone Camera or Photo Library.
- **Transparent PNG Support**: Optimized for transparent cutouts (iOS Subject Lift / remove background cutouts) so your clothes look clean without distracting backgrounds.
- **Auto-Cataloging**: Automatically assigns continuous accession numbers (`ARC-CLO-001`, `ARC-CLO-002`, ...).

---

## iPhone Installation Guide

1. Run the app or deploy to Vercel/Netlify.
2. Open the URL in **Safari** on your iPhone.
3. Tap the **Share button** (square with an upward arrow) at the bottom of Safari.
4. Scroll down and tap **"Add to Home Screen"**.
5. Name it **"Closet"** and tap **Add**.
6. The app will appear on your home screen with a custom icon, launching in true edge-to-edge fullscreen mode without browser URL bars.

---

## Data Architecture: Local-First & Supabase

- **Zero-Setup Local-First**: Works 100% out of the box using your browser's **IndexedDB**. Transparent PNGs and images are stored locally with zero upload limits.
- **Optional Supabase Cloud Sync**: If you'd like your images backed up to Supabase Storage and PostgreSQL (the same backend as your Archival project), simply enter your Supabase Project URL and Anon Key in **Config** (or provide them via `.env`).
- **Backup & Restore**: Easily download a full JSON backup of your wardrobe and outfits from the Config menu anytime.

---

## Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

# Solar System Layout + Subtle Edge Labels

## Overview

Redesign the mind map so popular tags act as **suns** (central hubs) with their contacts arranged as **planets** orbiting around them. Edge labels become nearly invisible, only revealing on hover. The AI Connect button will also use this solar layout when auto-arranging.

---

## 1. Edge Labels: Hover-Only Visibility

**File: `src/components/mindmap/MindMapCanvas.tsx**`

- Change the edge label `<div>` to have `opacity: 0` by default with a CSS transition
- On hover, transition to `opacity: 1`
- The edge line itself stays subtly visible (reduce stroke to ~1.5, lower the glow)
- Delete button only appears on hover along with the label

---

## 2. Solar System Auto-Layout

**New file: `src/utils/solarLayout.ts**`

A layout function that:

- Groups contacts by their **primary tag** (first tag in `categoryTags`)
- Counts contacts per tag to determine tag popularity
- Places each tag group as a "solar system":
  - The **sun** position is the center of that group (tags arranged in a grid or circle pattern with generous spacing)
  - **Planets** (contacts) are placed in a circle around their sun, evenly spaced at a radius proportional to the number of contacts
- Contacts with no tags go into a "Default" system
- Returns a map of `contactId -> { x, y }` positions

Layout math:

- Tag suns are arranged in a large circle (or grid) with ~400-500px spacing between them
- Each sun's planets orbit at radius ~120-200px depending on count
- Planet angle = `(index / count) * 2 * PI`, evenly distributed

---

## 3. "Auto Layout" Button in MindMapControls

**File: `src/components/mindmap/MindMapControls.tsx**`

- Add a new button (e.g., "Solar Layout" with a sun icon) next to the AI Connect button
- On click, it calls the solar layout function with current contacts
- Updates each contact's `nodePositionX` / `nodePositionY` via `updateNodePosition` in the store
- Positions are saved to the database, so they persist

---

## 4. Tag "Sun" Nodes (Visual Anchors)

**New file: `src/components/mindmap/TagSunNode.tsx**`

- A new React Flow node type rendered as a glowing circle with the tag name
- Larger than contact nodes (~90px), uses the tag's color with a radial glow
- Non-interactive (no click-to-open drawer), just a visual anchor
- Not saved to the database -- generated on-the-fly from tag data

**File: `src/components/mindmap/MindMapCanvas.tsx**`

- Register `tagSun` as a new node type
- When solar layout is active, generate sun nodes for each tag group and include them in the nodes array
- Sun nodes are not draggable (or optionally draggable, moving their planets with them)

---

## 5. AI Connect Integration

**File: `src/components/mindmap/MindMapControls.tsx**`

- After AI Connect creates connections, automatically trigger the solar layout so the new connections are visually organized

---

## Technical Details

### Solar layout algorithm (`src/utils/solarLayout.ts`)

```text
Input: contacts[]
Output: { contactPositions: Map<id, {x,y}>, sunPositions: Map<tag, {x,y}> }

1. Group contacts by primaryTag
2. Sort groups by size (largest first)
3. Arrange group centers in a circle:
   - centerX/Y for each group = big circle radius ~300px * cos/sin(groupIndex / totalGroups * 2PI)
4. For each group, place contacts in orbit:
   - radius = max(120, contacts.length * 25)
   - each contact at angle = (i / n) * 2PI
   - x = sunX + radius * cos(angle)
   - y = sunY + radius * sin(angle)
```

### Edge label hover CSS approach

- Use a CSS class with `opacity: 0; transition: opacity 0.2s;`
- On the edge label wrapper, add `:hover` -> `opacity: 1`
- The edge line itself uses `strokeOpacity: 0.4` normally, with the full color on path hover via CSS `.react-flow__edge:hover path` selector

### Files changed

- **Modified**: `src/components/mindmap/MindMapCanvas.tsx` -- hover-only labels, sun node type, solar layout integration
- **Modified**: `src/components/mindmap/MindMapControls.tsx` -- solar layout button
- **Modified**: `src/index.css` -- edge hover styles
- **Created**: `src/utils/solarLayout.ts` -- layout algorithm
- **Created**: `src/components/mindmap/TagSunNode.tsx` -- visual sun node for tags

IMPORTANT:-  
Also make it working so that future tags being created are also ai scanned and can create their own sun when reaching a perticular number, 
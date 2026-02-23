

# Fix Solar Layout, Add Toggle, AI Prompt Connect, and CSV Import

## 1. Fix Solar Layout Algorithm

The current layout has issues:
- The `bigRadius` calculation (`totalGroups * 150`) creates overly spread-out layouts
- Sun node positions are offset by -45px but the orbit calculations don't account for this
- No special handling for small group counts (1-2 groups)

**Fix in `src/utils/solarLayout.ts`:**
- Reduce the big radius formula to be more compact: `Math.max(300, totalGroups * 120)`
- Increase orbit radius minimum so planets don't overlap their sun: `Math.max(160, members.length * 35)`
- Add jitter for single-member groups so they don't sit directly on the sun

## 2. Solar Layout Toggle (On/Off)

Currently pressing Solar Layout only activates it -- no way to revert.

**Changes in `src/components/mindmap/MindMapCanvas.tsx`:**
- Store pre-solar positions in a `useRef<Map<string, {x, y}>>` before applying solar layout
- When Solar Layout is pressed again (already active), restore the saved positions and set `solarActive = false`, removing sun nodes
- Pass `solarActive` state to `MindMapControls` so the button label/style can toggle

**Changes in `src/components/mindmap/MindMapControls.tsx`:**
- Accept `solarActive` prop
- Change the Solar Layout button to show "Reset Layout" with a different icon when solar is active
- Clicking it calls a new `onResetLayout` callback

## 3. AI Connect with Custom Prompt

Add a text input next to the AI Connect button so users can guide the AI on how to connect people.

**Changes in `src/components/mindmap/MindMapControls.tsx`:**
- Add a collapsible text input (Textarea) that appears when clicking AI Connect or a dropdown arrow
- The text input has a placeholder like "e.g. Connect people who might collaborate on startups"
- The custom prompt is sent along with the contacts to the edge function

**Changes in `supabase/functions/ai-connections/index.ts`:**
- Accept an optional `userPrompt` field in the request body
- Append the user's prompt to the system message so the AI considers it when suggesting connections

## 4. LinkedIn CSV Import

Add a button in the Map page header (next to "Add Contact") to import contacts from a LinkedIn `connections.csv` file.

**New file: `src/components/contact/CSVImportDialog.tsx`**
- A dialog with a file input that accepts `.csv` files
- Parses the CSV client-side (no external library needed -- use basic string splitting)
- Maps LinkedIn CSV columns: `First Name`, `Last Name`, `URL`, `Email Address`, `Company`, `Position`, `Connected On`
- Shows a preview of parsed contacts with a count
- On confirm, batch-inserts contacts into the database using `addContact` from the store
- Maps fields: name = First + Last, email, company, jobTitle = Position, source = "import", notes = LinkedIn URL, lastContactedAt = Connected On date

**Changes in `src/pages/MapPage.tsx`:**
- Add the CSVImportDialog button next to the existing "Add Contact" button in the header

---

## Technical Details

### Solar layout fix (`src/utils/solarLayout.ts`)
- Tighter radius constants for a more compact, visually pleasing arrangement
- Handle edge case of 1 group (center at 0,0) and 2 groups (side by side)

### Position save/restore for toggle
- `preLayoutPositions` ref stores `Map<string, {x, y}>` captured right before `computeSolarLayout` runs
- On reset: iterate the map, call `updateNodePosition` for each, clear sun nodes

### CSV parsing approach
- Read file as text using `FileReader`
- Split by newlines, handle quoted fields (LinkedIn uses quotes for fields with commas)
- Skip header row, map columns by index based on known LinkedIn CSV format
- Validate: skip rows without a name
- Batch insert using existing `addContact` store method (sequential to avoid race conditions)

### AI prompt integration
- The `userPrompt` string is appended to the system prompt: "Additional user instruction: {userPrompt}"
- If empty/absent, behavior is unchanged from current implementation

### Files to create/modify
- **Modified**: `src/utils/solarLayout.ts` -- fix radius calculations
- **Modified**: `src/components/mindmap/MindMapCanvas.tsx` -- toggle logic with position save/restore
- **Modified**: `src/components/mindmap/MindMapControls.tsx` -- toggle UI, AI prompt textbox
- **Modified**: `supabase/functions/ai-connections/index.ts` -- accept userPrompt
- **Created**: `src/components/contact/CSVImportDialog.tsx` -- CSV import dialog
- **Modified**: `src/pages/MapPage.tsx` -- add CSV import button

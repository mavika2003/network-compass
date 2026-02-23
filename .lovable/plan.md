

# AI-Powered Connection Management, Dynamic Solar Layout, and Contact Merging

## 1. Full AI Connection Management (Add, Remove, Modify)

Currently the AI can only add connections. The user wants to type natural language commands like "remove the connection between Alice and Bob" or "change Alice-Bob to mentor."

**File: `supabase/functions/ai-connections/index.ts`**

Expand the AI tool schema to return three action types instead of just additions:
- `add` -- create a new connection (current behavior)
- `remove` -- delete an existing connection
- `modify` -- change the relationship type of an existing connection

The tool function becomes `manage_connections` with an `actions` array where each action has a `type` field ("add", "remove", "modify"). For remove/modify, the AI references existing connection pairs. The existing connections list (with IDs) is sent to the AI so it can reference them.

**File: `src/components/mindmap/MindMapControls.tsx`**

Update `handleAIConnect` to process all three action types:
- `add`: call `addConnection` (existing)
- `remove`: find matching connection ID, call `deleteConnection`
- `modify`: call `deleteConnection` then `addConnection` with new type

Update the placeholder text to reflect broader capabilities: "e.g. Remove connection between Alice and Bob, or connect all Tech people"

**File: `src/stores/contactStore.ts`**

Add an `updateConnection` method that updates `relationship_type` in the DB and local state, so modify doesn't require delete+add.

## 2. Bigger, Dynamic Solar Layout Suns

The suns should scale based on the number of contacts in each tag group, and automatically appear whenever Solar Layout is pressed (already works, but sizes should be dynamic).

**File: `src/components/mindmap/TagSunNode.tsx`**

Make the sun size dynamic based on `contactCount`:
- Base size: 140px for 1-3 contacts
- Scale up: +20px per additional 3 contacts, capped at 220px
- The core sphere, glow rings, and rotating ring all scale proportionally
- Larger groups get more prominent glow effects

**File: `src/components/mindmap/MindMapCanvas.tsx`**

Update `buildSunNodes` to pass size to the sun node and adjust position offset dynamically based on calculated size (currently hardcoded to -70).

**File: `src/utils/solarLayout.ts`**

Scale orbit radius more aggressively for larger groups so planets don't overlap the bigger sun.

## 3. Reactive Solar Layout (Works with Add/Remove)

Currently the solar layout is a one-time snapshot. If a connection is added or removed, the layout doesn't update.

**File: `src/components/mindmap/MindMapCanvas.tsx`**

When `solarActive` is true and contacts or connections change, automatically re-run `computeSolarLayout` and update sun positions. Add a `useEffect` that watches `contacts` and `connections` while `solarActive` is true, and re-applies the layout (without overwriting `preLayoutPositions` -- only save those on the initial toggle).

## 4. AI-Powered Contact Merge with Undo

Allow AI to identify duplicate contacts (e.g., "Columbia" and "Columbia University") and merge them, with an undo/redo stack.

**New file: `src/components/mindmap/MergeContactsDialog.tsx`**

A dialog triggered from MindMapControls with:
- An "AI Merge" button that calls a new edge function to find duplicates
- Shows a list of suggested merges with checkboxes (e.g., "Merge 'Columbia' into 'Columbia University'")
- User confirms which merges to apply
- After merging, a toast appears with an "Undo" button
- Undo restores the deleted contact and its connections from a local cache

**New file: `supabase/functions/ai-merge/index.ts`**

A new edge function that:
- Receives the full contact list
- Uses AI to identify likely duplicates based on name similarity, company, email
- Returns pairs with a `keepId` (the contact to keep) and `mergeId` (the contact to absorb)
- Includes a `reason` for each suggestion

**File: `src/stores/contactStore.ts`**

Add a `mergeContacts` method:
- Takes `keepId` and `mergeId`
- Merges data: combines tags, keeps non-null fields from both (prefer keepId)
- Reassigns all connections from mergeId to keepId
- Deletes mergeId contact
- Returns the "undo payload" (the deleted contact data + its connections)

Add an `undoMerge` method:
- Takes the undo payload
- Re-creates the deleted contact
- Restores its connections
- Removes any duplicate connections that were reassigned

**File: `src/components/mindmap/MindMapControls.tsx`**

Add a "Merge Duplicates" button that opens the MergeContactsDialog.

---

## Technical Details

### AI connection management tool schema
```json
{
  "name": "manage_connections",
  "parameters": {
    "properties": {
      "actions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": { "type": "string", "enum": ["add", "remove", "modify"] },
            "contactAId": { "type": "string" },
            "contactBId": { "type": "string" },
            "relationshipType": { "type": "string", "enum": ["friend", "colleague", "mutual", "mentor"] },
            "reason": { "type": "string" }
          }
        }
      }
    }
  }
}
```

### Existing connections sent to AI (for remove/modify)
```json
[
  { "id": "...", "contactAName": "Alice", "contactBName": "Bob", "type": "friend" }
]
```
This lets the AI match by name when the user says "remove connection between Alice and Bob."

### Dynamic sun sizing formula
```text
size = Math.min(220, 140 + Math.floor(contactCount / 3) * 20)
```

### Merge undo stack
- Store last N merge operations in component state (not persisted)
- Each entry: `{ deletedContact: Contact, deletedConnections: ConnectionData[], reassignedConnections: { id, oldContactId }[] }`
- Toast with "Undo" button stays for 10 seconds
- Clicking Undo calls `undoMerge` which re-inserts the contact and restores connections

### Files to create/modify
- **Modified**: `supabase/functions/ai-connections/index.ts` -- full CRUD actions
- **Created**: `supabase/functions/ai-merge/index.ts` -- duplicate detection
- **Created**: `src/components/mindmap/MergeContactsDialog.tsx` -- merge UI with undo
- **Modified**: `src/components/mindmap/MindMapControls.tsx` -- merge button, updated prompt placeholder
- **Modified**: `src/components/mindmap/MindMapCanvas.tsx` -- reactive solar layout
- **Modified**: `src/components/mindmap/TagSunNode.tsx` -- dynamic sizing
- **Modified**: `src/utils/solarLayout.ts` -- scaled orbit radius
- **Modified**: `src/stores/contactStore.ts` -- mergeContacts, undoMerge, updateConnection


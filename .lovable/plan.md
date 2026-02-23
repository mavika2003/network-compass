

# Huge Sun Bubbles, Tag Merging, AI Auto-Tagging, and Cleanup

## Overview
Six changes: (1) massively bigger sun bubbles, (2) merge duplicates for tags too, (3-4) AI auto-tagging for CSV imports and manual contact saves, (5) remove forced "mutual" connections, (6) remove "Default" tag fallback.

---

## 1. Huge Bubbles Around Sun Nodes

**Files: `src/components/mindmap/TagSunNode.tsx`, `src/utils/solarLayout.ts`, `src/index.css`**

- Increase `getSunSize` formula: `Math.min(320, 180 + Math.floor(contactCount / 2) * 30)` -- starts at 180px, grows faster, caps at 320px
- Add a third outermost translucent bubble ring (glassmorphic) at `size + 60` pixels with a soft radial gradient fill (not just a border) and backdrop-blur effect
- Increase glow layers to be larger (extend 40-50px beyond core)
- Add a subtle breathing animation (scale 1.0 to 1.03) via new CSS keyframe `sun-breathe`
- In `solarLayout.ts`, increase `bigRadius` and `orbitRadius` to accommodate larger suns: `orbitRadius = Math.max(sunSize / 2 + 120, members.length * 50)`

## 2. Merge Duplicates for Tags (Not Just Contacts)

**Files: `supabase/functions/ai-merge/index.ts`, `src/components/mindmap/MergeContactsDialog.tsx`, `src/stores/contactStore.ts`**

Expand the AI merge system to also detect duplicate tags:

- **Edge function**: Add tags list to the request body. Expand the AI prompt to also look for duplicate/similar tags (e.g., "Tech" vs "Technology", "Work" vs "Job"). Return a new `tagMerges` array alongside `merges` with `{ keepTag, mergeTag, reason }`.
- **Store**: Add `mergeTag(keepTag: string, mergeTag: string, userId: string)` method that:
  - Finds all contacts with `mergeTag` in their `categoryTags`
  - Replaces `mergeTag` with `keepTag` in each contact's tags
  - Updates the database
- **Dialog**: Show tag merge suggestions in a separate section below contact merges. Apply tag merges when confirmed. Include in undo payload.

## 3. AI Auto-Tagging for CSV Import

**Files: `supabase/functions/ai-extract/index.ts` (reuse), `src/components/contact/CSVImportDialog.tsx`**

- Create a new edge function `supabase/functions/ai-tag-contacts/index.ts` that accepts a batch of contacts (name, company, jobTitle, email) and existing tags, then returns suggested tags and relationship strength for each contact
- In `CSVImportDialog.tsx`, after importing all contacts:
  1. Collect the newly imported contacts
  2. Call `ai-tag-contacts` with the batch (send all at once for efficiency)
  3. Update each contact's `categoryTags` and `relationshipStrength` with AI suggestions
  4. Show a toast: "AI tagged N contacts"

## 4. AI Auto-Tagging When Manually Saving a Contact

**Files: `src/components/contact/ContactForm.tsx`**

- After `addContact` succeeds, if `categoryTags` is empty (user didn't pick any):
  - Call `ai-tag-contacts` with just this one contact
  - Update the contact's tags via `updateContact`
- Remove the `['Default']` fallback from `handleSubmit` (line 38): instead of forcing `Default`, leave tags empty and let AI fill them

## 5. New Edge Function: `ai-tag-contacts`

**File: `supabase/functions/ai-tag-contacts/index.ts`** (new)

- Accepts `{ contacts: [{ id, name, company, jobTitle, email, notes }], existingTags: string[] }`
- System prompt: "Given contact details, suggest 1-3 category tags per contact from the existing tags list. Only create new tags if no existing tag fits. Also estimate relationship strength 0-100."
- Returns `{ results: [{ id, suggestedTags: string[], relationshipStrength: number }] }`
- Uses batch processing -- handles up to 200 contacts in a single call

## 6. Remove Forced "Mutual" Connections

**Files: `src/stores/contactStore.ts`, `src/components/contact/ContactForm.tsx`**

- In `addContact` in the store: do NOT create any automatic connections. Currently no auto-connections are created, but the `connectionType` dialog defaults to "mutual". This is fine -- the dialog only appears when users manually drag to connect.
- The real issue is in the `ai-connections` edge function: when no user prompt is given, the AI suggests connections with type "mutual" by default. Fix: update the AI prompt to only suggest connections when there's genuine reason (shared company, shared tags, etc.), and never default to "mutual" type -- instead pick the most appropriate type.

**File: `supabase/functions/ai-connections/index.ts`**
- Update the default system prompt: add "Do NOT use 'mutual' as a catch-all. Only suggest 'mutual' when contacts have a genuine known mutual relationship. Prefer 'colleague' for same-company, 'friend' for same social tags."

## 7. Remove "Default" Tag

**Files: `src/types/index.ts`, `src/components/contact/ContactForm.tsx`**

- Remove the `Default` entry from `CATEGORY_COLORS` -- contacts will simply have no tag color until AI assigns one
- `ContactForm.tsx`: remove `categoryTags: form.categoryTags.length ? form.categoryTags : ['Default']` and just pass `categoryTags: form.categoryTags`
- `CSVImportDialog.tsx`: already passes `categoryTags: []` -- no change needed
- All components that reference `Default` as fallback (ContactNode, TagSunNode, MindMapCanvas, solarLayout) will use a neutral gray fallback when tag is not in `CATEGORY_COLORS`

---

## Technical Details

### ai-tag-contacts edge function schema
```json
{
  "name": "tag_contacts",
  "parameters": {
    "properties": {
      "results": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "suggestedTags": { "type": "array", "items": { "type": "string" } },
            "relationshipStrength": { "type": "number" }
          }
        }
      }
    }
  }
}
```

### Tag merge store method
```text
mergeTag(keepTag, mergeTag, userId):
  1. Find all contacts where categoryTags includes mergeTag
  2. For each: replace mergeTag with keepTag (deduplicate)
  3. Update each contact in DB
  4. Return list of affected contact IDs for undo
```

### Sun size formula change
```text
OLD: Math.min(220, 140 + Math.floor(contactCount / 3) * 20)
NEW: Math.min(320, 180 + Math.floor(contactCount / 2) * 30)
```

### CSV import flow with AI tagging
```text
1. Parse CSV -> show preview
2. User clicks Import
3. Insert contacts with empty tags
4. Batch call ai-tag-contacts with all imported contacts + user's existing tags
5. Update each contact with AI-suggested tags
6. Toast: "Imported N contacts, AI tagged N"
```

### Files to create/modify
- **Created**: `supabase/functions/ai-tag-contacts/index.ts` -- batch AI tagging
- **Modified**: `src/components/mindmap/TagSunNode.tsx` -- bigger bubbles (320px max)
- **Modified**: `src/utils/solarLayout.ts` -- larger orbit radii
- **Modified**: `src/index.css` -- breathing animation keyframe
- **Modified**: `supabase/functions/ai-merge/index.ts` -- tag deduplication
- **Modified**: `src/components/mindmap/MergeContactsDialog.tsx` -- tag merge UI
- **Modified**: `src/stores/contactStore.ts` -- mergeTag method
- **Modified**: `src/components/contact/CSVImportDialog.tsx` -- AI tagging after import
- **Modified**: `src/components/contact/ContactForm.tsx` -- AI tagging on save, remove Default fallback
- **Modified**: `supabase/functions/ai-connections/index.ts` -- stop forcing mutual
- **Modified**: `src/types/index.ts` -- remove Default from CATEGORY_COLORS


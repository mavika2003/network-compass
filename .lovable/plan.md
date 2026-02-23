

# Bigger Sun Nodes, Smarter AI Connect, and Persistent Positions

## 1. Bigger, More Visually Interesting Sun Nodes

**File: `src/components/mindmap/TagSunNode.tsx`**

Current sun nodes are 90px with just text -- too small and plain.

Changes:
- Increase size to **140px** outer / **110px** core
- Add multiple animated glow rings for a real "sun" effect (2-3 concentric pulsing rings at different speeds)
- Add an emoji or icon based on tag name for visual distinction (e.g., a small icon inside)
- Larger, bolder text (14px tag name, 11px count with "contacts" label)
- Stronger box-shadow and radial gradient layers for depth
- Add a subtle rotating ring animation using CSS keyframes

**File: `src/index.css`** -- add `@keyframes sun-rotate` for a slow-spinning outer ring effect

**File: `src/components/mindmap/MindMapCanvas.tsx`** -- update sun node position offset from `-45` to `-70` to account for larger size

## 2. AI Connect: Prompt-Only vs Full Auto

**File: `supabase/functions/ai-connections/index.ts`**

When the user provides a prompt, the AI should ONLY create connections matching that specific instruction -- not general ones.

Changes to the system prompt logic:
- **If `userPrompt` is provided**: Replace the default system prompt with a focused one: "ONLY suggest connections that match this specific criteria: {userPrompt}. Do NOT suggest general connections."
- **If `userPrompt` is empty/absent**: Keep the current behavior -- full AI analysis suggesting up to 10 connections based on tags, companies, and roles

## 3. Persistent Contact Positions (Survive Reload)

The current issue: `updateNodePosition` in the store fires the database update without `await`, so it can fail silently. Also, new contacts use `Math.random()` as fallback in `buildNodes`, which generates different positions each render.

**File: `src/stores/contactStore.ts`**

Changes:
- Make the Supabase update in `updateNodePosition` use `await` (convert to async) so position saves are reliable
- Remove the `Math.random()` fallback in the store -- positions should only be set once during `addContact`

**File: `src/components/mindmap/MindMapCanvas.tsx`**

Changes:
- In `buildNodes`, replace `Math.random()` fallback with a deterministic fallback based on contact index (e.g., grid layout: `index * 150` for x, row-based for y) so contacts without saved positions still get consistent placement
- This ensures that even if a contact somehow has null positions, they won't jump around on reload

---

## Technical Details

### Sun node visual design
- Outer rotating ring: 140px, border with dashed stroke, `animation: sun-rotate 20s linear infinite`
- Middle glow: 130px, radial gradient with tag color at 30% opacity, `animate-pulse` at different duration
- Core sphere: 110px, multi-stop radial gradient for 3D depth effect (highlight at 30% 30%, tag color, darker shade)
- Tag name: 14px bold white with text shadow
- Count badge: small pill below the name showing "N contacts"

### AI prompt logic change
```text
IF userPrompt is non-empty:
  system = "You are a relationship analyst. ONLY suggest connections that match
            this specific user request: '{userPrompt}'. Do not suggest any
            connections that don't directly relate to this instruction.
            Return up to 10 suggestions."
ELSE:
  system = (current default prompt -- full AI analysis)
```

### Position persistence fix
- `updateNodePosition` becomes async with awaited Supabase call
- `buildNodes` fallback changes from `Math.random() * 600 - 300` to `(index % 10) * 150 - 750` for x and `Math.floor(index / 10) * 150 - 300` for y

### Files changed
- **Modified**: `src/components/mindmap/TagSunNode.tsx` -- larger, more visual sun nodes
- **Modified**: `src/components/mindmap/MindMapCanvas.tsx` -- adjusted sun offset, deterministic fallback positions
- **Modified**: `src/index.css` -- sun rotation keyframes
- **Modified**: `supabase/functions/ai-connections/index.ts` -- prompt-only vs full auto logic
- **Modified**: `src/stores/contactStore.ts` -- await position saves


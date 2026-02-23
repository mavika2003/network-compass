
# Connect Contacts with Lines on the Mind Map

## Overview
Add the ability for users to visually connect two contacts on the mind map by drawing lines (edges) between them. This makes relationships between people immediately visible -- e.g., "Alice and Bob know each other from work."

## How It Works

**Creating a connection:**
1. User clicks a "Link" or chain icon on a contact node (or in the contact drawer)
2. The map enters "linking mode" -- the first node is highlighted
3. User clicks a second node to complete the connection
4. A labeled edge appears between the two contacts, saved to the database

**Connection labels:**
- Each edge can have a relationship type: Friend, Colleague, Mutual, Mentor (matching the existing `relationship_type` column in the `connections` table)
- A small popover lets the user pick the type when creating the connection
- Edge labels are shown on hover for a clean look

**Deleting a connection:**
- Right-clicking or clicking an edge label shows a delete option
- Or from the ContactDrawer, a "Connections" section lists linked contacts with a remove button

**Edge styling:**
- Edges are color-coded by relationship type (e.g., blue for Colleague, pink for Friend)
- Animated dashes for high-priority connections (both contacts have relationship strength above 80)

---

## Technical Details

### 1. Contact Store (`src/stores/contactStore.ts`)
- Add `addConnection(userId, contactAId, contactBId, relationshipType)` -- inserts into `connections` table and updates local state
- Add `deleteConnection(connectionId)` -- deletes from DB and local state
- Add `linkingContactId: string | null` and `setLinkingContact(id | null)` for the linking mode state

### 2. MindMapCanvas (`src/components/mindmap/MindMapCanvas.tsx`)
- Add `onConnect` handler from React Flow to detect when a user drags from one node handle to another (native React Flow edge creation)
- Show a relationship type picker dialog after the connection is made
- Update `buildEdges` to style edges based on `relationshipType` with colors and optional labels
- Add `onEdgeClick` to allow selecting/deleting edges

### 3. ContactNode (`src/components/mindmap/ContactNode.tsx`)
- Make the existing invisible `Handle` components slightly visible on hover so users know they can drag to connect
- Add a small link icon button that activates "linking mode" as an alternative to drag-connecting

### 4. New Component: `ConnectionTypeDialog` (`src/components/mindmap/ConnectionTypeDialog.tsx`)
- A small dialog/popover that appears after two nodes are connected
- Lets user pick: Friend, Colleague, Mutual, Mentor
- Confirms and saves the connection

### 5. ContactDrawer (`src/components/contact/ContactDrawer.tsx`)
- Add a "Connections" section showing all contacts linked to the selected contact
- Each item shows the connected person's name, relationship type, and a delete button

### 6. Edge Styling
- Friend: pink stroke
- Colleague: blue stroke  
- Mutual: gray stroke (default)
- Mentor: purple stroke
- Edges show the relationship label on hover via React Flow's `EdgeLabelRenderer`

### No database changes needed
The existing `connections` table already has `contact_a_id`, `contact_b_id`, and `relationship_type` columns -- everything needed is already in place.

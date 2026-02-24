

# Inter-User Functionality: Cross-User Feed, User Search & Connect, Shared Contacts

## Overview

This plan adds three inter-user features to NetMind: (1) users can find and connect with each other, (2) posts become visible across users based on tag overlap, and (3) users can share specific contacts or tag groups with other users.

---

## 1. User Connections (Follow/Connect System)

### New table: `user_connections`

Tracks mutual connections between NetMind users.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| requester_id | uuid | The user who sent the request |
| responder_id | uuid | The user receiving the request |
| status | text | 'pending', 'accepted', 'rejected' |
| created_at | timestamptz | Default now() |

**RLS policies:**
- SELECT: Users can see rows where they are requester or responder
- INSERT: Users can only insert rows where requester_id = auth.uid()
- UPDATE: Only responder can update (accept/reject)
- DELETE: Either party can delete (unfriend)

### New table: `shared_tags`

Maps which tags a user has chosen to share with a connected user.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| owner_id | uuid | The user sharing tags |
| shared_with_id | uuid | The connected user |
| tag_name | text | The tag being shared |
| created_at | timestamptz | Default now() |

**RLS:**
- SELECT: owner or shared_with can see
- INSERT/DELETE: only owner_id = auth.uid()

### Profile visibility

Add a new RLS policy on `profiles` to allow any authenticated user to SELECT profiles (needed for user search). Profiles only contain name, username, avatar, bio -- no sensitive data.

---

## 2. User Search & Connect Page

### File: `src/pages/NetworkPage.tsx` (new)

A new page at route `/network` with three tabs:

- **Discover**: Search for users by username or name. Shows profile cards with "Connect" button.
- **Requests**: Shows incoming pending requests with Accept/Reject buttons, and outgoing pending requests.
- **Connected**: Shows all accepted connections with option to manage shared tags or disconnect.

### File: `src/components/layout/Sidebar.tsx` (modified)

Add a "Network" nav item with the `Users` icon between Feed and Search.

### File: `src/App.tsx` (modified)

Add route `/network` pointing to `NetworkPage`.

---

## 3. Cross-User Feed

### How it works

When User A creates a post with `visibility_tags: ["Tech", "Friends"]`, it should be visible to any connected User B who has those tags shared with them.

The visibility logic:
1. User A and User B must be connected (status = 'accepted' in `user_connections`)
2. User A must have shared at least one of the post's `visibility_tags` with User B (via `shared_tags`)
3. The post's `visibility_tags` must overlap with User A's shared tags for User B

### RLS policy change on `posts`

Replace the current SELECT policy with a broader one using a security definer function:

```text
can_view_post(user_id, post_id):
  -- Own posts: always visible
  -- Other users' posts: visible if
  --   1. user_connections exists with status='accepted' between viewer and post author
  --   2. shared_tags overlap with post's visibility_tags
```

A `security definer` function avoids infinite recursion and keeps the logic efficient.

### File: `src/pages/FeedPage.tsx` (modified)

- Add a toggle: "My Posts" / "Network Feed"
- "Network Feed" calls a new database function `get_visible_posts(viewer_id)` that returns posts from connected users where shared tags overlap with visibility tags
- Each post shows the author's name and avatar (fetched from profiles)

---

## 4. Shared Contacts/Tags Management

### File: `src/components/network/ShareTagsDialog.tsx` (new)

When viewing a connected user, a "Manage Shared Tags" button opens a dialog showing:
- All of the current user's tags with checkboxes
- Checked tags are shared with that connected user
- Toggling inserts/deletes from `shared_tags` table

This controls both:
- Which of your posts they can see (posts with those visibility tags)
- Which of your contacts they can browse (contacts tagged with shared tags)

### Shared contacts visibility

Create a `security definer` function `get_shared_contacts(viewer_id, owner_id)` that returns contacts from owner where the contact's `category_tags` overlap with tags shared between owner and viewer. This is called from the connected user's profile view.

### File: `src/pages/NetworkPage.tsx`

In the "Connected" tab, clicking on a connected user shows:
- Their shared contacts (contacts tagged with tags they've shared with you)
- Read-only view -- you can see name, company, tags but cannot edit

---

## 5. Database Function: `get_visible_posts`

```text
CREATE FUNCTION get_visible_posts(viewer_id uuid)
RETURNS TABLE(...)
SECURITY DEFINER
AS:
  SELECT posts.*, profiles.name as author_name, profiles.avatar_url as author_avatar
  FROM posts
  JOIN user_connections uc ON (
    (uc.requester_id = posts.user_id AND uc.responder_id = viewer_id)
    OR (uc.responder_id = posts.user_id AND uc.requester_id = viewer_id)
  ) AND uc.status = 'accepted'
  JOIN shared_tags st ON st.owner_id = posts.user_id
    AND st.shared_with_id = viewer_id
    AND st.tag_name = ANY(posts.visibility_tags)
  WHERE posts.user_id != viewer_id
  UNION ALL
  SELECT posts.*, profiles.name, profiles.avatar_url
  FROM posts JOIN profiles ON profiles.id = posts.user_id
  WHERE posts.user_id = viewer_id
  ORDER BY created_at DESC
```

---

## Technical Details

### Migration SQL summary

1. Create `user_connections` table with RLS
2. Create `shared_tags` table with RLS
3. Add permissive SELECT policy on `profiles` for all authenticated users
4. Create `get_visible_posts` security definer function
5. Create `get_shared_contacts` security definer function
6. Enable realtime on `user_connections` for live request notifications

### Security definer functions needed

Two functions to avoid RLS recursion:
- `get_visible_posts(viewer_id uuid)` -- returns posts visible to viewer
- `get_shared_contacts(viewer_id uuid, owner_id uuid)` -- returns contacts shared with viewer

### RLS approach for `user_connections`

```text
SELECT: auth.uid() = requester_id OR auth.uid() = responder_id
INSERT: auth.uid() = requester_id
UPDATE: auth.uid() = responder_id (only responder can accept/reject)
DELETE: auth.uid() = requester_id OR auth.uid() = responder_id
```

### New route

```text
/network -> NetworkPage (3 tabs: Discover, Requests, Connected)
```

### Files to create/modify

- **Created**: `src/pages/NetworkPage.tsx` -- user search, requests, connections
- **Created**: `src/components/network/ShareTagsDialog.tsx` -- manage shared tags
- **Created**: `src/components/network/UserCard.tsx` -- profile card for search results
- **Created**: `src/components/network/SharedContactsView.tsx` -- read-only contact list
- **Modified**: `src/App.tsx` -- add /network route
- **Modified**: `src/components/layout/Sidebar.tsx` -- add Network nav item
- **Modified**: `src/pages/FeedPage.tsx` -- add network feed tab with cross-user posts
- **Database migration**: `user_connections`, `shared_tags` tables + RLS + functions


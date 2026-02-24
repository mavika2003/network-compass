
-- 1. user_connections table
CREATE TABLE public.user_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  responder_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_connections_status_check CHECK (status IN ('pending', 'accepted', 'rejected')),
  CONSTRAINT user_connections_no_self CHECK (requester_id != responder_id)
);

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON public.user_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = responder_id);

CREATE POLICY "Users can create connection requests"
  ON public.user_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Responder can update connection"
  ON public.user_connections FOR UPDATE
  USING (auth.uid() = responder_id);

CREATE POLICY "Either party can delete connection"
  ON public.user_connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = responder_id);

-- Unique constraint to prevent duplicate requests
CREATE UNIQUE INDEX idx_user_connections_pair
  ON public.user_connections (LEAST(requester_id, responder_id), GREATEST(requester_id, responder_id));

-- 2. shared_tags table
CREATE TABLE public.shared_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  shared_with_id uuid NOT NULL,
  tag_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shared tags involving them"
  ON public.shared_tags FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);

CREATE POLICY "Owners can insert shared tags"
  ON public.shared_tags FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete shared tags"
  ON public.shared_tags FOR DELETE
  USING (auth.uid() = owner_id);

-- Unique constraint
CREATE UNIQUE INDEX idx_shared_tags_unique
  ON public.shared_tags (owner_id, shared_with_id, tag_name);

-- 3. Allow all authenticated users to SELECT profiles (for user search/discovery)
-- The existing policies are RESTRICTIVE, so we add a PERMISSIVE one
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 4. Security definer function: get_visible_posts
CREATE OR REPLACE FUNCTION public.get_visible_posts(viewer_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  content text,
  image_url text,
  post_type text,
  location text,
  visibility_tags text[],
  expires_at timestamptz,
  created_at timestamptz,
  author_name text,
  author_avatar text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Other users' posts visible via shared tags
  SELECT DISTINCT p.id, p.user_id, p.content, p.image_url, p.post_type, p.location,
         p.visibility_tags, p.expires_at, p.created_at,
         pr.name as author_name, pr.avatar_url as author_avatar
  FROM posts p
  JOIN profiles pr ON pr.id = p.user_id
  JOIN user_connections uc ON (
    (uc.requester_id = p.user_id AND uc.responder_id = viewer_id)
    OR (uc.responder_id = p.user_id AND uc.requester_id = viewer_id)
  ) AND uc.status = 'accepted'
  JOIN shared_tags st ON st.owner_id = p.user_id
    AND st.shared_with_id = viewer_id
    AND st.tag_name = ANY(p.visibility_tags)
  WHERE p.user_id != viewer_id

  UNION ALL

  -- Own posts always visible
  SELECT p.id, p.user_id, p.content, p.image_url, p.post_type, p.location,
         p.visibility_tags, p.expires_at, p.created_at,
         pr.name as author_name, pr.avatar_url as author_avatar
  FROM posts p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE p.user_id = viewer_id

  ORDER BY created_at DESC;
$$;

-- 5. Security definer function: get_shared_contacts
CREATE OR REPLACE FUNCTION public.get_shared_contacts(viewer_id uuid, owner_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  company text,
  job_title text,
  email text,
  category_tags text[],
  avatar_url text,
  location text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.id, c.name, c.company, c.job_title, c.email,
         c.category_tags, c.avatar_url, c.location
  FROM contacts c
  JOIN shared_tags st ON st.owner_id = owner_id
    AND st.shared_with_id = viewer_id
    AND st.tag_name = ANY(c.category_tags)
  JOIN user_connections uc ON (
    (uc.requester_id = owner_id AND uc.responder_id = viewer_id)
    OR (uc.responder_id = owner_id AND uc.requester_id = viewer_id)
  ) AND uc.status = 'accepted'
  WHERE c.user_id = owner_id;
$$;

-- 6. Enable realtime on user_connections
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_connections;

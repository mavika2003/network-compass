
-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  job_title TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  company TEXT,
  job_title TEXT,
  location TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  gender TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  category_tags TEXT[] DEFAULT '{}',
  relationship_strength INT DEFAULT 50 CHECK (relationship_strength BETWEEN 0 AND 100),
  node_position_x FLOAT,
  node_position_y FLOAT,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- ============================================================
-- CONNECTIONS
-- ============================================================
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_a_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  contact_b_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'mutual',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REMINDERS
-- ============================================================
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  message TEXT,
  due_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  post_type TEXT DEFAULT 'status',
  location TEXT,
  visibility_tags TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INTERACTION LOG
-- ============================================================
CREATE TABLE public.interaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Profiles: users can read and update their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Contacts: full CRUD on own data
CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own contacts" ON public.contacts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE USING (user_id = auth.uid());

-- Tags: full CRUD on own data
CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own tags" ON public.tags FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (user_id = auth.uid());

-- Connections: full CRUD on own data
CREATE POLICY "Users can view own connections" ON public.connections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own connections" ON public.connections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own connections" ON public.connections FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own connections" ON public.connections FOR DELETE USING (user_id = auth.uid());

-- Reminders: full CRUD on own data
CREATE POLICY "Users can view own reminders" ON public.reminders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own reminders" ON public.reminders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reminders" ON public.reminders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own reminders" ON public.reminders FOR DELETE USING (user_id = auth.uid());

-- Posts: full CRUD on own data
CREATE POLICY "Users can view own posts" ON public.posts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (user_id = auth.uid());

-- Interaction log: full CRUD on own data
CREATE POLICY "Users can view own interactions" ON public.interaction_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own interactions" ON public.interaction_log FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own interactions" ON public.interaction_log FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;

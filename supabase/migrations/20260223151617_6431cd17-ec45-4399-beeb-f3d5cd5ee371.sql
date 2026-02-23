
-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE

-- contacts
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;

CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own contacts" ON public.contacts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE USING (user_id = auth.uid());

-- connections
DROP POLICY IF EXISTS "Users can view own connections" ON public.connections;
DROP POLICY IF EXISTS "Users can create own connections" ON public.connections;
DROP POLICY IF EXISTS "Users can update own connections" ON public.connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON public.connections;

CREATE POLICY "Users can view own connections" ON public.connections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own connections" ON public.connections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own connections" ON public.connections FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own connections" ON public.connections FOR DELETE USING (user_id = auth.uid());

-- posts
DROP POLICY IF EXISTS "Users can view own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

CREATE POLICY "Users can view own posts" ON public.posts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (user_id = auth.uid());

-- reminders
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can create own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON public.reminders;

CREATE POLICY "Users can view own reminders" ON public.reminders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own reminders" ON public.reminders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reminders" ON public.reminders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own reminders" ON public.reminders FOR DELETE USING (user_id = auth.uid());

-- tags
DROP POLICY IF EXISTS "Users can view own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can create own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON public.tags;

CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own tags" ON public.tags FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (user_id = auth.uid());

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- interaction_log
DROP POLICY IF EXISTS "Users can view own interactions" ON public.interaction_log;
DROP POLICY IF EXISTS "Users can create own interactions" ON public.interaction_log;
DROP POLICY IF EXISTS "Users can delete own interactions" ON public.interaction_log;

CREATE POLICY "Users can view own interactions" ON public.interaction_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own interactions" ON public.interaction_log FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own interactions" ON public.interaction_log FOR DELETE USING (user_id = auth.uid());

-- Create storage bucket for contact photos
INSERT INTO storage.buckets (id, name, public) VALUES ('contact-photos', 'contact-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload contact photos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contact-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own contact photos" ON storage.objects FOR UPDATE
USING (bucket_id = 'contact-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own contact photos" ON storage.objects FOR DELETE
USING (bucket_id = 'contact-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Contact photos are publicly viewable" ON storage.objects FOR SELECT
USING (bucket_id = 'contact-photos');

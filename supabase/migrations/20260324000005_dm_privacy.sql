-- DM requests table for profile_required and full_access modes
CREATE TABLE IF NOT EXISTS public.dm_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  shared_profile jsonb DEFAULT '{}',
  shared_albums jsonb DEFAULT '{}',
  message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.dm_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm_requests_sender" ON public.dm_requests;
CREATE POLICY "dm_requests_sender" ON public.dm_requests FOR ALL USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Saved first messages table
CREATE TABLE IF NOT EXISTS public.saved_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  text text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_saved_messages" ON public.saved_messages;
CREATE POLICY "own_saved_messages" ON public.saved_messages FOR ALL USING (user_id = auth.uid());

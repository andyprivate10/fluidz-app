-- === BATCH 3: Admin config seed + RLS admin write + Storage buckets ===

-- 1. RLS: allow admins to write to admin_config
DO $$ BEGIN
CREATE POLICY "Admins can manage admin_config" ON admin_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Seed kinks (skip duplicates)
INSERT INTO admin_config (type, slug, label, category, sort_order, active) VALUES
  ('kink', 'dominant', 'Dominant', 'Roles', 1, true),
  ('kink', 'soumis', 'Soumis', 'Roles', 2, true),
  ('kink', 'sm_leger', 'SM léger', 'SM', 3, true),
  ('kink', 'sm_hard', 'SM hard', 'SM', 4, true),
  ('kink', 'fist', 'Fist', 'Pratiques', 5, true),
  ('kink', 'group', 'Group', 'Pratiques', 6, true),
  ('kink', 'voyeur', 'Voyeur', 'Fetichisme', 7, true),
  ('kink', 'exhib', 'Exhib', 'Fetichisme', 8, true),
  ('kink', 'fetichisme', 'Fétichisme', 'Fetichisme', 9, true),
  ('kink', 'jeux_de_role', 'Jeux de rôle', 'Autre', 10, true),
  ('kink', 'bears_welcome', 'Bears welcome', 'Autre', 11, true),
  ('kink', 'bareback', 'Bareback', 'Pratiques', 12, true)
ON CONFLICT (category, slug) DO NOTHING;

-- 3. Seed morphologies
INSERT INTO admin_config (type, slug, label, sort_order, active) VALUES
  ('morphology', 'mince', 'Mince', 1, true),
  ('morphology', 'sportif', 'Sportif', 2, true),
  ('morphology', 'athletique', 'Athlétique', 3, true),
  ('morphology', 'moyen', 'Moyen', 4, true),
  ('morphology', 'costaud', 'Costaud', 5, true),
  ('morphology', 'gros', 'Gros', 6, true),
  ('morphology', 'muscle', 'Musclé', 7, true)
ON CONFLICT (category, slug) DO NOTHING;

-- 4. Seed roles
INSERT INTO admin_config (type, slug, label, sort_order, active) VALUES
  ('role', 'top', 'Top', 1, true),
  ('role', 'bottom', 'Bottom', 2, true),
  ('role', 'versa', 'Versa', 3, true),
  ('role', 'side', 'Side', 4, true)
ON CONFLICT (category, slug) DO NOTHING;

-- 5. Seed session tags
INSERT INTO admin_config (type, slug, label, category, sort_order, active) VALUES
  ('session_tag', 'chill', 'Chill', 'Vibes', 1, true),
  ('session_tag', 'hot', 'Hot', 'Vibes', 2, true),
  ('session_tag', 'fetish', 'Fetish', 'Vibes', 3, true),
  ('session_tag', 'party', 'Party', 'Vibes', 4, true),
  ('session_tag', 'bears', 'Bears', 'Roles', 5, true),
  ('session_tag', 'twinks', 'Twinks', 'Roles', 6, true),
  ('session_tag', 'dark_room', 'Dark Room', 'Lieu', 7, true),
  ('session_tag', 'chemical', 'Chemical', 'Vibes', 8, true),
  ('session_tag', 'techno', 'Techno', 'Vibes', 9, true)
ON CONFLICT (category, slug) DO NOTHING;

-- 6. Seed session templates
INSERT INTO admin_config (type, slug, label, category, sort_order, active, meta) VALUES
  ('session_template', 'dark_room', 'Dark Room', NULL, 1, true, '{"cover_url": null, "tags": ["Dark Room", "Hot"], "color": "#E0887A", "description": "Ambiance sombre, discrétion totale"}'::jsonb),
  ('session_template', 'chemical', 'Chemical', NULL, 2, true, '{"cover_url": null, "tags": ["Chemical", "Hot", "Party"], "color": "#9080BA", "description": "Soirée chems, entre initiés"}'::jsonb),
  ('session_template', 'techno', 'Techno', NULL, 3, true, '{"cover_url": null, "tags": ["Techno", "Party"], "color": "#6BA888", "description": "Beats + plans, combo gagnant"}'::jsonb)
ON CONFLICT (category, slug) DO NOTHING;

-- 7. Add meta column to admin_config if missing
ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}';

-- 8. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;

-- 9. Storage policies (public read, auth upload)
DO $$ BEGIN CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Owner delete avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "Public read templates" ON storage.objects FOR SELECT USING (bucket_id = 'templates'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Admin upload templates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'templates' AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "Public read media" ON storage.objects FOR SELECT USING (bucket_id = 'media'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Auth upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Owner delete media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 10. Verify Marcus is admin
UPDATE user_profiles SET is_admin = true
WHERE id IN (SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test');

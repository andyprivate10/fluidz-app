-- FLUIDZ SEED DATA — Corrected version
-- Run in Supabase SQL Editor

-- 1. Sessions
INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, is_public, starts_at, ends_at, max_capacity, template_slug, lineup_json, created_at) VALUES
('dddd0001-0001-0001-0001-000000000001', (SELECT id FROM auth.users WHERE email='marcus@fluidz.test'), 'Plan ce soir', 'Dark room intime, max 6.', 'Paris 4e', '18 rue des Archives, 75004', 'open', ARRAY['Dark Room','Hot'], 'plan2029', true, now(), now()+interval '4h', 6, 'dark_room', '{"host_rules":"Respect mutuel."}'::jsonb, now()),
('dddd0001-0001-0001-0001-000000000002', (SELECT id FROM auth.users WHERE email='marcus@fluidz.test'), 'After chill', 'After détendu, câlins.', 'Paris 11e', '42 rue de la Roquette, 75011', 'open', ARRAY['Chill'], 'chill029', false, now()+interval '2h', now()+interval '8h', 8, 'after', '{"host_rules":"Venez comme vous êtes."}'::jsonb, now()),
('dddd0001-0001-0001-0001-000000000003', (SELECT id FROM auth.users WHERE email='karim@fluidz.test'), 'Session Cuddle', 'Câlins et tendresse.', 'Paris 12e', '8 avenue Daumesnil, 75012', 'open', ARRAY['Chill','Intimacy'], 'cudl0029', true, now()+interval '1h', now()+interval '5h', 5, 'cuddle', '{"host_rules":"Zéro pression."}'::jsonb, now())
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, status=EXCLUDED.status;

-- 2. Applications
INSERT INTO applications (session_id, applicant_id, status, eps_json) VALUES
('dddd0001-0001-0001-0001-000000000001', (SELECT id FROM auth.users WHERE email='karim@fluidz.test'), 'accepted', '{}'::jsonb),
('dddd0001-0001-0001-0001-000000000001', 'aaaa0001-0001-0001-0001-000000000001', 'accepted', '{}'::jsonb),
('dddd0001-0001-0001-0001-000000000001', 'aaaa0001-0001-0001-0001-000000000002', 'accepted', '{}'::jsonb),
('dddd0001-0001-0001-0001-000000000001', 'aaaa0001-0001-0001-0001-000000000005', 'pending', '{}'::jsonb),
('dddd0001-0001-0001-0001-000000000001', 'aaaa0001-0001-0001-0001-000000000006', 'pending', '{}'::jsonb),
('dddd0001-0001-0001-0001-000000000002', (SELECT id FROM auth.users WHERE email='yann@fluidz.test'), 'accepted', '{}'::jsonb),
('dddd0001-0001-0001-0001-000000000003', (SELECT id FROM auth.users WHERE email='marcus@fluidz.test'), 'pending', '{}'::jsonb)
ON CONFLICT DO NOTHING;

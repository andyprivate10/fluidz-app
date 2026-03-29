-- ═══ RESET DEMO DATA: 20 profiles + 3 sessions ═══
-- Run MANUALLY via Supabase SQL Editor

-- Step 1: Clean existing data (preserve auth users + user_profiles)
DELETE FROM messages;
DELETE FROM votes;
DELETE FROM notifications;
DELETE FROM applications;
DELETE FROM sessions WHERE title != 'DM Direct';
DELETE FROM contacts;
DELETE FROM favorites;
DELETE FROM intents;
DELETE FROM intent_matches;
DELETE FROM reviews;
DELETE FROM review_queue;
DELETE FROM interaction_log;
DELETE FROM saved_messages;
DELETE FROM ghost_sessions;

-- Step 2: Update the 3 test accounts with rich profiles
-- Marcus (admin/host)
UPDATE user_profiles SET
  display_name = 'Marcus',
  profile_json = jsonb_build_object(
    'age', 32,
    'bio', 'Host régulier, ambiance safe et respectueuse. Sportif, ouvert d''esprit.',
    'role', 'Versatile',
    'morphology', 'Sportif',
    'location', 'Paris 11e',
    'kinks', jsonb_build_array('Câlins', 'Massage', 'Jeux'),
    'health', jsonb_build_object('tested', true, 'last_test', '2026-03-01', 'prep', true),
    'avatar_url', null
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test');

-- Karim
UPDATE user_profiles SET
  display_name = 'Karim',
  profile_json = jsonb_build_object(
    'age', 29,
    'bio', 'Chill et curieux. J''aime les plans détendus entre mecs cool.',
    'role', 'Bottom',
    'morphology', 'Athlétique',
    'location', 'Paris 12e',
    'kinks', jsonb_build_array('Massage', 'Câlins'),
    'health', jsonb_build_object('tested', true, 'last_test', '2026-02-15', 'prep', true),
    'avatar_url', null
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'karim@fluidz.test');

-- Yann
UPDATE user_profiles SET
  display_name = 'Yann',
  profile_json = jsonb_build_object(
    'age', 27,
    'bio', 'Parisien, plutôt discret. Top attentionné.',
    'role', 'Top',
    'morphology', 'Mince',
    'location', 'Paris 3e',
    'kinks', jsonb_build_array('Domination douce', 'Massage'),
    'health', jsonb_build_object('tested', true, 'last_test', '2026-01-20', 'prep', false),
    'avatar_url', null
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'yann@fluidz.test');

-- Step 3: Create 17 additional demo profiles via user_profiles
-- These won't have auth users so they can't login, but appear in explore/contacts
INSERT INTO user_profiles (id, display_name, profile_json) VALUES
  ('aaaa0001-0001-0001-0001-000000000001', 'Alex', '{"age":25,"bio":"Étudiant en art, open-minded.","role":"Versatile","morphology":"Mince","location":"Paris 6e","kinks":["Câlins","Fétish léger"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000002', 'Romain', '{"age":34,"bio":"Ingé, sportif le week-end. Cherche des plans réguliers.","role":"Top","morphology":"Sportif","location":"Paris 9e","kinks":["Domination douce","Cuir"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000003', 'Samir', '{"age":28,"bio":"DJ le soir, développeur le jour.","role":"Bottom","morphology":"Athlétique","location":"Paris 18e","kinks":["Massage","Jeux"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000004', 'Kevin', '{"age":31,"bio":"Commercial, toujours partant.","role":"Versatile","morphology":"Moyen","location":"Paris 10e","kinks":["Câlins","Groupe"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000005', 'Hugo', '{"age":24,"bio":"Jeune archi, curieux de nouvelles expériences.","role":"Bottom","morphology":"Mince","location":"Paris 4e","kinks":["Câlins"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000006', 'Théo', '{"age":26,"bio":"Prof de yoga, très à l''écoute.","role":"Versatile","morphology":"Sportif","location":"Paris 5e","kinks":["Massage","Tantra"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000007', 'Lucas', '{"age":30,"bio":"Barman dans le Marais, sociable et fun.","role":"Top","morphology":"Musclé","location":"Paris 3e","kinks":["Domination douce","Cuir"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000008', 'Jordan', '{"age":22,"bio":"Nouveau sur Paris, ouvert à tout.","role":"Bottom","morphology":"Mince","location":"Paris 19e","kinks":["Câlins","Découverte"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000009', 'David', '{"age":38,"bio":"Expérimenté, bienveillant, sérieux.","role":"Top","morphology":"Costaud","location":"Paris 11e","kinks":["Cuir","Domination"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000010', 'Thomas', '{"age":33,"bio":"Photographe, sensible et créatif.","role":"Versatile","morphology":"Moyen","location":"Paris 2e","kinks":["Massage","Câlins"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000011', 'Nathan', '{"age":27,"bio":"Coach sportif, energy positive.","role":"Top","morphology":"Musclé","location":"Paris 16e","kinks":["Sport","Groupe"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000012', 'Antoine', '{"age":35,"bio":"Avocat, discret mais aventurier.","role":"Bottom","morphology":"Sportif","location":"Paris 8e","kinks":["Soumission","Cuir"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000013', 'Julien', '{"age":29,"bio":"Graphiste freelance, tattoos et sourire.","role":"Versatile","morphology":"Mince","location":"Paris 20e","kinks":["Fétish léger","Jeux"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000014', 'Maxime', '{"age":42,"bio":"Médecin, papa bear bienveillant.","role":"Top","morphology":"Costaud","location":"Paris 15e","kinks":["Câlins","Daddy"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000015', 'Enzo', '{"age":23,"bio":"Danseur, corps et esprit libres.","role":"Bottom","morphology":"Athlétique","location":"Paris 13e","kinks":["Tantra","Massage"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000016', 'Ibrahim', '{"age":30,"bio":"Cuisinier passionné, chaleureux.","role":"Versatile","morphology":"Moyen","location":"Paris 14e","kinks":["Groupe","Câlins"],"avatar_url":null}'::jsonb),
  ('aaaa0001-0001-0001-0001-000000000017', 'Pierre', '{"age":36,"bio":"Architecte, amoureux de la nuit parisienne.","role":"Top","morphology":"Sportif","location":"Paris 7e","kinks":["Domination douce","Cuir"],"avatar_url":null}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  profile_json = EXCLUDED.profile_json;

-- Step 4: Create 3 demo sessions
-- Session 1: "Plan ce soir" — Marcus host, dark_room template
INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, is_public, starts_at, ends_at, max_capacity, template_slug, lineup_json, created_at)
VALUES (
  'dddd0001-0001-0001-0001-000000000001',
  (SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test'),
  'Plan ce soir',
  'Soirée dark room intime, max 6. Ambiance sombre, musique low.',
  'Paris 4e',
  '18 rue des Archives, 75004 Paris, France',
  'open',
  ARRAY['Dark Room', 'Hot'],
  'plan2029',
  true,
  now(),
  now() + interval '4 hours',
  6,
  'dark_room',
  '{"host_rules": "Respect mutuel, safe word: STOP. Capotes dispo."}'::jsonb,
  now()
);

-- Session 2: "After chill" — Marcus host, after template
INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, is_public, starts_at, ends_at, max_capacity, template_slug, lineup_json, created_at)
VALUES (
  'dddd0001-0001-0001-0001-000000000002',
  (SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test'),
  'After chill',
  'After détendu chez moi, ambiance cool et câlins.',
  'Paris 11e',
  '42 rue de la Roquette, 75011 Paris, France',
  'open',
  ARRAY['Chill'],
  'chill029',
  false,
  now() + interval '2 hours',
  now() + interval '8 hours',
  8,
  'after',
  '{"host_rules": "Venez comme vous êtes. Respect et bienveillance."}'::jsonb,
  now()
);

-- Session 3: "Session Cuddle" — Karim host, cuddle template
INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, is_public, starts_at, ends_at, max_capacity, template_slug, lineup_json, created_at)
VALUES (
  'dddd0001-0001-0001-0001-000000000003',
  (SELECT id FROM auth.users WHERE email = 'karim@fluidz.test'),
  'Session Cuddle',
  'Câlins et tendresse, ambiance safe et douce.',
  'Paris 12e',
  '8 avenue Daumesnil, 75012 Paris, France',
  'open',
  ARRAY['Chill', 'Intimacy'],
  'cudl0029',
  true,
  now() + interval '1 hour',
  now() + interval '5 hours',
  5,
  'cuddle',
  '{"host_rules": "Zéro pression, tout est basé sur le consentement."}'::jsonb,
  now()
);

-- Step 4b: Add members and candidates to sessions

-- Session 1 "Plan ce soir": 3 accepted (Karim, Alex, Romain), 2 pending (Hugo, Théo)
INSERT INTO applications (session_id, applicant_id, status, eps_json) VALUES
  ('dddd0001-0001-0001-0001-000000000001', (SELECT id FROM auth.users WHERE email = 'karim@fluidz.test'), 'accepted', '{}'::jsonb),
  ('dddd0001-0001-0001-0001-000000000001', 'aaaa0001-0001-0001-0001-000000000001', 'accepted', '{}'::jsonb),
  ('dddd0001-0001-0001-0001-000000000001', 'aaaa0001-0001-0001-0001-000000000002', 'accepted', '{}'::jsonb),
  ('dddd0001-0001-0001-0001-000000000001', 'aaaa0001-0001-0001-0001-000000000005', 'pending', '{}'::jsonb),
  ('dddd0001-0001-0001-0001-000000000001', 'aaaa0001-0001-0001-0001-000000000006', 'pending', '{}'::jsonb);

-- Session 2 "After chill": 1 accepted (Yann)
INSERT INTO applications (session_id, applicant_id, status, eps_json) VALUES
  ('dddd0001-0001-0001-0001-000000000002', (SELECT id FROM auth.users WHERE email = 'yann@fluidz.test'), 'accepted', '{}'::jsonb);

-- Session 3 "Session Cuddle": Marcus applied (pending)
INSERT INTO applications (session_id, applicant_id, status, eps_json) VALUES
  ('dddd0001-0001-0001-0001-000000000003', (SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test'), 'pending', '{}'::jsonb);

-- Step 5: Create contacts for Marcus (NaughtyBook)
INSERT INTO contacts (user_id, contact_user_id, notes, created_at) VALUES
  ((SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test'), 'aaaa0001-0001-0001-0001-000000000004', 'Kevin', now()),
  ((SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test'), (SELECT id FROM auth.users WHERE email = 'yann@fluidz.test'), 'Yann', now()),
  ((SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test'), (SELECT id FROM auth.users WHERE email = 'karim@fluidz.test'), 'Karim', now()),
  ((SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test'), 'aaaa0001-0001-0001-0001-000000000001', 'Alex', now()),
  ((SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test'), 'aaaa0001-0001-0001-0001-000000000002', 'Romain', now()),
  ((SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test'), 'aaaa0001-0001-0001-0001-000000000003', 'Samir', now());

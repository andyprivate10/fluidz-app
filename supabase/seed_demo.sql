-- =============================================
-- FLUIDZ COMPLETE DEMO SEED
-- Run in Supabase SQL Editor (Role: postgres)
-- =============================================

-- ==================
-- PART A: User Profiles (9 new + update 3 existing)
-- ==================

-- Get existing user IDs for Marcus, Karim, Yann and update their profiles
DO $$
DECLARE
  marcus_id uuid;
  karim_id uuid;
  yann_id uuid;
BEGIN
  SELECT id INTO marcus_id FROM auth.users WHERE email = 'marcus@fluidz.test' LIMIT 1;
  SELECT id INTO karim_id FROM auth.users WHERE email = 'karim@fluidz.test' LIMIT 1;
  SELECT id INTO yann_id FROM auth.users WHERE email = 'yann@fluidz.test' LIMIT 1;

  IF marcus_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, display_name, profile_json, approx_lat, approx_lng, location_visible) VALUES (
      marcus_id, 'Marcus', '{
        "age": 35, "location": "Paris 4ème", "bio": "Hôte habitué. PrEP actif, testé récemment. Bonnes vibes only.",
        "role": "Top", "height": 182, "weight": 78, "morphology": "Athlétique",
        "kinks": ["SM léger", "Group", "Voyeur", "Dominant"],
        "limits": "Safe word respecté. Pas de non-consensuel.",
        "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        "photos_profil": ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop"],
        "photos_intime": ["https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=600&h=800&fit=crop"],
        "health": {"prep_status": "Actif", "dernier_test": "2026-03-01", "sero_status": ""},
        "saved_addresses": [{"id":"addr1","label":"Chez moi","approx_area":"Paris 4ème","exact_address":"14 rue de la Roquette, code 4521","directions":[{"text":"Métro Bastille sortie 3"},{"text":"Rue de la Roquette direction nord"},{"text":"Code porte: 4521, 2ème étage gauche"}]}]
      }'::jsonb, 48.8534, 2.3716, true
    ) ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, profile_json=EXCLUDED.profile_json, approx_lat=EXCLUDED.approx_lat, approx_lng=EXCLUDED.approx_lng, location_visible=EXCLUDED.location_visible;
  END IF;

  IF karim_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, display_name, profile_json, approx_lat, approx_lng, location_visible) VALUES (
      karim_id, 'Karim', '{
        "age": 28, "location": "Paris 11ème", "bio": "Bottom ouvert et curieux. PrEP actif. Toujours partant.",
        "role": "Bottom", "height": 175, "weight": 70, "morphology": "Sportif",
        "kinks": ["SM léger", "Voyeur", "Soumis", "Fétichisme"],
        "limits": "Pas de bareback sans PrEP",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        "photos_profil": ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop","https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop"],
        "health": {"prep_status": "Actif", "dernier_test": "2026-02-15", "sero_status": ""}
      }'::jsonb, 48.8590, 2.3810, true
    ) ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, profile_json=EXCLUDED.profile_json, approx_lat=EXCLUDED.approx_lat, approx_lng=EXCLUDED.approx_lng, location_visible=EXCLUDED.location_visible;
  END IF;

  IF yann_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, display_name, profile_json, approx_lat, approx_lng, location_visible) VALUES (
      yann_id, 'Yann', '{
        "age": 25, "location": "Paris 3ème", "bio": "Curieux, premier plan de groupe. Open-minded.",
        "role": "Bottom", "height": 178, "weight": 65, "morphology": "Mince",
        "kinks": ["Group", "Voyeur"],
        "limits": "Pas de SM hard",
        "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop",
        "photos_profil": ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop"],
        "health": {"prep_status": "Actif", "dernier_test": "2026-03-10", "sero_status": ""}
      }'::jsonb, 48.8631, 2.3608, true
    ) ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, profile_json=EXCLUDED.profile_json, approx_lat=EXCLUDED.approx_lat, approx_lng=EXCLUDED.approx_lng, location_visible=EXCLUDED.location_visible;
  END IF;
END $$;

-- 9 new profiles
INSERT INTO user_profiles (id, display_name, profile_json, approx_lat, approx_lng, location_visible) VALUES
('aaaa0001-0001-0001-0001-000000000001', 'Alex', '{"age":32,"location":"Paris 10ème","bio":"Top dominateur. Salle 5x/semaine. PrEP.","role":"Top","height":188,"weight":92,"morphology":"Musclé","kinks":["Dominant","SM léger","Fist","Group","Exhib"],"limits":"Toujours safe. Safe word: rouge.","avatar_url":"https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop","photos_profil":["https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&h=800&fit=crop","https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?w=600&h=800&fit=crop"],"photos_intime":["https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=600&h=800&fit=crop"],"health":{"prep_status":"Actif","dernier_test":"2026-03-05"}}'::jsonb, 48.8718, 2.3590, true),
('aaaa0001-0001-0001-0001-000000000002', 'Théo', '{"age":27,"location":"Paris 18ème","bio":"Versa chill. Pas de prise de tête.","role":"Versa","height":176,"weight":74,"morphology":"Moyen","kinks":["Group"],"avatar_url":"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop","photos_profil":["https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop"],"health":{"prep_status":"Non"}}'::jsonb, 48.8925, 2.3444, true),
('aaaa0001-0001-0001-0001-000000000003', 'Romain', '{"age":38,"location":"Paris 2ème","bio":"Bear bottom. Poilu et fier. Testé régulièrement.","role":"Bottom","height":180,"weight":95,"morphology":"Costaud","kinks":["Bears welcome","Group","Fétichisme","Voyeur","SM léger"],"limits":"Respect mutuel obligatoire.","avatar_url":"https://images.unsplash.com/photo-1557862921-37829c790f19?w=400&h=400&fit=crop","photos_profil":["https://images.unsplash.com/photo-1557862921-37829c790f19?w=600&h=800&fit=crop","https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=600&h=800&fit=crop"],"photos_intime":["https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=600&h=800&fit=crop"],"health":{"prep_status":"Actif","dernier_test":"2026-02-28"}}'::jsonb, 48.8681, 2.3414, true),
('aaaa0001-0001-0001-0001-000000000004', 'Amine', '{"age":30,"location":"Paris 19ème","bio":"Top actif, sportif. PrEP. Plans réguliers.","role":"Top","height":181,"weight":80,"morphology":"Sportif","kinks":["Group","Dominant","Exhib"],"limits":"Safe uniquement.","avatar_url":"https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400&h=400&fit=crop","photos_profil":["https://images.unsplash.com/photo-1504593811423-6dd665756598?w=600&h=800&fit=crop"],"health":{"prep_status":"Actif","dernier_test":"2026-03-12"}}'::jsonb, 48.8816, 2.3850, true),
('aaaa0001-0001-0001-0001-000000000005', 'Lucas', '{"age":23,"location":"Paris 5ème","bio":"Side. Pas de pénétration. Câlins, toucher, oral.","role":"Side","height":172,"weight":62,"morphology":"Mince","kinks":["Voyeur","Fétichisme"],"limits":"Pas de pénétration.","avatar_url":"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop","photos_profil":["https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop"],"health":{"prep_status":"Non","dernier_test":"2026-01-15"}}'::jsonb, 48.8462, 2.3500, false),
('aaaa0001-0001-0001-0001-000000000006', 'Kevin', '{"age":29,"location":"Paris 12ème","bio":"Bottom passif, athlétique. GymBro. PrEP.","role":"Bottom","height":183,"weight":82,"morphology":"Athlétique","kinks":["Soumis","SM léger","Group","Fist"],"limits":"Safe word: stop.","avatar_url":"https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop","photos_profil":["https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop","https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=600&h=800&fit=crop"],"photos_intime":["https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=800&fit=crop"],"health":{"prep_status":"Actif","dernier_test":"2026-03-08"}}'::jsonb, 48.8406, 2.3876, true),
('aaaa0001-0001-0001-0001-000000000007', 'Hugo', '{"age":34,"location":"Paris 9ème","bio":"Versa selon le mood. Chill.","role":"Versa","height":179,"weight":76,"morphology":"Sportif","kinks":["Group","Exhib","Jeux de rôle"],"avatar_url":"https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop","photos_profil":["https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop"],"health":{"prep_status":"Actif","dernier_test":"2026-02-20"}}'::jsonb, 48.8758, 2.3380, true),
('aaaa0001-0001-0001-0001-000000000008', 'Samir', '{"age":31,"location":"Paris 20ème","bio":"Top dominant. Musclé, tatoué. Organisateur de soirées. PrEP.","role":"Top","height":185,"weight":88,"morphology":"Musclé","kinks":["Dominant","SM léger","SM hard","Group","Fist","Exhib","Bears welcome"],"limits":"Consentement toujours. Safe word obligatoire.","avatar_url":"https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop","photos_profil":["https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&h=800&fit=crop","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop"],"photos_intime":["https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=600&h=800&fit=crop","https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=600&h=800&fit=crop"],"health":{"prep_status":"Actif","dernier_test":"2026-03-14"}}'::jsonb, 48.8638, 2.3988, true),
('aaaa0001-0001-0001-0001-000000000009', 'Julien', '{"age":22,"location":"Paris 6ème","bio":"Nouveau ici. Curieux.","role":"Bottom","height":170,"weight":60,"morphology":"Mince","kinks":[],"avatar_url":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop","health":{"prep_status":"Non"}}'::jsonb, 48.8494, 2.3323, false)
ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, profile_json=EXCLUDED.profile_json, approx_lat=EXCLUDED.approx_lat, approx_lng=EXCLUDED.approx_lng, location_visible=EXCLUDED.location_visible;


-- ==================
-- PART B: Sessions, Applications, Messages, Contacts, Votes, Reviews
-- ==================

DO $$
DECLARE
  marcus_id uuid;
  karim_id uuid;
  yann_id uuid;
  alex_id uuid := 'aaaa0001-0001-0001-0001-000000000001';
  theo_id uuid := 'aaaa0001-0001-0001-0001-000000000002';
  romain_id uuid := 'aaaa0001-0001-0001-0001-000000000003';
  amine_id uuid := 'aaaa0001-0001-0001-0001-000000000004';
  lucas_id uuid := 'aaaa0001-0001-0001-0001-000000000005';
  kevin_id uuid := 'aaaa0001-0001-0001-0001-000000000006';
  hugo_id uuid := 'aaaa0001-0001-0001-0001-000000000007';
  samir_id uuid := 'aaaa0001-0001-0001-0001-000000000008';
  julien_id uuid := 'aaaa0001-0001-0001-0001-000000000009';
  s1 uuid := 'bbbb0001-0001-0001-0001-000000000001';
  s2 uuid := 'bbbb0001-0001-0001-0001-000000000002';
  s3 uuid := 'bbbb0001-0001-0001-0001-000000000003';
BEGIN
  SELECT id INTO marcus_id FROM auth.users WHERE email='marcus@fluidz.test';
  SELECT id INTO karim_id FROM auth.users WHERE email='karim@fluidz.test';
  SELECT id INTO yann_id FROM auth.users WHERE email='yann@fluidz.test';

  -- Clean existing demo sessions
  DELETE FROM votes WHERE session_id IN (s1, s2, s3);
  DELETE FROM messages WHERE session_id IN (s1, s2, s3);
  DELETE FROM notifications WHERE session_id IN (s1, s2, s3);
  DELETE FROM applications WHERE session_id IN (s1, s2, s3);
  DELETE FROM sessions WHERE id IN (s1, s2, s3);

  -- Session 1: Marcus host, open (Dark Room)
  INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, lineup_json, group_chat_enabled)
  VALUES (s1, marcus_id, 'Dark Room ce soir', 'Session privée. Discrétion totale. PrEP obligatoire.', 'Paris 4ème', '14 rue de la Roquette, code 4521', 'open', ARRAY['Dark Room','Top','Bottom'], 'darkroom1', '{"directions":[{"text":"Métro Bastille sortie 3"},{"text":"Rue de la Roquette direction nord"},{"text":"Code porte: 4521, 2ème étage gauche"}],"roles_wanted":{"Top":2,"Bottom":3,"Versa":1}}'::jsonb, true);

  -- Session 2: Samir host, open
  INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, lineup_json)
  VALUES (s2, samir_id, 'Plan muscu + after', 'Mecs sportifs bienvenus. Chill puis hot.', 'Paris 20ème', '23 rue de Ménilmontant', 'open', ARRAY['Musclés','Top','Bottom','Group'], 'muscleplan', '{"roles_wanted":{"Top":2,"Bottom":2}}'::jsonb);

  -- Session 3: Alex host, ended
  INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, created_at)
  VALUES (s3, alex_id, 'Soirée fétish', 'Soirée terminée. 6 participants.', 'Paris 10ème', '8 passage du Désir', 'ended', ARRAY['Fétichisme','SM léger'], 'fetish99', now() - interval '3 days');

  -- Applications Session 1
  INSERT INTO applications (session_id, applicant_id, status, checked_in, checked_in_at, eps_json) VALUES
  (s1, karim_id,  'accepted',  true,  now()-interval '1 hour',  '{"role":"Bottom","shared_sections":["basics","role","physique","photos_profil"],"profile_snapshot":{"role":"Bottom","age":28}}'::jsonb),
  (s1, alex_id,   'accepted',  true,  now()-interval '45 min',  '{"role":"Top","shared_sections":["basics","role","physique","photos_profil","photos_adulte"],"profile_snapshot":{"role":"Top","age":32}}'::jsonb),
  (s1, romain_id, 'accepted',  false, null,                     '{"role":"Bottom","shared_sections":["basics","role","physique"],"profile_snapshot":{"role":"Bottom","age":38}}'::jsonb),
  (s1, kevin_id,  'pending',   false, null,                     '{"role":"Bottom","shared_sections":["basics","role","photos_profil"],"message":"Dispo dans 30min","profile_snapshot":{"role":"Bottom","age":29}}'::jsonb),
  (s1, julien_id, 'pending',   false, null,                     '{"role":"Bottom","shared_sections":["basics"],"message":"Premier plan, soyez cool","profile_snapshot":{"role":"Bottom","age":22}}'::jsonb),
  (s1, hugo_id,   'rejected',  false, null,                     '{"role":"Versa","profile_snapshot":{"role":"Versa","age":34}}'::jsonb);

  -- Applications Session 2
  INSERT INTO applications (session_id, applicant_id, status, checked_in, eps_json) VALUES
  (s2, marcus_id, 'accepted', true,  '{"role":"Top","profile_snapshot":{"role":"Top","age":35}}'::jsonb),
  (s2, kevin_id,  'accepted', false, '{"role":"Bottom","profile_snapshot":{"role":"Bottom","age":29}}'::jsonb),
  (s2, theo_id,   'pending',  false, '{"role":"Versa","message":"Je peux venir vers 23h","profile_snapshot":{"role":"Versa","age":27}}'::jsonb);

  -- Applications Session 3 (ended)
  INSERT INTO applications (session_id, applicant_id, status, checked_in, checked_in_at, eps_json) VALUES
  (s3, karim_id,  'accepted', true, now()-interval '3 days', '{"role":"Bottom"}'::jsonb),
  (s3, romain_id, 'accepted', true, now()-interval '3 days', '{"role":"Bottom"}'::jsonb),
  (s3, samir_id,  'accepted', true, now()-interval '3 days', '{"role":"Top"}'::jsonb),
  (s3, amine_id,  'accepted', true, now()-interval '3 days', '{"role":"Top"}'::jsonb),
  (s3, kevin_id,  'accepted', true, now()-interval '3 days', '{"role":"Bottom"}'::jsonb);

  -- Votes Session 1
  INSERT INTO votes (session_id, applicant_id, voter_id, vote) VALUES
  (s1, kevin_id,  karim_id, 'yes'),
  (s1, kevin_id,  alex_id,  'yes'),
  (s1, julien_id, karim_id, 'no'),
  (s1, julien_id, alex_id,  'yes'),
  (s1, hugo_id,   karim_id, 'no'),
  (s1, hugo_id,   alex_id,  'no');

  -- Messages: DMs
  INSERT INTO messages (session_id, sender_id, text, sender_name, room_type, dm_peer_id, created_at) VALUES
  (s1, marcus_id, 'Hey bienvenue ! Adresse dans la fiche session.',         'Marcus', 'dm', karim_id,  now()-interval '2 hours'),
  (s1, karim_id,  'Merci ! J arrive dans 20min',                           'Karim',  'dm', marcus_id, now()-interval '1 hour 50 min'),
  (s1, marcus_id, 'Top, à tout de suite',                                  'Marcus', 'dm', karim_id,  now()-interval '1 hour 45 min'),
  (s1, marcus_id, 'Salut Alex, bienvenue. On est déjà 2.',                 'Marcus', 'dm', alex_id,   now()-interval '1 hour 30 min'),
  (s1, alex_id,   'Cool, en route. 15min.',                                'Alex',   'dm', marcus_id, now()-interval '1 hour 20 min'),
  (s1, marcus_id, 'Romain, en route ?',                                    'Marcus', 'dm', romain_id, now()-interval '40 min'),
  (s1, romain_id, 'Oui 10min ! Métro en retard',                           'Romain', 'dm', marcus_id, now()-interval '35 min'),
  (s2, samir_id,  'Salut Marcus, content que tu viennes',                   'Samir',  'dm', marcus_id, now()-interval '3 hours'),
  (s2, marcus_id, 'Merci pour l invite ! À quelle heure ?',                'Marcus', 'dm', samir_id,  now()-interval '2 hours 50 min'),
  (s2, samir_id,  'Vers 22h. Viens quand tu veux.',                        'Samir',  'dm', marcus_id, now()-interval '2 hours 40 min');

  -- Messages: Group chat
  INSERT INTO messages (session_id, sender_id, text, sender_name, room_type, dm_peer_id, created_at) VALUES
  (s1, marcus_id, 'Bienvenue à tous ! Ambiance dark room, discrétion.',    'Marcus', 'group', null, now()-interval '1 hour'),
  (s1, karim_id,  'Salut tout le monde',                                   'Karim',  'group', null, now()-interval '55 min'),
  (s1, alex_id,   'Hey ! On est combien ?',                                'Alex',   'group', null, now()-interval '45 min'),
  (s1, marcus_id, '3 pour le moment, 1 en route',                          'Marcus', 'group', null, now()-interval '40 min');

  -- Safety tips
  INSERT INTO messages (session_id, sender_id, text, sender_name, room_type, dm_peer_id, created_at) VALUES
  (s1, marcus_id, 'Rappel : Partage ta localisation avec un ami. Tu peux quitter à tout moment.', 'Fluidz', 'dm', karim_id,  now()-interval '2 hours'),
  (s1, marcus_id, 'Rappel : Partage ta localisation avec un ami. Tu peux quitter à tout moment.', 'Fluidz', 'dm', alex_id,   now()-interval '1 hour 30 min'),
  (s1, marcus_id, 'Rappel : Partage ta localisation avec un ami. Tu peux quitter à tout moment.', 'Fluidz', 'dm', romain_id, now()-interval '40 min');

  -- Contacts
  DELETE FROM contacts WHERE user_id IN (marcus_id, karim_id, alex_id, samir_id);
  INSERT INTO contacts (user_id, contact_user_id, relation_level, notes) VALUES
  (marcus_id, karim_id,  'close',        'Habitué, toujours ponctuel'),
  (marcus_id, alex_id,   'favori',       'Top fiable, bonne énergie'),
  (marcus_id, romain_id, 'connaissance', null),
  (marcus_id, samir_id,  'close',        'Co-organisateur parfois'),
  (karim_id,  marcus_id, 'favori',       'Meilleur host de Paris'),
  (karim_id,  alex_id,   'close',        null),
  (karim_id,  romain_id, 'connaissance', null),
  (alex_id,   marcus_id, 'close',        null),
  (alex_id,   samir_id,  'close',        'On organise ensemble'),
  (samir_id,  marcus_id, 'favori',       null),
  (samir_id,  alex_id,   'close',        null),
  (samir_id,  kevin_id,  'connaissance', null);

  -- Interaction log
  INSERT INTO interaction_log (user_id, target_user_id, type, meta, created_at) VALUES
  (marcus_id, karim_id,  'co_event',      '{"session_title":"Dark Room ce soir"}'::jsonb,  now()-interval '1 day'),
  (marcus_id, alex_id,   'co_event',      '{"session_title":"Dark Room ce soir"}'::jsonb,  now()-interval '1 day'),
  (karim_id,  marcus_id, 'dm',            '{}'::jsonb, now()-interval '2 hours'),
  (alex_id,   marcus_id, 'dm',            '{}'::jsonb, now()-interval '1 hour'),
  (karim_id,  alex_id,   'profile_view',  '{}'::jsonb, now()-interval '3 hours'),
  (karim_id,  romain_id, 'profile_view',  '{}'::jsonb, now()-interval '2 hours'),
  (alex_id,   kevin_id,  'profile_view',  '{}'::jsonb, now()-interval '1 hour'),
  (marcus_id, karim_id,  'added_contact', '{}'::jsonb, now()-interval '7 days'),
  (marcus_id, alex_id,   'added_contact', '{}'::jsonb, now()-interval '5 days'),
  (karim_id,  marcus_id, 'added_contact', '{}'::jsonb, now()-interval '7 days');

  -- Reviews (Session 3 ended)
  INSERT INTO reviews (session_id, reviewer_id, target_id, rating, vibe_tags, comment, is_anonymous) VALUES
  (s3, karim_id,  alex_id,   5, ARRAY['Fun','Hot','Respectueux'], 'Super ambiance, host au top',     false),
  (s3, romain_id, alex_id,   4, ARRAY['Hot','Safe'],              'Bonne orga',                      false),
  (s3, samir_id,  alex_id,   4, ARRAY['Fun','Respectueux'],       null,                              true),
  (s3, alex_id,   karim_id,  5, ARRAY['Hot','Fun','Sexy'],        'Karim est toujours au rendez-vous', false),
  (s3, alex_id,   romain_id, 4, ARRAY['Chill','Safe'],            null,                              false),
  (s3, alex_id,   samir_id,  5, ARRAY['Hot','Dominant','Fun'],    'Samir gère',                      false);

  -- Notifications
  INSERT INTO notifications (user_id, session_id, type, title, body, href, created_at) VALUES
  (marcus_id, s1, 'new_application',     'Nouvelle candidature',  'Kevin a postulé',              '/session/' || s1 || '/host', now()-interval '30 min'),
  (marcus_id, s1, 'new_application',     'Nouvelle candidature',  'Julien a postulé',             '/session/' || s1 || '/host', now()-interval '20 min'),
  (karim_id,  s1, 'application_accepted','Accepté',               'Tu es accepté pour Dark Room', '/session/' || s1,            now()-interval '2 hours'),
  (alex_id,   s1, 'application_accepted','Accepté',               'Tu es accepté pour Dark Room', '/session/' || s1,            now()-interval '1 hour 30 min'),
  (romain_id, s1, 'application_accepted','Accepté',               'Tu es accepté pour Dark Room', '/session/' || s1,            now()-interval '40 min'),
  (hugo_id,   s1, 'application_rejected','Non retenu',            'Ta candidature Dark Room',     '/session/' || s1,            now()-interval '1 hour'),
  (marcus_id, s2, 'session_invite',      'Tu es invité',          'Samir t invite à Plan muscu',  '/session/' || s2,            now()-interval '3 hours');

END $$;

SELECT 'SEED COMPLETE: 12 profiles, 3 sessions, applications, messages, votes, contacts, reviews, notifications' AS result;

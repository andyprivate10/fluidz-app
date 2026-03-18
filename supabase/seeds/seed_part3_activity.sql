-- FLUIDZ SEED Part 3: Sessions, Applications, Messages, Contacts, Votes, Reviews

DO $$
DECLARE
  marcus_id uuid; karim_id uuid; yann_id uuid;
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

  -- Session 1: Marcus host, active
  INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, lineup_json, group_chat_enabled)
  VALUES (s1, marcus_id, 'Dark Room ce soir', 'Session privée. Discrétion totale. PrEP obligatoire.', 'Paris 4ème', '14 rue de la Roquette, code 4521', 'open', ARRAY['Dark Room','Top','Bottom'], 'darkroom1', '{"directions":[{"text":"Métro Bastille sortie 3"},{"text":"Rue de la Roquette direction nord"},{"text":"Code porte: 4521, 2ème étage gauche"}],"roles_wanted":{"Top":2,"Bottom":3,"Versa":1}}'::jsonb, true)
  ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, status=EXCLUDED.status;

  -- Session 2: Samir host, active
  INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, lineup_json)
  VALUES (s2, samir_id, 'Plan muscu + after', 'Mecs sportifs bienvenus. Ambiance chill puis hot.', 'Paris 20ème', '23 rue de Ménilmontant', 'open', ARRAY['Musclés','Top','Bottom','Group'], 'muscleplan', '{"roles_wanted":{"Top":2,"Bottom":2}}'::jsonb)
  ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, status=EXCLUDED.status;

  -- Session 3: Alex host, ended
  INSERT INTO sessions (id, host_id, title, description, approx_area, exact_address, status, tags, invite_code, created_at)
  VALUES (s3, alex_id, 'Soirée fétish', 'Soirée terminée. 6 participants.', 'Paris 10ème', '8 passage du Désir', 'ended', ARRAY['Fétichisme','SM léger'], 'fetish99', now() - interval '3 days')
  ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, status=EXCLUDED.status;

  -- Applications Session 1
  INSERT INTO applications (session_id, applicant_id, status, checked_in, checked_in_at, eps_json) VALUES
  (s1, karim_id, 'accepted', true, now()-interval '1 hour', '{"role":"Bottom","shared_sections":["basics","role","physique","photos_profil"],"profile_snapshot":{"role":"Bottom","age":28}}'::jsonb),
  (s1, alex_id, 'accepted', true, now()-interval '45 min', '{"role":"Top","shared_sections":["basics","role","physique","photos_profil","photos_adulte"],"profile_snapshot":{"role":"Top","age":32}}'::jsonb),
  (s1, romain_id, 'accepted', false, null, '{"role":"Bottom","shared_sections":["basics","role","physique"],"profile_snapshot":{"role":"Bottom","age":38}}'::jsonb),
  (s1, kevin_id, 'pending', false, null, '{"role":"Bottom","shared_sections":["basics","role","photos_profil"],"message":"Dispo dans 30min, j arrive","profile_snapshot":{"role":"Bottom","age":29}}'::jsonb),
  (s1, julien_id, 'pending', false, null, '{"role":"Bottom","shared_sections":["basics"],"message":"Premier plan, soyez cool","profile_snapshot":{"role":"Bottom","age":22}}'::jsonb),
  (s1, hugo_id, 'rejected', false, null, '{"role":"Versa","profile_snapshot":{"role":"Versa","age":34}}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- Applications Session 2
  INSERT INTO applications (session_id, applicant_id, status, checked_in, eps_json) VALUES
  (s2, marcus_id, 'accepted', true, '{"role":"Top","profile_snapshot":{"role":"Top","age":35}}'::jsonb),
  (s2, kevin_id, 'accepted', false, '{"role":"Bottom","profile_snapshot":{"role":"Bottom","age":29}}'::jsonb),
  (s2, theo_id, 'pending', false, '{"role":"Versa","message":"Je peux venir vers 23h","profile_snapshot":{"role":"Versa","age":27}}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- Applications Session 3 (ended)
  INSERT INTO applications (session_id, applicant_id, status, checked_in, checked_in_at, eps_json) VALUES
  (s3, karim_id, 'accepted', true, now()-interval '3 days', '{"role":"Bottom"}'::jsonb),
  (s3, romain_id, 'accepted', true, now()-interval '3 days', '{"role":"Bottom"}'::jsonb),
  (s3, samir_id, 'accepted', true, now()-interval '3 days', '{"role":"Top"}'::jsonb),
  (s3, amine_id, 'accepted', true, now()-interval '3 days', '{"role":"Top"}'::jsonb),
  (s3, kevin_id, 'accepted', true, now()-interval '3 days', '{"role":"Bottom"}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- Votes Session 1
  INSERT INTO votes (session_id, applicant_id, voter_id, vote) VALUES
  (s1, kevin_id, karim_id, 'yes'), (s1, kevin_id, alex_id, 'yes'),
  (s1, julien_id, karim_id, 'no'), (s1, julien_id, alex_id, 'yes'),
  (s1, hugo_id, karim_id, 'no'), (s1, hugo_id, alex_id, 'no')
  ON CONFLICT DO NOTHING;

  -- Messages DM + Group
  INSERT INTO messages (session_id, sender_id, text, sender_name, room_type, dm_peer_id, created_at) VALUES
  (s1, marcus_id, 'Hey bienvenue ! Adresse dans la fiche.', 'Marcus', 'dm', karim_id, now()-interval '2 hours'),
  (s1, karim_id, 'Merci ! J arrive dans 20min', 'Karim', 'dm', marcus_id, now()-interval '110 min'),
  (s1, marcus_id, 'Top, à tout de suite', 'Marcus', 'dm', karim_id, now()-interval '105 min'),
  (s1, marcus_id, 'Salut Alex, on est déjà 2 ici.', 'Marcus', 'dm', alex_id, now()-interval '90 min'),
  (s1, alex_id, 'Cool, en route. 15min max.', 'Alex', 'dm', marcus_id, now()-interval '80 min'),
  (s1, marcus_id, 'Romain, tu es en route ?', 'Marcus', 'dm', romain_id, now()-interval '40 min'),
  (s1, romain_id, 'Oui 10min ! Métro en retard', 'Romain', 'dm', marcus_id, now()-interval '35 min'),
  (s1, marcus_id, 'Bienvenue à tous ! Ambiance dark room, discrétion.', 'Marcus', 'group', null, now()-interval '60 min'),
  (s1, karim_id, 'Salut tout le monde', 'Karim', 'group', null, now()-interval '55 min'),
  (s1, alex_id, 'Hey ! On est combien ?', 'Alex', 'group', null, now()-interval '45 min'),
  (s1, marcus_id, '3 pour le moment, 1 en route', 'Marcus', 'group', null, now()-interval '40 min'),
  (s2, samir_id, 'Salut Marcus, content que tu viennes', 'Samir', 'dm', marcus_id, now()-interval '3 hours'),
  (s2, marcus_id, 'Merci pour l invite ! Quelle heure ?', 'Marcus', 'dm', samir_id, now()-interval '170 min'),
  (s2, samir_id, 'Vers 22h. Viens quand tu veux.', 'Samir', 'dm', marcus_id, now()-interval '160 min');

  -- Safety tips
  INSERT INTO messages (session_id, sender_id, text, sender_name, room_type, dm_peer_id, created_at) VALUES
  (s1, marcus_id, 'Rappel Fluidz : Partage ta localisation avec un ami. Tu peux quitter à tout moment.', 'Fluidz', 'dm', karim_id, now()-interval '2 hours'),
  (s1, marcus_id, 'Rappel Fluidz : Partage ta localisation avec un ami. Tu peux quitter à tout moment.', 'Fluidz', 'dm', alex_id, now()-interval '90 min'),
  (s1, marcus_id, 'Rappel Fluidz : Partage ta localisation avec un ami. Tu peux quitter à tout moment.', 'Fluidz', 'dm', romain_id, now()-interval '40 min');

  -- Contacts
  INSERT INTO contacts (user_id, contact_user_id, relation_level, notes) VALUES
  (marcus_id, karim_id, 'close', 'Habitué, toujours ponctuel'),
  (marcus_id, alex_id, 'favori', 'Top fiable, bonne énergie'),
  (marcus_id, romain_id, 'connaissance', null),
  (marcus_id, samir_id, 'close', 'Co-organisateur parfois'),
  (karim_id, marcus_id, 'favori', 'Meilleur host de Paris'),
  (karim_id, alex_id, 'close', null),
  (karim_id, romain_id, 'connaissance', null),
  (alex_id, marcus_id, 'close', null),
  (alex_id, samir_id, 'close', 'On organise ensemble'),
  (samir_id, marcus_id, 'favori', null),
  (samir_id, alex_id, 'close', null),
  (samir_id, kevin_id, 'connaissance', null)
  ON CONFLICT DO NOTHING;

  -- Interaction log
  INSERT INTO interaction_log (user_id, target_user_id, type, meta, created_at) VALUES
  (marcus_id, karim_id, 'co_event', '{"session_title":"Dark Room ce soir"}'::jsonb, now()-interval '1 day'),
  (marcus_id, alex_id, 'co_event', '{"session_title":"Dark Room ce soir"}'::jsonb, now()-interval '1 day'),
  (karim_id, marcus_id, 'dm', '{}'::jsonb, now()-interval '2 hours'),
  (alex_id, marcus_id, 'dm', '{}'::jsonb, now()-interval '1 hour'),
  (karim_id, alex_id, 'profile_view', '{}'::jsonb, now()-interval '3 hours'),
  (karim_id, romain_id, 'profile_view', '{}'::jsonb, now()-interval '2 hours'),
  (alex_id, kevin_id, 'profile_view', '{}'::jsonb, now()-interval '1 hour'),
  (marcus_id, karim_id, 'added_contact', '{}'::jsonb, now()-interval '7 days'),
  (marcus_id, alex_id, 'added_contact', '{}'::jsonb, now()-interval '5 days'),
  (karim_id, marcus_id, 'added_contact', '{}'::jsonb, now()-interval '7 days');

  -- Reviews (session 3 ended)
  INSERT INTO reviews (session_id, reviewer_id, target_id, rating, vibe_tags, comment, is_anonymous) VALUES
  (s3, karim_id, alex_id, 5, ARRAY['Fun','Hot','Respectueux'], 'Super ambiance, host au top', false),
  (s3, romain_id, alex_id, 4, ARRAY['Hot','Safe'], 'Bonne orga', false),
  (s3, samir_id, alex_id, 4, ARRAY['Fun','Respectueux'], null, true),
  (s3, alex_id, karim_id, 5, ARRAY['Hot','Fun','Sexy'], 'Karim est toujours au rdv', false),
  (s3, alex_id, romain_id, 4, ARRAY['Chill','Safe'], null, false),
  (s3, alex_id, samir_id, 5, ARRAY['Hot','Dominant','Fun'], 'Samir gère', false)
  ON CONFLICT DO NOTHING;

  -- Notifications
  INSERT INTO notifications (user_id, session_id, type, title, body, href, created_at) VALUES
  (marcus_id, s1, 'new_application', 'Nouvelle candidature', 'Kevin a postulé pour Dark Room ce soir', '/session/' || s1 || '/host', now()-interval '30 min'),
  (marcus_id, s1, 'new_application', 'Nouvelle candidature', 'Julien a postulé pour Dark Room ce soir', '/session/' || s1 || '/host', now()-interval '20 min'),
  (karim_id, s1, 'application_accepted', 'Accepté', 'Tu es accepté pour Dark Room ce soir', '/session/' || s1, now()-interval '2 hours'),
  (alex_id, s1, 'application_accepted', 'Accepté', 'Tu es accepté pour Dark Room ce soir', '/session/' || s1, now()-interval '90 min'),
  (romain_id, s1, 'application_accepted', 'Accepté', 'Tu es accepté pour Dark Room ce soir', '/session/' || s1, now()-interval '40 min'),
  (hugo_id, s1, 'application_rejected', 'Non retenu', 'Dark Room ce soir', '/session/' || s1, now()-interval '1 hour'),
  (marcus_id, s2, 'session_invite', 'Tu es invité', 'Samir t invite à Plan muscu + after', '/session/' || s2, now()-interval '3 hours');

END $$;

SELECT 'Part 3 done: 3 sessions, apps, messages, contacts, votes, reviews, notifications' AS result;

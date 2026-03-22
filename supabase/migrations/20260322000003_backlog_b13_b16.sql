-- B13: Joint/Connected Profiles
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Profils connectés (Couple/Trio/Polyamour)', 'Compte unifié multi-personnes: joint profile qui agit comme un solo. Couple, trio, polyamour. Candidater, créer session, galerie, filtres.', 'backlog', 51, '{profil,couple,social}')
ON CONFLICT DO NOTHING;
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Profils connectés%' AND type='epic'), 'Modèle joint_profile: lien N profils individuels', 'backlog', 1, '{db}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Profils connectés%' AND type='epic'), 'UI création joint profile + invitation membres', 'backlog', 2, '{ux}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Profils connectés%' AND type='epic'), 'Joint profile dans galerie + filtres Solo/Couple/Trio', 'backlog', 3, '{explore}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Profils connectés%' AND type='epic'), 'Joint profile candidature/création session', 'backlog', 4, '{session}', 3)
ON CONFLICT DO NOTHING;

-- B14: Profile Types + Experience Adaptation
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Types de profil + Adaptation expérience', 'Inscription: homme gay/bi, femme hétéro, trans, NB. Filtrage auto sessions/galerie compatibles. Kinks/pratiques adaptés.', 'backlog', 52, '{profil,onboarding,ux}')
ON CONFLICT DO NOTHING;
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Types de profil%' AND type='epic'), 'Onboarding: choix type de profil (gay/bi/hétéro/trans/NB)', 'backlog', 1, '{onboarding}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Types de profil%' AND type='epic'), 'Filtrage auto galerie/sessions par compatibilité', 'backlog', 2, '{explore,matching}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Types de profil%' AND type='epic'), 'Kinks/pratiques checklist adaptée au type', 'backlog', 3, '{profil}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Types de profil%' AND type='epic'), 'Toggle "voir tout" pour bypass filtres', 'backlog', 4, '{ux}', 1)
ON CONFLICT DO NOTHING;

-- B15: Group invitations (same mechanics as sessions)
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Invitations groupes (mécanique sessions)', 'Invite directe, candidature, lien fixe, lien temporaire 10min pour rejoindre un groupe.', 'backlog', 53, '{groups,invitation}')
ON CONFLICT DO NOTHING;
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Invitations groupes%' AND type='epic'), 'Lien fixe groupe (regénérable) + lien temporaire 10min', 'backlog', 1, '{groups,links}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Invitations groupes%' AND type='epic'), 'Candidature à un groupe: voir membres, accepter/refuser', 'backlog', 2, '{groups,ux}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Invitations groupes%' AND type='epic'), 'Invite depuis Book/galerie/lien partagé', 'backlog', 3, '{groups,sharing}', 2)
ON CONFLICT DO NOTHING;

-- B16: End of session → Create group
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Fin de session → Création groupe', 'Hôte crée un groupe depuis les participants. Checkbox sélection, ajouter à groupe existant, reviews post-session.', 'backlog', 54, '{session,groups}')
ON CONFLICT DO NOTHING;
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Fin de session%groupe' AND type='epic'), 'CTA post-session: créer groupe avec participants checkbox', 'backlog', 1, '{session,groups}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Fin de session%groupe' AND type='epic'), 'Option: ajouter à un groupe existant', 'backlog', 2, '{groups}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Fin de session%groupe' AND type='epic'), 'Reviews/notes post-session sur les participants', 'backlog', 3, '{reviews}', 3)
ON CONFLICT DO NOTHING;

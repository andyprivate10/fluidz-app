-- B13: Joint/Connected Profiles
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Profils connectés (Couple/Trio/Poly)', 'Compte unifié multi-personnes, apparaît dans galerie avec badge, candidature/host en joint, filtres propagés', 'backlog', 51, '{profil,social,couples}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Profils connectés (Couple/Trio/Poly)' AND type = 'epic'), 'DB: tables joint_profiles + joint_profile_members', 'backlog', 1, '{db}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Profils connectés (Couple/Trio/Poly)' AND type = 'epic'), 'Créer un profil joint (invite membres, même mécanique Apply)', 'backlog', 2, '{ux,profil}', 6),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Profils connectés (Couple/Trio/Poly)' AND type = 'epic'), 'Galerie: badge Couple/Trio/Poly + filtres solo/couple/trio', 'backlog', 3, '{explore,filter}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Profils connectés (Couple/Trio/Poly)' AND type = 'epic'), 'Session: candidater/host en tant que profil joint', 'backlog', 4, '{session}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Profils connectés (Couple/Trio/Poly)' AND type = 'epic'), 'Profil joint: galerie, bio, rôles, kinks partagés', 'backlog', 5, '{profil}', 4)
ON CONFLICT DO NOTHING;

-- B14: Profile Types + Adapted Experience
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Types de profil + expérience adaptée', 'Choix identité à inscription (gay/trans/hétéro/bi/NB/couple), filtrage galerie adapté, sessions taguées, kinks contextuels', 'backlog', 52, '{profil,onboarding,identity}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Types de profil + expérience adaptée' AND type = 'epic'), 'Onboarding: écran choix type identité (illustrations)', 'backlog', 1, '{onboarding,ux}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Types de profil + expérience adaptée' AND type = 'epic'), 'Galerie: filtrage par défaut selon type profil', 'backlog', 2, '{explore,filter}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Types de profil + expérience adaptée' AND type = 'epic'), 'Sessions: tags "qui est bienvenu" (Gay/Mixed/Straight/Open)', 'backlog', 3, '{session,tags}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Types de profil + expérience adaptée' AND type = 'epic'), 'Kinks/pratiques adaptés au contexte identitaire', 'backlog', 4, '{profil,admin}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Types de profil + expérience adaptée' AND type = 'epic'), 'Settings: modifier son type, pas de restriction hard', 'backlog', 5, '{settings}', 1)
ON CONFLICT DO NOTHING;

-- B15: Group Invitations (same as sessions)
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Invitations groupe (mécanique sessions)', 'Invite directe, candidature, invite depuis Book/profil pour rejoindre un groupe', 'backlog', 53, '{groups,invitation}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Invitations groupe (mécanique sessions)' AND type = 'epic'), 'Lien invitation directe groupe (membre immédiat)', 'backlog', 1, '{groups}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Invitations groupe (mécanique sessions)' AND type = 'epic'), 'Lien candidature groupe (Apply + validation admin)', 'backlog', 2, '{groups}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Invitations groupe (mécanique sessions)' AND type = 'epic'), 'Invite depuis Naughty Book (sélection contacts)', 'backlog', 3, '{groups,contacts}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Invitations groupe (mécanique sessions)' AND type = 'epic'), 'Invite depuis profil (bouton "Inviter dans un groupe")', 'backlog', 4, '{groups,profil}', 1)
ON CONFLICT DO NOTHING;

-- B16: End of Session → Create Group
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Fin session → Création groupe', 'Host crée groupe depuis participants, sélection/désélection, ajout à groupe existant, co-admins', 'backlog', 54, '{session,groups}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Fin session → Création groupe' AND type = 'epic'), 'Notification host fin session: "Créer un groupe ?"', 'backlog', 1, '{notifications}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Fin session → Création groupe' AND type = 'epic'), 'Sélection/désélection participants + nommer groupe', 'backlog', 2, '{ux,groups}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Fin session → Création groupe' AND type = 'epic'), 'Ajouter à un groupe existant (sélection)', 'backlog', 3, '{groups}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Fin session → Création groupe' AND type = 'epic'), 'Ajouter profils hors-session + co-admins', 'backlog', 4, '{groups,admin}', 2)
ON CONFLICT DO NOTHING;

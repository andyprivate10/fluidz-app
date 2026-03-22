-- B13: Connected Profiles (Couple, Trio, Polyamour)
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Profils connectés (Couple/Trio/Polyamour)', 'Compte unifié multi-personnes: couple, trio, polyamour. Candidater/poster en tant que profil connecté. Filtrable dans galerie.', 'backlog', 51, '{profil,social,couples}')
ON CONFLICT DO NOTHING;

-- B14: Profile Types + Adaptive Context
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Types de profil + Contexte adaptatif', 'Homme gay/bi, femme hétéro, trans, NB, couple. Adapter expérience: filtrage sessions, champs profil, galerie compatible.', 'backlog', 52, '{profil,onboarding,context}')
ON CONFLICT DO NOTHING;

-- B15: Group Invitation Mechanics (like sessions)
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Mécanique invitation groupes (comme sessions)', 'Invitation directe, candidature+vote, lien invitation, invite depuis Book. Même pattern que sessions.', 'backlog', 53, '{groups,invitation}')
ON CONFLICT DO NOTHING;

-- B16: End of Session → Group Management
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Fin de session → Créer/gérer groupe', 'Host crée un groupe post-session: sélection participants, ajouter à groupe existant, notifications.', 'backlog', 54, '{session,groups}')
ON CONFLICT DO NOTHING;

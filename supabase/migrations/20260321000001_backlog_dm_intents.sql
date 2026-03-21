-- Backlog: DM Contact System + Intent Matching epics + stories

-- B6 — DM Contact System
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'DM Contact System', 'Prise de contact entre profils : DM direct si accepte, sinon Apply to DM avec message + sections profil', 'backlog', 35, '{dm,contact,social}')
ON CONFLICT DO NOTHING;

-- B7 — Intent Matching
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Niveaux Interaction & Intent Matching', 'Echelle de relation (inconnu→favori) + matching par intentions', 'backlog', 44, '{matching,social,discovery}')
ON CONFLICT DO NOTHING;

-- B6 Stories
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System' AND type = 'epic'), 'Profil setting: toggle Accepter DM inconnus', 'backlog', 1, '{settings,profil}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System' AND type = 'epic'), 'Profil setting: toggle Recevoir demandes de contact', 'backlog', 2, '{settings,profil}', 0.5),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System' AND type = 'epic'), 'PublicProfile: bouton DM direct ou Apply to DM selon settings', 'backlog', 3, '{ui,profil}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System' AND type = 'epic'), 'Formulaire Apply to DM: message + toggle sections profil (CandidatePack)', 'backlog', 4, '{ui,dm}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System' AND type = 'epic'), 'Vue destinataire: notification + preview profil + Accept/Reject', 'backlog', 5, '{ui,notifications}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System' AND type = 'epic'), 'Apres accept: ouverture DM direct + notification demandeur', 'backlog', 6, '{dm,notifications}', 2)
ON CONFLICT DO NOTHING;

-- B7 Stories
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux Interaction & Intent Matching' AND type = 'epic'), 'Profil: section Ce que je cherche (intents) avec tags', 'backlog', 1, '{profil,intents}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux Interaction & Intent Matching' AND type = 'epic'), 'Algorithme matching intents → score compatibilite', 'backlog', 2, '{algorithm,matching}', 6),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux Interaction & Intent Matching' AND type = 'epic'), 'Feed Profils compatibles trie par score', 'backlog', 3, '{ui,discovery}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux Interaction & Intent Matching' AND type = 'epic'), 'Notifications Match d intention quand 2 profils correspondent', 'backlog', 4, '{notifications,matching}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux Interaction & Intent Matching' AND type = 'epic'), 'Sessions suggerees basees sur intents du profil', 'backlog', 5, '{sessions,matching}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux Interaction & Intent Matching' AND type = 'epic'), 'Echelle de relation visible sur chaque contact du Naughty Book', 'backlog', 6, '{ui,contacts}', 2)
ON CONFLICT DO NOTHING;

-- Also mark previously completed items
UPDATE dev_backlog SET status = 'done', updated_at = now() WHERE title = 'Landing Page Deploy' AND type = 'epic';
UPDATE dev_backlog SET status = 'done', updated_at = now() WHERE type = 'story' AND title LIKE 'Deploy site%';
UPDATE dev_backlog SET status = 'done', updated_at = now() WHERE title = 'UX Circuits Verification' AND type = 'epic';
UPDATE dev_backlog SET status = 'done', updated_at = now() WHERE title = 'Admin Dev Tab (Backlog Tracker)' AND type = 'epic';

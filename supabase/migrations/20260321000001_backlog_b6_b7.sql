-- Seed B6: DM Contact System (Apply to DM)
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'DM Contact System (Apply to DM)', 'Deux modes de contact : DM ouvert si accepté, sinon Apply to DM avec message + sections profil partagées', 'backlog', 44, '{dm,contact,ux}')
ON CONFLICT DO NOTHING;

-- Stories for B6
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic'), 'Settings profil: toggle DM directs / demandes de contact / sections minimum', 'backlog', 1, '{settings,profil}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic'), 'PublicProfile: bouton contextuel DM direct ou Apply to DM', 'backlog', 2, '{ux,profil}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic'), 'Bottom sheet Apply to DM: message accroche + toggle sections profil', 'backlog', 3, '{ux,dm}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic'), 'Notification destinataire: voir message + apercu profil + Accepter/Refuser', 'backlog', 4, '{notifications,dm}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic'), 'Si accepte: DM ouvert + contacts mutuels ajoutes', 'backlog', 5, '{dm,contacts}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic'), 'Rate limit 5 Apply/jour + cooldown 7j si refuse + expiry 48h', 'backlog', 6, '{security,anti-spam}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic'), 'Section Demandes dans ChatsHub (separe des DM principaux)', 'backlog', 7, '{ux,chats}', 2)
ON CONFLICT DO NOTHING;

-- Seed B7: Niveaux interaction & Intent Matching
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Niveaux interaction & Intent Matching', 'Echelle relation 0-4 evolutive + declaration intents (dispo, cherche, role, vibes) + matching automatique', 'backlog', 45, '{matching,relations,ux}')
ON CONFLICT DO NOTHING;

-- Stories for B7
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic'), 'Modele relation_level evolutif (0-4) dans contacts', 'backlog', 1, '{db,contacts}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic'), 'Evolution auto: co-session +1, review positive +1, inactivite -1', 'backlog', 2, '{logic,automation}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic'), 'Section Intent dans profil: dispo, cherche, role, vibes', 'backlog', 3, '{profil,ux}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic'), 'Matching engine: calcul compatibilite entre intents', 'backlog', 4, '{matching,algo}', 6),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic'), 'Suggestions profils: notification quand match compatible dispo', 'backlog', 5, '{notifications,matching}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic'), 'UI niveau relation visible sur profil + Naughty Book', 'backlog', 6, '{ux,contacts}', 2)
ON CONFLICT DO NOTHING;

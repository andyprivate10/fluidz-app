-- B11: Share screen post-creation
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Ecran partage post-creation session', 'Apres creation: message preview + copier + WhatsApp/Instagram/Share natif + options invitation', 'backlog', 50, '{session,share,ux}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage post-creation session' AND type = 'epic'), 'Ecran post-creation: message preview + bouton copier', 'backlog', 1, '{ux,share}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage post-creation session' AND type = 'epic'), 'Boutons WhatsApp/Instagram/Share natif (navigator.share)', 'backlog', 2, '{share,mobile}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage post-creation session' AND type = 'epic'), 'Integration options invitation (B12) dans ecran partage', 'backlog', 3, '{share,invitations}', 1)
ON CONFLICT DO NOTHING;

-- B12: Invitation options
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Options invitation session (5 methodes)', '5 types: lien fixe, lien 10min, lien membre direct, invite Book, invite groupe', 'backlog', 51, '{session,invitations,ux}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Options invitation session (5 methodes)' AND type = 'epic'), 'Lien fixe regenerable (/join/CODE)', 'backlog', 1, '{invitations}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Options invitation session (5 methodes)' AND type = 'epic'), 'Lien temporaire 10min regenerable + page expiration', 'backlog', 2, '{invitations,security}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Options invitation session (5 methodes)' AND type = 'epic'), 'Lien invitation membre direct (bypass candidature)', 'backlog', 3, '{invitations}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Options invitation session (5 methodes)' AND type = 'epic'), 'Inviter depuis Naughty Book (notification in-app)', 'backlog', 4, '{invitations,contacts}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Options invitation session (5 methodes)' AND type = 'epic'), 'Inviter un groupe entier (notification tous membres)', 'backlog', 5, '{invitations,groups}', 2)
ON CONFLICT DO NOTHING;

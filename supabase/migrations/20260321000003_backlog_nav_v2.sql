-- Update nav restructuration epic to 3 tabs + side panel
UPDATE dev_backlog SET 
  title = 'Navigation Restructuration (3 tabs + side panel)',
  description = 'Passer de 5 à 3 tabs: Sessions / Profils / Menu(≡). Le menu ouvre un side panel avec: Mon Profil, Book, Notifications, Settings, Admin',
  updated_at = now()
WHERE title = 'Navigation Restructuration (4 tabs)' AND type = 'epic';

-- Update stories
UPDATE dev_backlog SET 
  title = 'BottomNav: 3 tabs (Sessions, Profils, Menu≡) — supprimer Chats et Book',
  updated_at = now()
WHERE title LIKE 'BottomNav: renommer Plans%' AND type = 'story';

-- Add new stories for side panel
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic' LIMIT 1), 'Side Panel drawer component (slide from right, backdrop blur)', 'todo', 2, '{nav,component}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic' LIMIT 1), 'Side Panel: Mon Profil link + avatar preview', 'todo', 3, '{nav,profil}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic' LIMIT 1), 'Side Panel: Book section (Contacts + Groupes + DM)', 'todo', 4, '{nav,book}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic' LIMIT 1), 'Side Panel: Notifications avec badge unread', 'todo', 5, '{nav,notifications}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic' LIMIT 1), 'Side Panel: Settings (notifs, géoloc, visibilité, adresses, langue, déco)', 'todo', 6, '{nav,settings}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic' LIMIT 1), 'Side Panel: Admin link (si is_admin)', 'todo', 7, '{nav,admin}', 0.5)
ON CONFLICT DO NOTHING;

-- Add SessionPage redesign epic
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'SessionPage Visual Redesign', 'Refonte visuelle complète: hero gradient vivid, avatar rings, cards glow, CTA sticky shimmer, layout repensé', 'todo', 16, '{design,session,ux,priority}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'SessionPage Visual Redesign' AND type = 'epic'), 'Hero: gradient 180px + orbs vivides peach/lav + fade overlay', 'todo', 1, '{design,session}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'SessionPage Visual Redesign' AND type = 'epic'), 'Tabs header: Candidats/Membres/Partager redesign avec indicateurs', 'todo', 2, '{design,session}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'SessionPage Visual Redesign' AND type = 'epic'), 'Lineup: avatar rings gradient + statut badges (arrivé/en route)', 'todo', 3, '{design,session}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'SessionPage Visual Redesign' AND type = 'epic'), 'Cards: border glow subtle + glass effect', 'todo', 4, '{design,session}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'SessionPage Visual Redesign' AND type = 'epic'), 'CTA sticky bottom: shimmer + gradient fade background', 'todo', 5, '{design,session}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'SessionPage Visual Redesign' AND type = 'epic'), 'Responsive: vérifier 375px/430px', 'todo', 6, '{design,responsive}', 1)
ON CONFLICT DO NOTHING;

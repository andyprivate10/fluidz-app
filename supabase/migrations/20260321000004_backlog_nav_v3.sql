-- Update nav epic to 5 tabs + hamburger
UPDATE dev_backlog SET 
  title = 'Navigation Restructuration (5 tabs + hamburger menu)',
  description = 'Home / Sessions / Chats / Profils + ≡ Menu hamburger (drawer latéral avec: Mon Profil, Book, Notifications, Settings, Admin)',
  updated_at = now()
WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic';

-- Update BottomNav story
UPDATE dev_backlog SET 
  title = 'BottomNav: 5 tabs (Home, Sessions, Chats, Profils, ≡Menu)',
  updated_at = now()
WHERE title LIKE 'BottomNav:%' AND type = 'story' 
  AND epic_id IN (SELECT id FROM dev_backlog WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic');

-- Add Home tab story
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic' LIMIT 1), 'Home tab: activité, sessions impliquées, raccourcis', 'todo', 2, '{home,activity}', 3)
ON CONFLICT DO NOTHING;

-- Add Sessions tab story  
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Navigation Restructuration%' AND type = 'epic' LIMIT 1), 'Sessions tab: actives + candidatures + rejoindre + créer', 'todo', 3, '{sessions}', 2)
ON CONFLICT DO NOTHING;

-- Epic: Nav Restructuration
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Navigation Restructuration (4 tabs)', 'Passer de 5 à 4 tabs: Sessions / Profils / Book / Moi. Fusionner Profil+Adulte, créer Settings, déplacer Groupes dans Book, retirer Chats du BottomNav', 'todo', 15, '{nav,ux,priority}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Navigation Restructuration (4 tabs)' AND type = 'epic'), 'BottomNav: renommer Plans → Sessions, supprimer tab Chats (5→4 tabs)', 'todo', 1, '{nav,bottomnav}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Navigation Restructuration (4 tabs)' AND type = 'epic'), 'SessionsPage: mes sessions actives + candidatures + rejoindre + créer', 'todo', 2, '{sessions,ux}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Navigation Restructuration (4 tabs)' AND type = 'epic'), 'Book: intégrer Groupes + DM directs dans le Book', 'todo', 3, '{book,contacts,groups}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Navigation Restructuration (4 tabs)' AND type = 'epic'), 'MePage: fusionner Profil + Adulte en un seul espace profil', 'todo', 4, '{profil,mepage}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Navigation Restructuration (4 tabs)' AND type = 'epic'), 'MePage: créer section Settings (notifs, géoloc, visibilité, adresses, langue, déconnexion)', 'todo', 5, '{settings,mepage}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Navigation Restructuration (4 tabs)' AND type = 'epic'), 'MePage: intégrer Notifications dans Moi', 'todo', 6, '{notifications,mepage}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Navigation Restructuration (4 tabs)' AND type = 'epic'), 'Profils tab: galerie profiles (Explore) en standalone', 'todo', 7, '{explore,profils}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Navigation Restructuration (4 tabs)' AND type = 'epic'), 'Vérifier tous les liens/redirects après restructuration', 'todo', 8, '{testing,nav}', 2)
ON CONFLICT DO NOTHING;

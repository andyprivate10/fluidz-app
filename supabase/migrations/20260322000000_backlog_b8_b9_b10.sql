-- B8: Profil enrichi (Visitor + Langues)
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Profil enrichi: Localisation + Langues + Visitor', 'Pays/Ville dans profil, tag Visitor si hors pays, langues parlées', 'backlog', 46, '{profil,ux}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Profil enrichi: Localisation%' AND type = 'epic'), 'Champ Pays/Ville dans profil (home_country, home_city)', 'backlog', 1, '{profil,db}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Profil enrichi: Localisation%' AND type = 'epic'), 'Tag Visitor automatique si géoloc hors pays origine', 'backlog', 2, '{profil,geoloc}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Profil enrichi: Localisation%' AND type = 'epic'), 'Langues parlées: multi-select dans profil', 'backlog', 3, '{profil,ux}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Profil enrichi: Localisation%' AND type = 'epic'), 'Affichage Visitor badge + langues sur PublicProfile', 'backlog', 4, '{profil,design}', 1)
ON CONFLICT DO NOTHING;

-- B9: Recommander session/profil
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Recommander session/profil a un contact', 'Bouton Recommander sur SessionPage et PublicProfile, envoie notif au contact du Naughty Book', 'backlog', 47, '{social,contacts}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Recommander session/profil%' AND type = 'epic'), 'Bouton Recommander sur SessionPage + PublicProfile', 'backlog', 1, '{ux}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Recommander session/profil%' AND type = 'epic'), 'Bottom sheet: sélectionner contacts du Book', 'backlog', 2, '{ux,contacts}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Recommander session/profil%' AND type = 'epic'), 'Notification au contact avec lien session/profil', 'backlog', 3, '{notifications}', 1)
ON CONFLICT DO NOTHING;

-- B10: Adresse exacte améliorée
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Creation session: adresse exacte Google Places', 'Autocomplete Google Maps, sélection adresses enregistrées, avertissement repositionné', 'backlog', 48, '{session,ux,maps}')
ON CONFLICT DO NOTHING;

INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Creation session: adresse exacte%' AND type = 'epic'), 'Google Places Autocomplete sur champ adresse exacte', 'backlog', 1, '{maps,api}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Creation session: adresse exacte%' AND type = 'epic'), 'Champs séparés: adresse, code postal, ville, pays', 'backlog', 2, '{ux,session}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Creation session: adresse exacte%' AND type = 'epic'), 'Sélectionner une adresse enregistrée + présélection dernière', 'backlog', 3, '{ux,addresses}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title LIKE 'Creation session: adresse exacte%' AND type = 'epic'), 'Avertissement adresse révélée repositionné au-dessus du champ', 'backlog', 4, '{ux,design}', 0.5)
ON CONFLICT DO NOTHING;

-- B8: Profil Visitor + Langues
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Profil enrichi: Visitor tag + Langues', 'Home Pays/Ville + tag Visitor auto si hors pays + langues parlées multi-select', 'backlog', 50, '{profil,ux}')
ON CONFLICT DO NOTHING;
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Profil enrichi: Visitor tag + Langues' AND type = 'epic'), 'Champ Home Pays/Ville dans profil + sauvegarde profile_json', 'backlog', 1, '{profil}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Profil enrichi: Visitor tag + Langues' AND type = 'epic'), 'Tag Visitor auto si geoloc hors pays origine', 'backlog', 2, '{profil,geoloc}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Profil enrichi: Visitor tag + Langues' AND type = 'epic'), 'Langues parlees multi-select dans profil', 'backlog', 3, '{profil}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Profil enrichi: Visitor tag + Langues' AND type = 'epic'), 'Affichage Visitor tag + langues sur PublicProfile et Explore', 'backlog', 4, '{ux,display}', 2)
ON CONFLICT DO NOTHING;

-- B9: Recommander session/profil
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Recommander session/profil a un contact', 'Bouton Recommander sur SessionPage/PublicProfile → bottom sheet contacts → notif/DM', 'backlog', 51, '{social,naughtybook}')
ON CONFLICT DO NOTHING;
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Recommander session/profil a un contact' AND type = 'epic'), 'Bouton Recommander sur SessionPage et PublicProfile', 'backlog', 1, '{ux}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Recommander session/profil a un contact' AND type = 'epic'), 'Bottom sheet selection contacts Naughty Book', 'backlog', 2, '{ux,contacts}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Recommander session/profil a un contact' AND type = 'epic'), 'Notification/DM au destinataire avec lien', 'backlog', 3, '{notifications}', 2)
ON CONFLICT DO NOTHING;

-- B10: Adresse exacte Google Maps
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'CreateSession: adresse exacte Google Maps', 'Autocomplete Places API, champs structures, adresses enregistrees, pre-selection derniere, warning au-dessus du champ', 'backlog', 52, '{session,maps,ux}')
ON CONFLICT DO NOTHING;
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'CreateSession: adresse exacte Google Maps' AND type = 'epic'), 'Google Places autocomplete sur champ adresse', 'backlog', 1, '{maps,api}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'CreateSession: adresse exacte Google Maps' AND type = 'epic'), 'Champs structures: adresse, code postal, ville, pays', 'backlog', 2, '{session,form}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'CreateSession: adresse exacte Google Maps' AND type = 'epic'), 'Dropdown adresses enregistrees + pre-selection derniere', 'backlog', 3, '{session,addresses}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'CreateSession: adresse exacte Google Maps' AND type = 'epic'), 'Warning adresse exacte place juste au-dessus du champ', 'backlog', 4, '{ux}', 0.5)
ON CONFLICT DO NOTHING;

-- B11: Ecran partage + invitations
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Ecran partage session + options invitation', 'Message pre-formate + copier + WhatsApp/Instagram/share + 5 types invitations', 'backlog', 53, '{session,sharing,invitations}')
ON CONFLICT DO NOTHING;
INSERT INTO dev_backlog (type, epic_id, title, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage session + options invitation' AND type = 'epic'), 'Message pre-formate + bouton Copier', 'backlog', 1, '{sharing}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage session + options invitation' AND type = 'epic'), 'Boutons WhatsApp/Instagram/partage systeme', 'backlog', 2, '{sharing}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage session + options invitation' AND type = 'epic'), 'Lien fixe candidature regenerable', 'backlog', 3, '{invitations}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage session + options invitation' AND type = 'epic'), 'Lien 10min consultation regenerable', 'backlog', 4, '{invitations}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage session + options invitation' AND type = 'epic'), 'Lien invitation directe membre (bypass candidature)', 'backlog', 5, '{invitations}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage session + options invitation' AND type = 'epic'), 'Inviter depuis profils Naughty Book in-app', 'backlog', 6, '{invitations,contacts}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Ecran partage session + options invitation' AND type = 'epic'), 'Inviter un groupe Naughty Book', 'backlog', 7, '{invitations,groups}', 1)
ON CONFLICT DO NOTHING;

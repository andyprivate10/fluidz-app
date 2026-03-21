-- Seed backlog: DM Contact System + Interaction Levels

-- Epic B6: DM Contact System (Apply to DM)
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'DM Contact System (Apply to DM)', 'Entrer en contact avec un profil : DM direct si autorisé, sinon Apply to DM avec message + sections profil partagées', 'backlog', 50, '{dm,contact,core}')
ON CONFLICT DO NOTHING;

-- Stories B6
INSERT INTO dev_backlog (type, epic_id, title, description, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic' LIMIT 1),
   'Setting profil accept_dm_from (everyone/contacts_only/apply_only)',
   'Ajout du champ dans profile_json + UI dans MePage onglet Compte', 'backlog', 1, '{profil,settings}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic' LIMIT 1),
   'Bouton DM direct sur PublicProfile (si autorisé)',
   'Afficher DM button seulement si le profil accepte les DM de inconnus ou si déjà contact', 'backlog', 2, '{dm,ux}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic' LIMIT 1),
   'Apply to DM : formulaire (message + toggle sections profil)',
   'Bottom sheet avec textarea 280 chars + candidate pack toggles comme ApplyPage', 'backlog', 3, '{dm,ux,core}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic' LIMIT 1),
   'Notification "X veut entrer en contact" + vue review',
   'Notification au destinataire avec message + sections partagées, boutons accepter/refuser', 'backlog', 4, '{notifications,dm}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic' LIMIT 1),
   'Acceptation : ouvrir DM 1-to-1 + ajout contacts mutuels',
   'On accept: créer DM room, upsert contacts bidirectionnel level connaissance', 'backlog', 5, '{dm,contacts}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic' LIMIT 1),
   'Refus : notification discrète + cooldown 30 jours',
   'Pas de spam, timer avant re-apply, notification minimaliste', 'backlog', 6, '{dm,safety}', 1),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'DM Contact System (Apply to DM)' AND type = 'epic' LIMIT 1),
   'Request intent type : Rencontre / Plan ce soir / Discuter / Inviter session',
   'Select dans le formulaire Apply to DM, filtrable par le destinataire', 'backlog', 7, '{dm,intent}', 2)
ON CONFLICT DO NOTHING;

-- Epic B7: Interaction Levels & Intent Matching
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  ('epic', 'Niveaux interaction & Intent Matching', 'Échelle de relations (inconnu→connaissance→contact→favori→bloqué) + matching d''intents entre profils', 'backlog', 51, '{interactions,matching,core}')
ON CONFLICT DO NOTHING;

-- Stories B7
INSERT INTO dev_backlog (type, epic_id, title, description, status, priority, tags, estimated_hours) VALUES
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic' LIMIT 1),
   'Modèle relation_level étendu (inconnu→demande→connaissance→contact→favori→bloqué)',
   'Refactorer contacts.relation_level + UI dans ContactDetail', 'backlog', 1, '{contacts,data}', 3),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic' LIMIT 1),
   'Visibilité profil conditionnelle par niveau de relation',
   'Inconnu=public seulement, connaissance=basique, contact=complet, bloqué=invisible', 'backlog', 2, '{profil,privacy}', 4),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic' LIMIT 1),
   'Intent profil : définir ce que je cherche (Plans group, 1-to-1, Amitié, Ce soir)',
   'Champ dans profile_json + UI dans MePage', 'backlog', 3, '{intent,profil}', 2),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic' LIMIT 1),
   'Matching automatique : notification quand 2 profils à proximité ont intents compatibles',
   'Cron ou trigger sur location_updated_at, opt-in uniquement', 'backlog', 4, '{intent,matching}', 6),
  ('story', (SELECT id FROM dev_backlog WHERE title = 'Niveaux interaction & Intent Matching' AND type = 'epic' LIMIT 1),
   'Ghost intent temporaire',
   'Les ghosts peuvent définir un intent sans compte, expire avec le ghost session', 'backlog', 5, '{ghost,intent}', 2)
ON CONFLICT DO NOTHING;

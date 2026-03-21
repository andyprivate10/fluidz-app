-- Dev Backlog — epics + user stories for project tracking
CREATE TABLE IF NOT EXISTS dev_backlog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('epic', 'story')),
  epic_id uuid REFERENCES dev_backlog(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'done', 'cancelled')),
  priority integer NOT NULL DEFAULT 100,
  tags text[] DEFAULT '{}',
  assigned_to text,
  estimated_hours numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_backlog_type ON dev_backlog(type, priority);
CREATE INDEX IF NOT EXISTS idx_dev_backlog_epic ON dev_backlog(epic_id) WHERE epic_id IS NOT NULL;
ALTER TABLE dev_backlog ENABLE ROW LEVEL SECURITY;

-- Admins can manage backlog
DO $$ BEGIN
CREATE POLICY "Admins manage dev_backlog" ON dev_backlog
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anyone can read (for transparency)
DO $$ BEGIN
CREATE POLICY "Anyone can read dev_backlog" ON dev_backlog
  FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed initial epics and stories from REFONTE_PLAN backlog
INSERT INTO dev_backlog (type, title, description, status, priority, tags) VALUES
  -- Epic B1: Paiements
  ('epic', 'Paiements entre membres', 'Remboursement de frais + paiement in-app', 'backlog', 10, ARRAY['payments', 'B1']),
  -- Epic B2: Vestiaire
  ('epic', 'Vestiaire numérique', 'Ticket QR, scan dépôt/retrait, dashboard staff', 'backlog', 20, ARRAY['b2b', 'B2']),
  -- Epic B3: Emergency
  ('epic', 'Emergency / Sécurité', 'Bouton panique, broadcast urgence, alerte staff', 'backlog', 30, ARRAY['safety', 'B3']),
  -- Epic B4: Discovery
  ('epic', 'Discovery / Feed', 'Sessions publiques, feed activité, recommandations', 'backlog', 40, ARRAY['discovery', 'B4']),
  -- Epic B5: Monetisation
  ('epic', 'Monétisation avancée', 'Plans premium, tipping, tickets B2B', 'backlog', 50, ARRAY['monetisation', 'B5']),
  -- Active sprints
  ('epic', 'UX Circuits — Flow testing', 'Tester et corriger chaque parcours utilisateur end-to-end', 'in_progress', 1, ARRAY['ux', 'sprint']),
  ('epic', 'Admin Dashboard', 'Dashboard admin 8 tabs complet', 'done', 0, ARRAY['admin', 'done'])
ON CONFLICT DO NOTHING;

-- Stories for B1 Paiements
WITH b1 AS (SELECT id FROM dev_backlog WHERE title = 'Paiements entre membres' LIMIT 1)
INSERT INTO dev_backlog (type, epic_id, title, description, status, priority, tags) VALUES
  ('story', (SELECT id FROM b1), 'Ajouter infos paiement au profil', 'QR Revolut, lien Wise, IBAN dans profile_json', 'backlog', 11, ARRAY['payments']),
  ('story', (SELECT id FROM b1), 'Créer un split après session', 'Host crée un split : montant total + description', 'backlog', 12, ARRAY['payments']),
  ('story', (SELECT id FROM b1), 'Afficher montant dû + lien paiement', 'Chaque membre voit le montant + QR/lien du host', 'backlog', 13, ARRAY['payments']),
  ('story', (SELECT id FROM b1), 'Statut paiement manuel', 'Toggle payé/pas payé par le host', 'backlog', 14, ARRAY['payments']),
  ('story', (SELECT id FROM b1), 'Session payante (escrow)', 'Prix d''entrée, paiement avant adresse, Stripe Connect', 'backlog', 15, ARRAY['payments', 'phase2'])
ON CONFLICT DO NOTHING;

-- Stories for UX Circuits
WITH ux AS (SELECT id FROM dev_backlog WHERE title = 'UX Circuits — Flow testing' LIMIT 1)
INSERT INTO dev_backlog (type, epic_id, title, description, status, priority, tags) VALUES
  ('story', (SELECT id FROM ux), 'Circuit Login → Home → Profil', 'Tester login magic link + navigation + profil complet', 'todo', 1, ARRAY['ux']),
  ('story', (SELECT id FROM ux), 'Circuit Créer session → Partager → Candidature', 'Flow complet host side', 'todo', 2, ARRAY['ux']),
  ('story', (SELECT id FROM ux), 'Circuit Vote → Accept → Check-in → Adresse', 'Flow candidat accepté', 'todo', 3, ARRAY['ux']),
  ('story', (SELECT id FROM ux), 'Circuit Ghost → Setup → Apply → Recover', 'Flow utilisateur sans compte', 'todo', 4, ARRAY['ux']),
  ('story', (SELECT id FROM ux), 'Circuit DM → Messages → Notifications', 'Communication entre membres', 'todo', 5, ARRAY['ux'])
ON CONFLICT DO NOTHING;

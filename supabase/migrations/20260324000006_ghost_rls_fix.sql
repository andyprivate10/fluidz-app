-- Ghost signup RLS: allow anonymous inserts and reads
DROP POLICY IF EXISTS "anon_ghost_create" ON ghost_sessions;
CREATE POLICY "anon_ghost_create" ON ghost_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon_ghost_read" ON ghost_sessions;
CREATE POLICY "anon_ghost_read" ON ghost_sessions FOR SELECT USING (true);

-- Tighten group message RLS: only session host or accepted/checked-in members can read group messages
DROP POLICY IF EXISTS "Users can read messages they are part of" ON messages;

CREATE POLICY "Users can read messages they are part of"
  ON messages FOR SELECT
  USING (
    (room_type = 'dm' AND (sender_id = auth.uid() OR dm_peer_id = auth.uid()))
    OR (
      room_type = 'group'
      AND (
        -- Session host can read all group messages
        EXISTS (SELECT 1 FROM sessions WHERE sessions.id = messages.session_id AND sessions.host_id = auth.uid())
        -- Accepted/checked-in members can read group messages created after their acceptance
        OR EXISTS (
          SELECT 1 FROM applications
          WHERE applications.session_id = messages.session_id
            AND applications.applicant_id = auth.uid()
            AND applications.status IN ('accepted', 'checked_in')
            AND messages.created_at >= applications.created_at
        )
      )
    )
  );

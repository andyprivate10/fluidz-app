-- Rename "Alchemy" template → "Powder Room" (if not already done)

-- Update session_template slug/label
UPDATE admin_config SET slug = 'powder_room', label = 'Powder Room'
  WHERE slug = 'alchemy' AND type = 'session_template';

-- Update session_tag if exists
UPDATE admin_config SET slug = 'powder_room', label = 'Powder Room'
  WHERE slug = 'alchemy' AND type = 'session_tag';

-- Update sessions referencing the old template
UPDATE sessions SET template_slug = 'powder_room' WHERE template_slug = 'alchemy';

-- Update session tags arrays
UPDATE sessions SET tags = array_replace(tags, 'Alchemy', 'Powder Room')
  WHERE 'Alchemy' = ANY(tags);

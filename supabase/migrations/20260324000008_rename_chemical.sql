-- Rename "Chemical" template → "Powder Room"

-- Update session_tag
UPDATE admin_config SET slug = 'powder_room', label = 'Powder Room'
  WHERE slug = 'chemical' AND type = 'session_tag';

-- Update session_template
UPDATE admin_config SET slug = 'powder_room', label = 'Powder Room'
  WHERE slug = 'chemical' AND type = 'session_template';

UPDATE admin_config SET meta = jsonb_set(
  jsonb_set(
    jsonb_set(meta, '{description}', '"Ambiance mysterieuse, entre inities"'),
    '{tags}', '["Powder Room", "Hot", "Party"]'
  ),
  '{color}', '"#9080BA"'
)
WHERE slug = 'powder_room' AND type = 'session_template';

-- Update sessions referencing the old template
UPDATE sessions SET template_slug = 'powder_room' WHERE template_slug = 'chemical';

-- Update session tags arrays
UPDATE sessions SET tags = array_replace(tags, 'Chemical', 'Powder Room')
  WHERE 'Chemical' = ANY(tags);

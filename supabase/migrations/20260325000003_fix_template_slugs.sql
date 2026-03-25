-- Fix template_slug values that don't match COVER_IMAGES keys

-- darkroom → dark_room (underscore format)
UPDATE sessions SET template_slug = 'dark_room' WHERE template_slug = 'darkroom';

-- custom → real slugs based on tags/title
UPDATE sessions SET template_slug = 'leather' WHERE template_slug = 'custom' AND tags @> ARRAY['leather'];
UPDATE sessions SET template_slug = 'after' WHERE template_slug = 'custom' AND title ILIKE '%after%';

-- Remaining custom/null: derive slug from first tag
UPDATE sessions SET template_slug = COALESCE(
  (SELECT lower(replace(t.tag, ' ', '_')) FROM unnest(tags) AS t(tag) LIMIT 1),
  'custom'
) WHERE template_slug = 'custom' OR template_slug IS NULL;

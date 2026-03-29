-- Add cuddle template to admin_config
INSERT INTO admin_config (type, slug, label, category, sort_order, active, meta)
VALUES ('session_template', 'cuddle', 'Cuddle', NULL, 4, true,
  '{"tags": ["Chill", "Intimacy"], "color": "#F9A8A8", "description": "Session câlins et tendresse, ambiance safe et douce"}'::jsonb)
ON CONFLICT (category, slug) DO NOTHING;

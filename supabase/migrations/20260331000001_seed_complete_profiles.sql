-- ═══ SEED COMPLETE TEST PROFILES ═══
-- Enriches Marcus, Karim, Yann with full profile data
-- Uses picsum.photos as placeholder images (public, no CORS issues)

-- Marcus: Host, Versatile, 32, Paris 11e, PrEP actif
UPDATE user_profiles SET
  display_name = 'Marcus',
  profile_json = jsonb_build_object(
    'age', 32,
    'bio', 'Host régulier, ambiance safe et respectueuse. Sportif, ouvert d''esprit. Toujours partant pour de nouvelles rencontres.',
    'role', 'Versatile',
    'orientation', 'Gay',
    'morphology', 'Sportif',
    'height', 182,
    'weight', 78,
    'location', 'Paris 11e',
    'home_city', 'Paris',
    'home_country', 'France',
    'languages', jsonb_build_array('Français', 'English', 'Español'),
    'ethnicities', jsonb_build_array('caucasian'),
    'tribes', jsonb_build_array('jock', 'leather'),
    'kinks', jsonb_build_array('Dominant', 'SM léger', 'Cuir', 'Group', 'Fétichisme'),
    'limits', 'Pas de bareback sans PrEP/test récent. Toujours safe.',
    'dm_privacy', 'open',
    'health', jsonb_build_object(
      'prep_status', 'Actif',
      'dernier_test', '2026-03-15',
      'sero_status', 'Négatif',
      'tested', true,
      'last_test', '2026-03-15',
      'prep', true
    ),
    'avatar_url', 'https://picsum.photos/seed/marcus1/400/400',
    'photos_profil', jsonb_build_array(
      'https://picsum.photos/seed/marcus1/400/400',
      'https://picsum.photos/seed/marcus2/400/400',
      'https://picsum.photos/seed/marcus3/400/400'
    ),
    'photos_intime', jsonb_build_array(
      'https://picsum.photos/seed/marcusA/400/500',
      'https://picsum.photos/seed/marcusB/400/500'
    ),
    'body_part_photos', jsonb_build_object(
      'torso', 'https://picsum.photos/seed/marcusT/300/400'
    ),
    'section_visibility', jsonb_build_object(
      'photos_adulte', 'naughtybook',
      'body_part_photos', 'naughtybook',
      'kinks', 'all',
      'health', 'all',
      'limits', 'all'
    ),
    'linked_profiles', '[]'::jsonb,
    'platform_profiles', '[]'::jsonb,
    'occasion', 'Ce soir si le feeling est bon',
    'searching_for', jsonb_build_array('Bottom', 'Versatile')
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'marcus@fluidz.test');

-- Karim: Bottom, 28, Paris 3e, test récent
UPDATE user_profiles SET
  display_name = 'Karim',
  profile_json = jsonb_build_object(
    'age', 28,
    'bio', 'Chill et curieux. J''aime les plans détendus entre mecs cool. Bon vivant, souriant.',
    'role', 'Bottom',
    'orientation', 'Gay',
    'morphology', 'Athlétique',
    'height', 175,
    'weight', 72,
    'location', 'Paris 3e',
    'home_city', 'Paris',
    'home_country', 'France',
    'languages', jsonb_build_array('Français', 'العربية'),
    'ethnicities', jsonb_build_array('middle_eastern'),
    'tribes', jsonb_build_array('otter', 'cub'),
    'kinks', jsonb_build_array('Soumis', 'Massage', 'Câlins', 'Jeux de rôle'),
    'limits', 'Pas de douleur forte. Communication avant tout.',
    'dm_privacy', 'profile_required',
    'health', jsonb_build_object(
      'prep_status', 'Actif',
      'dernier_test', '2026-03-01',
      'sero_status', 'Négatif',
      'tested', true,
      'last_test', '2026-03-01',
      'prep', true
    ),
    'avatar_url', 'https://picsum.photos/seed/karim1/400/400',
    'photos_profil', jsonb_build_array(
      'https://picsum.photos/seed/karim1/400/400',
      'https://picsum.photos/seed/karim2/400/400'
    ),
    'photos_intime', jsonb_build_array(
      'https://picsum.photos/seed/karimA/400/500'
    ),
    'body_part_photos', jsonb_build_object(
      'butt', 'https://picsum.photos/seed/karimB/300/400'
    ),
    'section_visibility', jsonb_build_object(
      'photos_adulte', 'naughtybook',
      'body_part_photos', 'naughtybook',
      'kinks', 'all',
      'health', 'all',
      'limits', 'naughtybook'
    ),
    'linked_profiles', '[]'::jsonb,
    'platform_profiles', '[]'::jsonb,
    'occasion', 'Week-end détente',
    'searching_for', jsonb_build_array('Top', 'Versatile')
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'karim@fluidz.test');

-- Yann: Versatile, 25, Paris 18e
UPDATE user_profiles SET
  display_name = 'Yann',
  profile_json = jsonb_build_object(
    'age', 25,
    'bio', 'Parisien discret, créatif. Photographe amateur. J''aime les ambiances feutrées et les gens authentiques.',
    'role', 'Top',
    'orientation', 'Gay',
    'morphology', 'Mince',
    'height', 178,
    'weight', 68,
    'location', 'Paris 18e',
    'home_city', 'Paris',
    'home_country', 'France',
    'languages', jsonb_build_array('Français', 'English'),
    'ethnicities', jsonb_build_array('asian'),
    'tribes', jsonb_build_array('twink', 'geek'),
    'kinks', jsonb_build_array('Domination douce', 'Massage', 'Voyeur'),
    'limits', 'Toujours avec consentement explicite.',
    'dm_privacy', 'open',
    'health', jsonb_build_object(
      'prep_status', 'Non',
      'dernier_test', '2026-02-10',
      'sero_status', 'Négatif',
      'tested', true,
      'last_test', '2026-02-10',
      'prep', false
    ),
    'avatar_url', 'https://picsum.photos/seed/yann1/400/400',
    'photos_profil', jsonb_build_array(
      'https://picsum.photos/seed/yann1/400/400',
      'https://picsum.photos/seed/yann2/400/400',
      'https://picsum.photos/seed/yann3/400/400'
    ),
    'photos_intime', jsonb_build_array(
      'https://picsum.photos/seed/yannA/400/500',
      'https://picsum.photos/seed/yannB/400/500'
    ),
    'body_part_photos', jsonb_build_object(
      'torso', 'https://picsum.photos/seed/yannT/300/400',
      'feet', 'https://picsum.photos/seed/yannF/300/400'
    ),
    'section_visibility', jsonb_build_object(
      'photos_adulte', 'naughtybook',
      'body_part_photos', 'naughtybook',
      'kinks', 'all',
      'health', 'all',
      'limits', 'all'
    ),
    'linked_profiles', '[]'::jsonb,
    'platform_profiles', '[]'::jsonb,
    'occasion', 'Quand l''envie se présente',
    'searching_for', jsonb_build_array('Bottom', 'Versatile')
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'yann@fluidz.test');

-- Also enrich some demo profiles with more complete data
DO $$
DECLARE
  r record;
  avatar text;
BEGIN
  FOR r IN SELECT id, display_name FROM user_profiles WHERE id::text LIKE 'aaaa0001%' AND (profile_json->>'avatar_url') IS NULL
  LOOP
    avatar := 'https://picsum.photos/seed/' || r.display_name || '/400/400';
    UPDATE user_profiles SET profile_json = profile_json || jsonb_build_object(
      'orientation', 'Gay',
      'height', 180,
      'weight', 75,
      'dm_privacy', 'open',
      'languages', to_jsonb(ARRAY['Français']),
      'avatar_url', avatar,
      'photos_profil', to_jsonb(ARRAY[avatar])
    ) WHERE id = r.id;
  END LOOP;
END $$;

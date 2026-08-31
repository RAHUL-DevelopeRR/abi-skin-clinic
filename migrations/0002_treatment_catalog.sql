UPDATE services SET active = 0, updated_at = CURRENT_TIMESTAMP
WHERE id NOT IN (
  'unwanted-hair', 'acne-scar', 'pigmentation-laser', 'facial-warts-laser',
  'cryotherapy', 'tattoo-removal', 'psoriasis', 'vitiligo',
  'hair-loss-alopecia', 'urticaria', 'lichen-planus', 'eczema',
  'fungal-ringworm', 'nail-disease', 'ipl-skin-glow', 'general'
);

INSERT INTO services (id, name, active, sort_order) VALUES
  ('unwanted-hair', 'Unwanted Hair Removal', 1, 10),
  ('acne-scar', 'Acne & Acne Scar Treatment', 1, 20),
  ('pigmentation-laser', 'Acne Pigmentation & Pigmentation Lasers', 1, 30),
  ('facial-warts-laser', 'Facial Wart Laser Treatment', 1, 40),
  ('cryotherapy', 'Liquid Nitrogen Cryotherapy', 1, 50),
  ('tattoo-removal', 'Laser Tattoo Removal', 1, 60),
  ('psoriasis', 'Psoriasis Treatment', 1, 70),
  ('vitiligo', 'Vitiligo Treatment', 1, 80),
  ('hair-loss-alopecia', 'Hair Loss & Alopecia Treatment', 1, 90),
  ('urticaria', 'Urticaria Treatment', 1, 100),
  ('lichen-planus', 'Lichen Planus Treatment', 1, 110),
  ('eczema', 'Eczema Treatment', 1, 120),
  ('fungal-ringworm', 'Fungal Infection (Ringworm)', 1, 130),
  ('nail-disease', 'Nail Disease & Nail Fungus', 1, 140),
  ('ipl-skin-glow', 'IPL Laser & Skin Glow', 1, 150),
  ('general', 'General Skin Consultation', 1, 160)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = CURRENT_TIMESTAMP;

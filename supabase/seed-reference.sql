-- ============================================================================
-- AvsarPath — REFERENCE seed data (real; safe for every environment,
-- including PRODUCTION)
--
-- Categories, states, organisations and qualifications: structural lookup data
-- the app needs to work. No opportunities, no demo rows. Idempotent (re-running
-- is a no-op thanks to ON CONFLICT DO NOTHING).
--
-- Demo opportunities for local development live in seed-demo.sql, which must
-- NEVER be run against production.
-- ============================================================================

insert into public.categories (id, name, slug, sort_order) values
  ('11111111-1111-1111-1111-111111110001', 'UPSC',             'upsc',           1),
  ('11111111-1111-1111-1111-111111110002', 'SSC',              'ssc',            2),
  ('11111111-1111-1111-1111-111111110003', 'Banking',          'banking',        3),
  ('11111111-1111-1111-1111-111111110004', 'Railways',         'railways',       4),
  ('11111111-1111-1111-1111-111111110005', 'Defence',          'defence',        5),
  ('11111111-1111-1111-1111-111111110006', 'State PSC (BPSC)', 'state-psc',      6),
  ('11111111-1111-1111-1111-111111110007', 'Entrance Exams',   'entrance-exams', 7),
  ('11111111-1111-1111-1111-111111110008', 'Scholarships',     'scholarships',   8)
on conflict (slug) do nothing;

insert into public.states (id, name, code, slug) values
  ('33333333-3333-3333-3333-333333330001', 'Bihar', 'BR', 'bihar')
on conflict (code) do nothing;

insert into public.organisations (id, name, slug, website) values
  ('22222222-2222-2222-2222-222222220001', 'Union Public Service Commission',  'upsc', 'https://upsc.gov.in/'),
  ('22222222-2222-2222-2222-222222220002', 'Staff Selection Commission',       'ssc',  'https://ssc.gov.in/'),
  ('22222222-2222-2222-2222-222222220003', 'Institute of Banking Personnel Selection', 'ibps', 'https://www.ibps.in/'),
  ('22222222-2222-2222-2222-222222220004', 'Railway Recruitment Board',        'rrb',  'https://www.rrbcdg.gov.in/'),
  ('22222222-2222-2222-2222-222222220005', 'Bihar Public Service Commission',  'bpsc', 'https://bpsc.bihar.gov.in/')
on conflict (slug) do nothing;

insert into public.qualifications (id, name, slug, rank, sort_order) values
  ('55555555-5555-5555-5555-555555550001', '10th Pass',    '10th',         1, 1),
  ('55555555-5555-5555-5555-555555550002', '12th Pass',    '12th',         2, 2),
  ('55555555-5555-5555-5555-555555550003', 'ITI',          'iti',          2, 3),
  ('55555555-5555-5555-5555-555555550004', 'Diploma',      'diploma',      3, 4),
  ('55555555-5555-5555-5555-555555550005', 'Graduate',     'graduate',     4, 5),
  ('55555555-5555-5555-5555-555555550006', 'Postgraduate', 'postgraduate', 5, 6)
on conflict (slug) do nothing;


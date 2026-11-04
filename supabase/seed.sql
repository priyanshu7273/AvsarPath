-- ============================================================================
-- AvsarPath — seed data
--
-- Part A (reference data: categories, states, organisations) is REAL
-- structural data and is safe for any environment.
--
-- Part B (demo opportunities) is DEMONSTRATION DATA FOR LOCAL DEVELOPMENT ONLY.
-- Every row is prefixed "[DEMO]" and sourced as "Demonstration data". Do NOT
-- run Part B against a production database — these are not real notifications.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Part A — reference data (real)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Part B — DEMONSTRATION DATA, LOCAL DEVELOPMENT ONLY. NOT REAL NOTIFICATIONS.
-- ----------------------------------------------------------------------------
insert into public.opportunities (
  id, organisation_id, category_id, state_id, opportunity_type, vacancies,
  application_start_date, application_end_date, publication_date,
  notification_url, application_url, source_name,
  verification_status, opportunity_status, is_published, published_at, last_verified_at
) values
  ('44444444-4444-4444-4444-444444440001',
   '22222222-2222-2222-2222-222222220002', '11111111-1111-1111-1111-111111110002', null,
   'job', 1200, '2026-11-10', '2026-12-10', '2026-11-05',
   '#', '#', 'Demonstration data — not a real notification',
   'verified', 'open', true, now(), now()),
  ('44444444-4444-4444-4444-444444440002',
   '22222222-2222-2222-2222-222222220005', '11111111-1111-1111-1111-111111110006',
   '33333333-3333-3333-3333-333333330001',
   'job', 350, '2026-11-01', '2026-11-30', '2026-10-28',
   '#', '#', 'Demonstration data — not a real notification',
   'verified', 'open', true, now(), now()),
  ('44444444-4444-4444-4444-444444440003',
   '22222222-2222-2222-2222-222222220001', '11111111-1111-1111-1111-111111110001', null,
   'exam', null, '2026-12-01', '2027-01-05', '2026-11-20',
   '#', '#', 'Demonstration data — not a real notification',
   'verified', 'upcoming', true, now(), now())
on conflict (id) do nothing;

insert into public.opportunity_translations (
  opportunity_id, locale, slug, title, description, qualification, eligibility,
  age_limit, application_fee, salary, selection_process
) values
  ('44444444-4444-4444-4444-444444440001', 'en',
   'demo-sample-clerk-recruitment-2026',
   '[DEMO] Sample Clerk Recruitment 2026',
   'Demonstration data for local development only. This is not a real notification. Replace with verified content from official sources.',
   '12th Pass', 'Indian citizen; see official notification.', '18–27 years',
   '₹100 (General); nil for SC/ST/PwD', '₹25,500 – ₹81,100', 'Written exam, skill test, document verification'),
  ('44444444-4444-4444-4444-444444440002', 'en',
   'demo-sample-state-field-assistant-2026',
   '[DEMO] Sample State Field Assistant 2026',
   'Demonstration data for local development only. This is not a real notification.',
   'Graduate', 'Domicile and category conditions apply; see official notification.', '21–37 years',
   '₹200 (General)', '₹29,200 – ₹92,300', 'Preliminary exam, main exam, interview'),
  ('44444444-4444-4444-4444-444444440003', 'en',
   'demo-sample-civil-services-exam-2026',
   '[DEMO] Sample Civil Services Exam 2026',
   'Demonstration data for local development only. This is not a real notification.',
   'Graduate', 'Indian citizen; number of attempts applies by category.', '21–32 years',
   '₹100 (General)', 'As per 7th CPC', 'Prelims, Mains, Interview')
on conflict (opportunity_id, locale) do nothing;

insert into public.exam_events (opportunity_id, event_type, title, event_date, date_status) values
  ('44444444-4444-4444-4444-444444440001', 'application_end', 'Last date to apply', '2026-12-10', 'official'),
  ('44444444-4444-4444-4444-444444440003', 'exam', 'Preliminary examination (tentative)', '2027-05-20', 'tentative')
on conflict do nothing;

-- Which qualifications make a person eligible for each demo opportunity
-- (drives qualification filtering and the Eligibility Finder).
insert into public.opportunity_qualifications (opportunity_id, qualification_id) values
  ('44444444-4444-4444-4444-444444440001', '55555555-5555-5555-5555-555555550002'), -- Clerk: 12th+
  ('44444444-4444-4444-4444-444444440001', '55555555-5555-5555-5555-555555550005'),
  ('44444444-4444-4444-4444-444444440001', '55555555-5555-5555-5555-555555550006'),
  ('44444444-4444-4444-4444-444444440002', '55555555-5555-5555-5555-555555550005'), -- Field Assistant: Graduate+
  ('44444444-4444-4444-4444-444444440002', '55555555-5555-5555-5555-555555550006'),
  ('44444444-4444-4444-4444-444444440003', '55555555-5555-5555-5555-555555550005'), -- Civil Services: Graduate+
  ('44444444-4444-4444-4444-444444440003', '55555555-5555-5555-5555-555555550006')
on conflict do nothing;

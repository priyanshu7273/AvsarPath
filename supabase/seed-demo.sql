-- ============================================================================
-- AvsarPath — DEMO seed data. DEVELOPMENT DATABASES ONLY.
--
-- NEVER run this against production. These are NOT real notifications: every
-- row is titled "[DEMO] …" and sourced as "Demonstration data".
--
-- Requires seed-reference.sql to have been run first (it references those
-- categories, states, organisations and qualifications by id).
-- ============================================================================

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

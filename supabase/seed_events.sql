insert into public.events (
  id,
  title,
  date,
  location,
  description,
  image_url,
  register_url,
  category,
  is_online,
  is_past
)
values
  (
    '11111111-1111-1111-1111-111111111101',
    'Spring Abroad Planning Night — New York',
    '2026-02-21T18:30:00-05:00',
    'Midtown Manhattan, New York',
    'An in-person planning night for families and students mapping out UK, Canada, Australia, and Europe options for the next intake cycle.',
    '',
    '/contact',
    'university_open_day',
    false,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'US Parent & Student Scholarship Webinar',
    '2026-03-14T19:00:00-04:00',
    'Online',
    'A focused webinar on merit scholarships, entrance awards, and how to shortlist universities with the strongest funding visibility.',
    '',
    '/contact',
    'scholarship',
    true,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Midwest Visa & Intake Clinic — Chicago',
    '2026-04-09T17:30:00-05:00',
    'Downtown Chicago',
    'A practical visa and intake clinic covering offer letters, document readiness, and the smartest way to prepare for summer and fall starts.',
    '',
    '/contact',
    'visa_talk',
    false,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'Pre-Departure Bootcamp — Dallas',
    '2026-05-10T10:00:00-05:00',
    'Dallas Arts District',
    'A pre-departure bootcamp for students ready to move from application mode into travel planning, packing, budgeting, and settlement prep.',
    '',
    '/contact',
    'pre_departure',
    false,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111105',
    'Atlanta Open Day: UK, Canada & Australia',
    '2026-06-12T13:00:00-04:00',
    'Buckhead, Atlanta',
    'Meet the Nexora team for one-on-one destination guidance, university shortlisting, and a live review of current admissions pathways.',
    '',
    '/contact',
    'university_open_day',
    false,
    false
  ),
  (
    '11111111-1111-1111-1111-111111111106',
    'Visa Masterclass — Build a Strong Study Plan',
    '2026-06-26T19:30:00-04:00',
    'Online',
    'A virtual masterclass on document strategy, visa readiness, funding proof, and how to present a stronger study story to universities.',
    '',
    '/contact',
    'visa_talk',
    true,
    false
  ),
  (
    '11111111-1111-1111-1111-111111111107',
    'Scholarship Saturday — West Coast Edition',
    '2026-07-18T11:00:00-07:00',
    'Downtown Los Angeles',
    'An in-person scholarship clinic built for students comparing tuition, merit aid, and postgraduate funding routes across multiple destinations.',
    '',
    '/contact',
    'scholarship',
    false,
    false
  ),
  (
    '11111111-1111-1111-1111-111111111108',
    'Fall Intakes Pre-Departure Mixer — Houston',
    '2026-08-08T14:00:00-05:00',
    'Houston Galleria District',
    'A friendly mixer for students heading out in the fall, with final document checks, packing tips, and a Q&A on settling in abroad.',
    '',
    '/contact',
    'pre_departure',
    false,
    false
  ),
  (
    '11111111-1111-1111-1111-111111111109',
    'Miami International Study Fair',
    '2026-09-05T12:00:00-04:00',
    'Brickell, Miami',
    'A broad study fair featuring destination briefings, application advice, and practical support for students and families exploring multiple countries.',
    '',
    '/contact',
    'university_open_day',
    false,
    false
  ),
  (
    '11111111-1111-1111-1111-111111111110',
    'Graduate Study & Funding Week',
    '2026-10-17T18:00:00-04:00',
    'Online',
    'A week-style webinar event covering master’s, PhD, research funding, assistantships, and the best graduate pathways for international students.',
    '',
    '/contact',
    'webinar',
    true,
    false
  )
on conflict (id) do update
set
  title = excluded.title,
  date = excluded.date,
  location = excluded.location,
  description = excluded.description,
  image_url = excluded.image_url,
  register_url = excluded.register_url,
  category = excluded.category,
  is_online = excluded.is_online,
  is_past = excluded.is_past;

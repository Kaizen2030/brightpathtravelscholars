const COUNTRY_META = {
  Canada: { slug: 'canada', flag: '\uD83C\uDDE8\uD83C\uDDE6' },
  USA: { slug: 'usa', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  UK: { slug: 'uk', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  Germany: { slug: 'germany', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  Australia: { slug: 'australia', flag: '\uD83C\uDDE6\uD83C\uDDFA' },
  UAE: { slug: 'uae', flag: '\uD83C\uDDE6\uD83C\uDDEA' },
  France: { slug: 'france', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  Netherlands: { slug: 'netherlands', flag: '\uD83C\uDDF3\uD83C\uDDF1' },
}

export const JOB_COUNTRIES = Object.keys(COUNTRY_META)
export const JOB_COUNTRY_OPTIONS = JOB_COUNTRIES.map((country) => ({
  country,
  ...COUNTRY_META[country],
}))

export const JOB_CATEGORY_OPTIONS = [
  'Agriculture',
  'Cleaning',
  'Construction',
  'Engineering',
  'Healthcare',
  'Hospitality',
  'IT',
  'Manufacturing',
  'Transport',
  'Warehouse',
]

const BASE_POSTED_DATE = new Date('2026-05-01T00:00:00Z')

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function addDays(baseDate, days) {
  const nextDate = new Date(baseDate)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate.toISOString().slice(0, 10)
}

function getCountryMetaInternal(country) {
  return COUNTRY_META[country] || { slug: slugify(country), flag: '\uD83C\uDF0D' }
}

function inferSalaryPeriod(salary) {
  const normalized = String(salary || '').toLowerCase()
  if (normalized.includes('/hour')) return 'hour'
  if (normalized.includes('/month')) return 'month'
  return 'year'
}

function buildDescription(job) {
  const workplace = `${job.region}, ${job.country}`
  const skillsLine =
    job.type === 'skilled'
      ? 'This role is suited to candidates who can bring practical experience and work independently.'
      : 'This role welcomes applicants with a strong work ethic and readiness to learn on the job.'

  return (
    `${job.title} with ${job.employer} in ${workplace}. ` +
    `It is a strong fit for candidates looking for an overseas opportunity in ${job.category.toLowerCase()} with a clear relocation path. ` +
    `${skillsLine}`
  )
}

function buildRequirements(job) {
  const requirements = [
    `Valid passport and willingness to relocate to ${job.country}.`,
    `${job.experience} in ${job.category.toLowerCase()} or a related workplace environment.`,
    `${job.language}.`,
    'Ability to follow workplace safety rules and shift schedules.',
    'References, screening, and medical checks may be requested during processing.',
  ]

  if (job.type === 'skilled') {
    requirements.splice(1, 1, `Practical hands-on experience in ${job.category.toLowerCase()} is required.`)
  } else {
    requirements.splice(1, 1, 'Motivation to learn and work reliably in a fast-moving team.')
  }

  if (job.visaSponsorship) {
    requirements.push('Be ready to share the documents needed for visa sponsorship processing.')
  }

  return requirements
}

function buildBenefits(job) {
  return [
    `Competitive ${inferSalaryPeriod(job.salary)}-based pay with overtime opportunities.`,
    job.visaSponsorship ? 'Visa sponsorship support available.' : 'Guidance with relocation documentation.',
    job.accommodationProvided ? 'Accommodation support or employer-arranged housing.' : 'Relocation guidance and local settling support.',
    'Structured onboarding and support from the hiring team.',
    'Renewable contract potential based on performance and employer needs.',
  ]
}

function createJob(country, tuple, index, countryOffset = 0) {
  const [
    id,
    title,
    region,
    type,
    category,
    salary,
    positions,
    experience,
    education,
    language,
    visaSponsorship,
    accommodationProvided,
    contractDuration,
    employer,
    imageKeyword,
    featured = false,
    status = 'open',
  ] = tuple

  const meta = getCountryMetaInternal(country)
  const offset = countryOffset + index * 2

  return {
    id,
    title,
    country,
    countrySlug: meta.slug,
    flag: meta.flag,
    region,
    type,
    category,
    salary,
    salaryPeriod: inferSalaryPeriod(salary),
    positions,
    experience,
    education,
    language,
    visaSponsorship,
    accommodationProvided,
    contractDuration,
    description: buildDescription({
      title,
      employer,
      region,
      country,
      category,
      type,
    }),
    requirements: buildRequirements({
      experience,
      category,
      country,
      language,
      visaSponsorship,
      type,
    }),
    benefits: buildBenefits({
      salary,
      visaSponsorship,
      accommodationProvided,
    }),
    employer,
    postedDate: addDays(BASE_POSTED_DATE, offset),
    deadline: addDays(BASE_POSTED_DATE, offset + 45 + (status === 'closing_soon' ? 7 : 0)),
    imageKeyword,
    featured,
    status,
  }
}

const CANADA_JOBS = [
  ['canada-long-haul-truck-driver-001', 'Long Haul Truck Driver', 'Ontario', 'skilled', 'Transport', 'CAD $55,000 - $78,000/year', 12, '2+ years', 'High School Diploma', 'English required', true, false, '2 years renewable', 'Northern Freight Canada', 'truck driver canada highway', true, 'open'],
  ['canada-farm-worker-002', 'Farm Worker', 'Alberta', 'unskilled', 'Agriculture', 'CAD $18 - $22/hour', 20, 'No experience required', 'Basic schooling', 'English basic', true, true, 'Seasonal with renewal', 'Prairie Harvest Fields', 'canada farm worker fields', false, 'open'],
  ['canada-registered-nurse-003', 'Registered Nurse', 'Ontario', 'skilled', 'Healthcare', 'CAD $72,000 - $94,000/year', 8, '3+ years', "Bachelor's Degree", 'English required', true, false, 'Permanent', 'Maple Care Hospitals', 'canada nurse hospital', true, 'closing_soon'],
  ['canada-construction-labourer-004', 'Construction Labourer', 'Alberta', 'unskilled', 'Construction', 'CAD $23 - $28/hour', 16, 'No experience required', 'Secondary school preferred', 'English basic', true, true, '2 years renewable', 'Rockline Builders', 'canada construction site', false, 'open'],
  ['canada-welder-005', 'Welder', 'Saskatchewan', 'skilled', 'Manufacturing', 'CAD $60,000 - $82,000/year', 10, '2+ years', 'Trade certificate', 'English required', true, false, '2 years renewable', 'Sask Steel Works', 'canada welder workshop', true, 'open'],
  ['canada-software-support-analyst-006', 'Software Support Analyst', 'Ontario', 'skilled', 'IT', 'CAD $62,000 - $86,000/year', 7, '2+ years', "Bachelor's Degree", 'English required', true, false, 'Permanent', 'Northstar Digital', 'canada software analyst office', true, 'open'],
  ['canada-hotel-housekeeping-supervisor-007', 'Hotel Housekeeping Supervisor', 'British Columbia', 'unskilled', 'Hospitality', 'CAD $20 - $24/hour', 6, '1+ year', 'High School Diploma', 'English basic', true, true, '2 years renewable', 'Coastline Suites', 'hotel housekeeping canada', false, 'open'],
  ['canada-heavy-equipment-mechanic-008', 'Heavy Equipment Mechanic', 'Alberta', 'skilled', 'Engineering', 'CAD $68,000 - $88,000/year', 5, '3+ years', 'Trade certificate', 'English required', true, false, 'Permanent', 'Northline Equipment', 'heavy equipment mechanic canada', true, 'open'],
  ['canada-warehouse-picker-009', 'Warehouse Picker', 'Ontario', 'unskilled', 'Warehouse', 'CAD $18 - $21/hour', 18, 'No experience required', 'Secondary school', 'English basic', true, true, '1 year renewable', 'Great Lakes Logistics', 'warehouse picker canada', false, 'open'],
  ['canada-child-care-assistant-010', 'Child Care Assistant', 'Manitoba', 'unskilled', 'Healthcare', 'CAD $19 - $23/hour', 9, 'No experience required', 'High School Diploma', 'English required', true, true, '2 years renewable', 'BrightKids Care Network', 'child care assistant canada', false, 'open'],
  ['canada-industrial-electrician-011', 'Industrial Electrician', 'Ontario', 'skilled', 'Engineering', 'CAD $70,000 - $92,000/year', 6, '4+ years', 'Trade certificate', 'English required', true, false, 'Permanent', 'Lakeside Industrial', 'industrial electrician canada', true, 'closing_soon'],
  ['canada-food-production-operator-012', 'Food Production Operator', 'Quebec', 'unskilled', 'Manufacturing', 'CAD $19 - $24/hour', 14, 'No experience required', 'Secondary school', 'French basic', true, true, '2 years renewable', 'Maple Foods Group', 'food production canada', false, 'open'],
  ['canada-carpenter-013', 'Carpenter', 'British Columbia', 'skilled', 'Construction', 'CAD $58,000 - $79,000/year', 7, '3+ years', 'Trade certificate', 'English required', true, false, '2 years renewable', 'Pacific Build Co', 'canada carpenter tools', true, 'open'],
  ['canada-fruit-farm-supervisor-014', 'Fruit Farm Supervisor', 'Nova Scotia', 'skilled', 'Agriculture', 'CAD $54,000 - $72,000/year', 4, '2+ years', 'College diploma', 'English required', true, true, 'Seasonal renewable', 'Atlantic Orchards', 'fruit farm canada', false, 'closing_soon'],
  ['canada-pharmacy-assistant-015', 'Pharmacy Assistant', 'Ontario', 'skilled', 'Healthcare', 'CAD $43,000 - $56,000/year', 11, '1+ year', 'Certificate or diploma', 'English required', true, false, 'Permanent', 'Heritage Pharmacy Group', 'pharmacy assistant canada', true, 'open'],
]

const USA_JOBS = [
  ['usa-warehouse-associate-001', 'Warehouse Associate', 'Texas', 'unskilled', 'Warehouse', 'USD $17 - $21/hour', 22, 'No experience required', 'High School Diploma', 'English required', true, true, '1 year renewable', 'Lone Star Distribution', 'usa warehouse worker', false, 'open'],
  ['usa-certified-nursing-assistant-002', 'Certified Nursing Assistant', 'Florida', 'unskilled', 'Healthcare', 'USD $32,000 - $42,000/year', 14, 'No experience required', 'Nursing certificate', 'English required', true, true, '1 year renewable', 'Sunrise Health Centers', 'usa nursing assistant hospital', false, 'open'],
  ['usa-software-engineer-003', 'Software Engineer', 'California', 'skilled', 'IT', 'USD $92,000 - $138,000/year', 10, '3+ years', "Bachelor's Degree", 'English required', true, false, 'Permanent', 'Pacific Cloud Labs', 'usa software engineer office', true, 'open'],
  ['usa-hotel-front-desk-agent-004', 'Hotel Front Desk Agent', 'Nevada', 'unskilled', 'Hospitality', 'USD $16 - $20/hour', 12, '1+ year', 'High School Diploma', 'English required', true, true, '2 years renewable', 'Desert View Hotels', 'hotel front desk usa', false, 'open'],
  ['usa-mechanical-engineer-005', 'Mechanical Engineer', 'Michigan', 'skilled', 'Engineering', 'USD $78,000 - $112,000/year', 8, '3+ years', "Bachelor's Degree", 'English required', true, false, 'Permanent', 'Motor City Systems', 'mechanical engineer factory usa', true, 'closing_soon'],
  ['usa-landscaping-crew-member-006', 'Landscaping Crew Member', 'Florida', 'unskilled', 'Agriculture', 'USD $15 - $19/hour', 18, 'No experience required', 'Secondary school', 'English basic', true, true, 'Seasonal with renewal', 'Green Horizon Services', 'usa landscaping workers', false, 'open'],
  ['usa-forklift-operator-007', 'Forklift Operator', 'Georgia', 'skilled', 'Warehouse', 'USD $18 - $24/hour', 9, '2+ years', 'Forklift certificate', 'English required', true, false, '1 year renewable', 'Peach State Logistics', 'forklift operator warehouse usa', true, 'open'],
  ['usa-data-analyst-008', 'Data Analyst', 'New York', 'skilled', 'IT', 'USD $72,000 - $104,000/year', 6, '2+ years', "Bachelor's Degree", 'English required', true, false, 'Permanent', 'Empire Analytics', 'data analyst usa office', true, 'open'],
  ['usa-housekeeping-attendant-009', 'Housekeeping Attendant', 'California', 'unskilled', 'Hospitality', 'USD $15 - $18/hour', 15, 'No experience required', 'Secondary school', 'English basic', true, true, '1 year renewable', 'Golden Coast Resorts', 'housekeeping hotel usa', false, 'open'],
  ['usa-meat-processing-technician-010', 'Meat Processing Technician', 'Iowa', 'unskilled', 'Manufacturing', 'USD $18 - $23/hour', 13, 'No experience required', 'High School Diploma', 'English basic', true, true, '2 years renewable', 'Heartland Foods USA', 'meat processing factory usa', false, 'open'],
]

const UK_JOBS = [
  ['uk-care-assistant-001', 'Care Assistant', 'London', 'unskilled', 'Healthcare', 'GBP 24,000 - 29,000/year', 16, 'No experience required', 'GCSE or equivalent', 'English required', true, true, '2 years renewable', 'Thames Care Homes', 'uk care assistant', false, 'open'],
  ['uk-hgv-driver-002', 'HGV Driver', 'Manchester', 'skilled', 'Transport', 'GBP 31,000 - 41,000/year', 10, '2+ years', 'Driver CPC', 'English required', true, false, '2 years renewable', 'Northern Haul UK', 'uk truck driver highway', true, 'open'],
  ['uk-construction-site-cleaner-003', 'Construction Site Cleaner', 'Birmingham', 'unskilled', 'Cleaning', 'GBP 11 - 14/hour', 18, 'No experience required', 'Secondary school', 'English basic', true, true, '1 year renewable', 'Midlands Build Services', 'uk site cleaner', false, 'open'],
  ['uk-chef-de-partie-004', 'Chef de Partie', 'Leeds', 'skilled', 'Hospitality', 'GBP 27,000 - 34,000/year', 8, '2+ years', 'Culinary certificate', 'English required', true, true, '2 years renewable', 'Yorkshire Kitchen Group', 'uk chef kitchen', true, 'closing_soon'],
  ['uk-software-developer-005', 'Software Developer', 'London', 'skilled', 'IT', 'GBP 48,000 - 76,000/year', 9, '3+ years', "Bachelor's Degree", 'English required', true, false, 'Permanent', 'Westbridge Digital', 'uk software developer office', true, 'open'],
  ['uk-warehouse-operative-006', 'Warehouse Operative', 'Coventry', 'unskilled', 'Warehouse', 'GBP 11 - 13/hour', 20, 'No experience required', 'Secondary school', 'English basic', true, false, '1 year renewable', 'Midlands Supply Chain', 'uk warehouse packing', false, 'open'],
  ['uk-maintenance-electrician-007', 'Maintenance Electrician', 'Glasgow', 'skilled', 'Engineering', 'GBP 34,000 - 46,000/year', 7, '3+ years', 'Trade certificate', 'English required', true, false, 'Permanent', 'Highland Facilities', 'uk electrician maintenance', true, 'open'],
]

const GERMANY_JOBS = [
  ['germany-factory-production-worker-001', 'Factory Production Worker', 'Bavaria', 'unskilled', 'Manufacturing', 'EUR 2,300 - 2,900/month', 24, 'No experience required', 'Secondary school', 'English basic', true, true, '2 years renewable', 'Bavaria Industrial Group', 'germany factory production line', false, 'open'],
  ['germany-cnc-machine-operator-002', 'CNC Machine Operator', 'Baden-Wurttemberg', 'skilled', 'Manufacturing', 'EUR 3,100 - 4,200/month', 10, '2+ years', 'Trade certificate', 'English required', true, false, '2 years renewable', 'Stuttgart Precision Works', 'germany cnc machine', true, 'open'],
  ['germany-logistics-coordinator-003', 'Logistics Coordinator', 'Berlin', 'skilled', 'Transport', 'EUR 3,200 - 4,100/month', 6, '2+ years', "Bachelor's Degree", 'English required', true, false, 'Permanent', 'Capital Freight Berlin', 'germany logistics warehouse', true, 'open'],
  ['germany-hotel-housekeeper-004', 'Hotel Housekeeper', 'Hamburg', 'unskilled', 'Hospitality', 'EUR 13 - 16/hour', 15, 'No experience required', 'Secondary school', 'English basic', true, true, '1 year renewable', 'Harbor View Hotels', 'germany hotel housekeeping', false, 'open'],
  ['germany-mechanical-fitter-005', 'Mechanical Fitter', 'Cologne', 'skilled', 'Engineering', 'EUR 3,400 - 4,700/month', 8, '3+ years', 'Trade certificate', 'English required', true, false, 'Permanent', 'Rhine Tech Engineering', 'germany mechanical fitter', true, 'closing_soon'],
  ['germany-agricultural-harvester-006', 'Agricultural Harvester Operator', 'Lower Saxony', 'unskilled', 'Agriculture', 'EUR 12 - 15/hour', 12, 'No experience required', 'Secondary school', 'English basic', true, true, 'Seasonal renewable', 'Green Field Harvests', 'germany farm harvest', false, 'open'],
  ['germany-warehouse-team-lead-007', 'Warehouse Team Lead', 'Frankfurt', 'skilled', 'Warehouse', 'EUR 3,000 - 4,000/month', 5, '2+ years', 'Diploma', 'English required', true, false, 'Permanent', 'Rhine Valley Logistics', 'germany warehouse logistics', true, 'open'],
]

const AUSTRALIA_JOBS = [
  ['australia-aged-care-worker-001', 'Aged Care Worker', 'Melbourne', 'unskilled', 'Healthcare', 'AUD 28 - 34/hour', 14, 'No experience required', 'Certificate III preferred', 'English required', true, true, '2 years renewable', 'Southern Cross Care', 'australia aged care', false, 'open'],
  ['australia-mining-equipment-operator-002', 'Mining Equipment Operator', 'Perth', 'skilled', 'Engineering', 'AUD 88,000 - 120,000/year', 9, '3+ years', 'Trade certificate', 'English required', true, true, '2 years renewable', 'Outback Mining Services', 'australia mining equipment', true, 'open'],
  ['australia-farm-hand-003', 'Farm Hand', 'Queensland', 'unskilled', 'Agriculture', 'AUD 25 - 30/hour', 16, 'No experience required', 'Secondary school', 'English basic', true, true, 'Seasonal renewable', 'Queensland Harvest Co', 'australia farm hand', false, 'open'],
  ['australia-registered-nurse-004', 'Registered Nurse', 'Sydney', 'skilled', 'Healthcare', 'AUD 78,000 - 102,000/year', 7, '3+ years', "Bachelor's Degree", 'English required', true, false, 'Permanent', 'Harbour City Health', 'australia nurse hospital', true, 'closing_soon'],
  ['australia-kitchen-steward-005', 'Kitchen Steward', 'Adelaide', 'unskilled', 'Hospitality', 'AUD 23 - 27/hour', 11, 'No experience required', 'Secondary school', 'English basic', true, true, '1 year renewable', 'Adelaide Coast Hotels', 'australia kitchen steward', false, 'open'],
]

const UAE_JOBS = [
  ['uae-construction-foreman-001', 'Construction Foreman', 'Dubai', 'skilled', 'Construction', 'AED 5,500 - 8,000/month', 8, '4+ years', 'Trade certificate', 'English required', true, true, '2 years renewable', 'Desert Skyline Contractors', 'dubai construction foreman', true, 'open'],
  ['uae-hotel-room-attendant-002', 'Hotel Room Attendant', 'Abu Dhabi', 'unskilled', 'Hospitality', 'AED 2,200 - 3,000/month', 18, 'No experience required', 'Secondary school', 'English basic', true, true, '2 years renewable', 'Emirates Grand Hospitality', 'uae hotel room attendant', false, 'open'],
  ['uae-logistics-coordinator-003', 'Logistics Coordinator', 'Dubai', 'skilled', 'Transport', 'AED 4,800 - 6,800/month', 9, '2+ years', 'Diploma', 'English required', true, true, '2 years renewable', 'Gulf Logistics Hub', 'uae logistics office', true, 'open'],
  ['uae-kitchen-helper-004', 'Kitchen Helper', 'Sharjah', 'unskilled', 'Hospitality', 'AED 1,800 - 2,600/month', 20, 'No experience required', 'Secondary school', 'English basic', true, true, '1 year renewable', 'Marina Catering Services', 'uae kitchen helper', false, 'open'],
]

const FRANCE_JOBS = [
  ['france-vineyard-farm-worker-001', 'Vineyard Farm Worker', 'Bordeaux', 'unskilled', 'Agriculture', 'EUR 11 - 14/hour', 14, 'No experience required', 'Secondary school', 'French basic', true, true, 'Seasonal renewable', 'Bordeaux Vineyards', 'france vineyard farm', false, 'open'],
  ['france-hotel-receptionist-002', 'Hotel Receptionist', 'Paris', 'skilled', 'Hospitality', 'EUR 2,200 - 2,900/month', 7, '1+ year', 'Diploma', 'French required', true, false, '2 years renewable', 'Paris Luxe Hotels', 'paris hotel receptionist', true, 'open'],
  ['france-quality-control-technician-003', 'Quality Control Technician', 'Lyon', 'skilled', 'Manufacturing', 'EUR 2,900 - 3,900/month', 8, '2+ years', 'Technical diploma', 'French basic', true, false, 'Permanent', 'Rhone Valley Manufacturing', 'france quality control factory', true, 'closing_soon'],
]

const NETHERLANDS_JOBS = [
  ['netherlands-greenhouse-farm-worker-001', 'Greenhouse Farm Worker', 'Rotterdam', 'unskilled', 'Agriculture', 'EUR 12 - 15/hour', 16, 'No experience required', 'Secondary school', 'English basic', true, true, 'Seasonal renewable', 'Delta Greenhouses', 'netherlands greenhouse farm', false, 'open'],
  ['netherlands-logistics-planner-002', 'Logistics Planner', 'Amsterdam', 'skilled', 'Transport', 'EUR 3,200 - 4,200/month', 6, '2+ years', "Bachelor's Degree", 'English required', true, false, 'Permanent', 'Amsterdam Cargo Network', 'netherlands logistics planner', true, 'open'],
  ['netherlands-packaging-line-operator-003', 'Packaging Line Operator', 'Eindhoven', 'unskilled', 'Manufacturing', 'EUR 11 - 14/hour', 18, 'No experience required', 'Secondary school', 'English basic', true, true, '1 year renewable', 'Lowlands Food Processing', 'netherlands packaging factory', false, 'open'],
]

const JOB_SEED_GROUPS = [
  { country: 'Canada', rows: CANADA_JOBS },
  { country: 'USA', rows: USA_JOBS },
  { country: 'UK', rows: UK_JOBS },
  { country: 'Germany', rows: GERMANY_JOBS },
  { country: 'Australia', rows: AUSTRALIA_JOBS },
  { country: 'UAE', rows: UAE_JOBS },
  { country: 'France', rows: FRANCE_JOBS },
  { country: 'Netherlands', rows: NETHERLANDS_JOBS },
]

export const JOB_CATALOG = JOB_SEED_GROUPS.flatMap((group, groupIndex) =>
  group.rows.map((row, rowIndex) => createJob(group.country, row, rowIndex, groupIndex * 10)),
)

export function getJobById(jobId) {
  return JOB_CATALOG.find((job) => job.id === jobId) || null
}

export function getJobsByCountrySlug(countrySlug) {
  if (!countrySlug) return []
  const normalizedSlug = slugify(countrySlug)
  const country = JOB_COUNTRY_OPTIONS.find((item) => item.slug === normalizedSlug || slugify(item.country) === normalizedSlug)
  if (!country) return []
  return JOB_CATALOG.filter((job) => job.countrySlug === country.slug)
}

export function getJobCategories() {
  return [...new Set(JOB_CATALOG.map((job) => job.category))].sort((left, right) => left.localeCompare(right))
}

export function buildJobDetailPath(jobId) {
  return `/jobs/${encodeURIComponent(jobId)}`
}

export function buildJobApplyPath(jobId) {
  return `/apply?type=job&jobId=${encodeURIComponent(jobId)}`
}

export function buildWorkAbroadPath(countrySlug = '') {
  const normalizedSlug = slugify(countrySlug)
  return normalizedSlug ? `/work-abroad/${encodeURIComponent(normalizedSlug)}` : '/work-abroad'
}

export function getCountryMetaBySlug(countrySlug) {
  const normalizedSlug = slugify(countrySlug)
  const country = JOB_COUNTRY_OPTIONS.find((item) => item.slug === normalizedSlug || slugify(item.country) === normalizedSlug)
  return country || null
}

export function getCountryMeta(country) {
  const meta = COUNTRY_META[country]
  return meta ? { country, ...meta } : { country, slug: slugify(country), flag: '🌍' }
}

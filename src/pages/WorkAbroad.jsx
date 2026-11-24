/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { usePageSections } from '../hooks/usePageSections'
import {
  buildJobApplyPath,
  buildJobDetailPath,
  buildWorkAbroadPath,
  getCountryMeta,
  getCountryMetaBySlug,
  JOB_COUNTRY_OPTIONS,
} from '../lib/jobCatalog'
import { getJobImageUrl } from '../lib/jobMedia'
import { useJobs } from '../lib/jobsStore'
import './WorkAbroad.css'

const TYPE_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'skilled', label: 'Skilled' },
  { key: 'unskilled', label: 'Unskilled' },
]

const SALARY_OPTIONS = [
  { key: 'all', label: 'Any salary' },
  { key: 'year', label: 'Annual' },
  { key: 'month', label: 'Monthly' },
  { key: 'hour', label: 'Hourly' },
]

const TRUST_PILL_ICONS = {
  shield: ShieldCheck,
  home: Home,
  users: Users,
}

const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    title: 'Licensed agency',
    body: 'Guided by an experienced team with clear support and transparent processes.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero fake listings',
    body: 'Every role is curated for credibility, structure, and safe recruitment standards.',
  },
  {
    icon: Users,
    title: '4,200+ placed abroad',
    body: 'Thousands of applicants have already started working through our support network.',
  },
  {
    icon: Globe2,
    title: 'Visa guidance',
    body: 'We help you prepare documents and move through visa steps without confusion.',
  },
]

const HOW_IT_WORKS = [
  {
    title: 'Choose a role',
    description: 'Browse the listings and open a job that matches your background and destination goals.',
  },
  {
    title: 'Submit your CV',
    description: 'Complete the application form and upload a clear resume or work history file.',
  },
  {
    title: 'Review and call',
    description: 'Our team reviews your profile, then follows up for interviews or missing details.',
  },
  {
    title: 'Visa processing',
    description: 'We guide you through the documents and sponsorship steps required for relocation.',
  },
  {
    title: 'Travel abroad',
    description: 'Once everything is ready, you receive the final guidance needed before departure.',
  },
]

function formatDate(value) {
  if (!value) return 'Date to be confirmed'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function daysUntil(value) {
  if (!value) return Number.POSITIVE_INFINITY
  const now = new Date()
  const deadline = new Date(value)
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getJobArea(job) {
  const parts = String(job.region || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length ? parts[parts.length - 1] : ''
}

function isPastDeadline(job) {
  return Boolean(job.deadline) && daysUntil(job.deadline) < 0
}

function JobCard({ job }) {
  const visualStyle = useMemo(
    () => ({
      backgroundImage: `url("${getJobImageUrl(job)}")`,
    }),
    [job],
  )

  const deadlineDays = daysUntil(job.deadline)
  const isUrgent = deadlineDays >= 0 && deadlineDays <= 7
  const isClosed = job.status === 'closed' || isPastDeadline(job)

  return (
    <article className="work-job-card">
      <div className="work-job-strip" style={visualStyle}>
        <span className="work-job-country">
          {job.country}
        </span>
        <span className={`work-job-type ${job.type}`}>{job.type === 'skilled' ? 'Skilled' : 'Unskilled'}</span>
      </div>

      <div className="work-job-body">
        <div className="work-job-head">
          <div>
            <p className="work-job-region">
              <MapPin size={14} />
              {job.region}
            </p>
            <h3>{job.title}</h3>
            <p className="work-job-employer">
              <Briefcase size={14} />
              {job.employer}
            </p>
          </div>

          <span className="work-job-salary">{job.salary}</span>
        </div>

        <div className="work-job-badges">
          <span className={`work-job-badge type ${job.type}`}>{job.type === 'skilled' ? 'Skilled' : 'Unskilled'}</span>
          {job.visaSponsorship ? <span className="work-job-badge visa">Visa Ready</span> : null}
          {job.accommodationProvided ? <span className="work-job-badge stay">Stay Help</span> : null}
          {isUrgent ? <span className="work-job-badge urgent">Urgent</span> : null}
        </div>

        <div className="work-job-meta">
          <span>
            <CalendarDays size={14} />
            Deadline {formatDate(job.deadline)}
          </span>
          <span className={`work-job-status ${isClosed ? 'closed' : job.status}`}>
            {isClosed ? 'Closed' : job.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="work-job-actions">
          <Link to={buildJobDetailPath(job.id)} className="work-job-link secondary">
            View Job
            <ChevronRight size={16} />
          </Link>
          {isClosed ? (
            <span className="work-job-link primary disabled" aria-disabled="true">
              Closed
            </span>
          ) : (
            <Link to={buildJobApplyPath(job.id)} className="work-job-link primary">
              Apply Now
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

function WorkAbroad() {
  const { sections } = usePageSections('work_abroad')
  const navigate = useNavigate()
  const { countrySlug } = useParams()
  const routeCountryMeta = useMemo(() => getCountryMetaBySlug(countrySlug), [countrySlug])

  const hero = sections.hero
  const cta = sections.cta

  const [countryFilter, setCountryFilter] = useState(routeCountryMeta?.country || 'All Countries')
  const { jobs: allJobs } = useJobs()
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [areaFilter, setAreaFilter] = useState('All Locations')
  const [salaryFilter, setSalaryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setCountryFilter(routeCountryMeta?.country || 'All Countries')
    setAreaFilter('All Locations')
  }, [routeCountryMeta?.country])

  const categories = useMemo(
    () => [
      'All Categories',
      ...[...new Set(allJobs.map((job) => job.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    ],
    [allJobs],
  )
  const countryCards = useMemo(() => {
    const knownCountries = new Set(JOB_COUNTRY_OPTIONS.map((item) => item.country))
    const extraCountries = [...new Set(allJobs.map((job) => job.country))]
      .filter((country) => country && !knownCountries.has(country))
      .map((country) => getCountryMeta(country))

    return [...JOB_COUNTRY_OPTIONS, ...extraCountries]
      .map((item) => ({
        ...item,
        count: allJobs.filter((job) => job.country === item.country).length,
      }))
      .filter((item) => item.count > 0)
  }, [allJobs])
  const areaOptions = useMemo(() => {
    if (countryFilter === 'All Countries') return []
    const areas = allJobs.filter((job) => job.country === countryFilter).map(getJobArea).filter(Boolean)
    return [...new Set(areas)].sort((a, b) => a.localeCompare(b))
  }, [allJobs, countryFilter])

  const jobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const now = new Date()

    return [...allJobs]
      .filter((job) => {
        const matchesCountry = countryFilter === 'All Countries' || job.country === countryFilter
        const matchesArea = areaFilter === 'All Locations' || getJobArea(job) === areaFilter
        const matchesCategory = categoryFilter === 'All Categories' || job.category === categoryFilter
        const matchesSalary = salaryFilter === 'all' || job.salaryPeriod === salaryFilter
        const matchesType = typeFilter === 'all' || job.type === typeFilter
        const matchesQuery =
          !query ||
          job.title.toLowerCase().includes(query) ||
          job.employer.toLowerCase().includes(query) ||
          job.region.toLowerCase().includes(query) ||
          job.country.toLowerCase().includes(query) ||
          job.category.toLowerCase().includes(query)

        return matchesCountry && matchesArea && matchesCategory && matchesSalary && matchesType && matchesQuery
      })
      .sort((left, right) => {
        const statusRank = { open: 0, closing_soon: 1, closed: 2 }
        const leftRank = isPastDeadline(left) ? 2 : (statusRank[left.status] ?? 3)
        const rightRank = isPastDeadline(right) ? 2 : (statusRank[right.status] ?? 3)
        if (leftRank !== rightRank) return leftRank - rightRank
        if (Boolean(left.featured) !== Boolean(right.featured)) return left.featured ? -1 : 1

        const leftDeadline = left.deadline ? new Date(left.deadline).getTime() : now.getTime()
        const rightDeadline = right.deadline ? new Date(right.deadline).getTime() : now.getTime()
        return leftDeadline - rightDeadline
      })
  }, [allJobs, areaFilter, categoryFilter, countryFilter, searchTerm, salaryFilter, typeFilter])

  const resultsLabel = `Showing ${jobs.length} of ${allJobs.length} jobs`
  const trustPills = hero.settings?.trust_pills?.length
    ? hero.settings.trust_pills
    : [
        { icon: 'shield', label: 'Visa sponsorship' },
        { icon: 'home', label: 'Accommodation available' },
        { icon: 'users', label: '4,200+ placed abroad' },
      ]

  function handleCountrySelect(nextCountry) {
    setCountryFilter(nextCountry)
    setAreaFilter('All Locations')
    navigate(nextCountry === 'All Countries' ? '/work-abroad' : buildWorkAbroadPath(nextCountry))
  }

  function resetFilters() {
    setCountryFilter('All Countries')
    setCategoryFilter('All Categories')
    setAreaFilter('All Locations')
    setSalaryFilter('all')
    setTypeFilter('all')
    setSearchTerm('')
    navigate('/work-abroad')
  }

  return (
    <div className="work-page">
      <SEO
        title="Work Abroad"
        description="Browse skilled and unskilled jobs abroad with destination chips, quick filters, and direct application links."
        path={countrySlug ? `/work-abroad/${countrySlug}` : '/work-abroad'}
      />

      <section className="work-hero">
        <div className="container work-hero-inner">
          <span className="section-badge work-hero-badge">{hero.badge_text}</span>
          <h1>{hero.heading}</h1>
          <p>{hero.subheading}</p>

          <form
            className="work-hero-search"
            onSubmit={(event) => {
              event.preventDefault()
              document.getElementById('work-jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            <Search size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={hero.settings?.search_hint || 'Job title, skill, or company...'}
              aria-label="Search jobs"
            />
            <button type="submit" className="work-hero-search-btn">
              Search Jobs
            </button>
          </form>

          <div className="work-hero-pills">
            {trustPills.map((pill) => {
              const PillIcon = TRUST_PILL_ICONS[pill.icon] || CheckCircle2

              return (
                <span key={pill.label} className="work-hero-pill">
                  <PillIcon size={14} />
                  {pill.label}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      <AnimatedSection delay={0.06}>
        <section className="work-filter-wrap">
          <div className="container">
            <div className="work-filter-bar">
              <label className="work-country-filter work-filter-field work-filter-country">
                <span>Country</span>
                <select value={countryFilter} onChange={(event) => handleCountrySelect(event.target.value)}>
                  <option value="All Countries">All Countries ({allJobs.length} jobs)</option>
                  {countryCards.map((country) => (
                    <option key={country.slug} value={country.country}>
                      {country.country} ({country.count} jobs)
                    </option>
                  ))}
                </select>
              </label>

              {areaOptions.length > 1 ? (
                <label className="work-filter-field work-filter-category">
                  <span>Province / Region</span>
                  <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
                    <option value="All Locations">All Locations</option>
                    {areaOptions.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="work-filter-field work-filter-category">
                <span>Category</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="work-filter-field work-filter-salary">
                <span>Salary</span>
                <select value={salaryFilter} onChange={(event) => setSalaryFilter(event.target.value)}>
                  {SALARY_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="work-filter-toggle">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={typeFilter === option.key ? 'active' : ''}
                    onClick={() => setTypeFilter(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="work-filter-count work-filter-results">
                <strong>{resultsLabel}</strong>
                <button type="button" onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <section id="work-jobs" className="work-section">
          <div className="container">
            <div className="work-section-header">
              <div>
                <span className="section-badge">Available jobs</span>
                <h2>Lean listings with the key details front and center</h2>
              </div>
              <p>{hero.settings?.filter_hint || 'Filter by country, category, salary, and job type.'}</p>
            </div>

            {jobs.length ? (
              <div className="work-job-grid">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <article className="work-empty">
                <h3>No jobs matched your filters</h3>
                <p>Try a wider country, category, or salary range. You can also clear filters and start again.</p>
                <div className="work-empty-actions">
                  <button type="button" className="btn-primary" onClick={resetFilters}>
                    Reset filters
                  </button>
                  <Link to="/contact" className="btn-secondary">
                    Contact Brightpath
                  </Link>
                </div>
              </article>
            )}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.16}>
        <section className="work-trust-section">
          <div className="container">
            <div className="work-section-header compact">
              <div>
                <span className="section-badge">Trust first</span>
                <h2>Applicants want proof before they click apply</h2>
              </div>
              <p>These are the credibility signals people look for when they are deciding whether to trust a job board.</p>
            </div>

            <div className="work-trust-grid">
              {TRUST_ITEMS.map((item) => {
                const Icon = item.icon

                return (
                  <article key={item.title} className="work-trust-card">
                    <div className="work-trust-icon">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.22}>
        <section className="work-steps-section">
          <div className="container">
            <div className="work-section-header compact centered">
              <span className="section-badge">How it works</span>
              <h2>A simple route from search to departure</h2>
              <p>We keep the process short and predictable so applicants know exactly what happens next.</p>
            </div>

            <div className="work-steps-grid">
              {HOW_IT_WORKS.map((step, index) => (
                <article key={step.title} className="work-step-card">
                  <div className="work-step-circle">{index + 1}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.28}>
        <section className="work-cta-section">
          <div className="container">
            <div className="work-cta-panel">
              <div>
                <span className="section-badge">{cta.badge_text}</span>
                <h2>{cta.heading}</h2>
                <p>{cta.subheading}</p>
              </div>

              <div className="work-cta-actions">
                <Link to={cta.primary_btn_url || '/work-abroad'} className="btn-primary work-cta-primary">
                  {cta.primary_btn_text || 'Browse All Jobs'}
                </Link>
                <Link to={cta.secondary_btn_url || '/contact'} className="work-cta-secondary">
                  {cta.secondary_btn_text || 'Create Profile'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default WorkAbroad

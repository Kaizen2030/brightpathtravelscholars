/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  CalendarDays,
  Globe2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Warehouse,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { usePageSections } from '../hooks/usePageSections'
import {
  buildJobApplyPath,
  buildJobDetailPath,
  buildWorkAbroadPath,
  getCountryMetaBySlug,
  getJobCategories,
  JOB_CATALOG,
  JOB_COUNTRY_OPTIONS,
} from '../lib/jobCatalog'
import './WorkAbroad.css'

const TYPE_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'skilled', label: 'Skilled' },
  { key: 'unskilled', label: 'Unskilled' },
]

function formatDate(value) {
  if (!value) return 'Date to be confirmed'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function JobCard({ job, featured = false }) {
  const imageUrl = `https://source.unsplash.com/featured/800x500/?${encodeURIComponent(job.imageKeyword)}`
  const isSkilled = job.type === 'skilled'

  return (
    <article className={`work-job-card${featured ? ' featured' : ''}`}>
      <div
        className="work-job-image"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(53, 21, 83, 0.08) 0%, rgba(53, 21, 83, 0.62) 100%), url(${imageUrl})`,
        }}
      >
        <span className="work-country-pill">
          {job.flag} {job.country}
        </span>
        <span className={`work-type-pill ${job.type}`}>
          {isSkilled ? 'Skilled' : 'Unskilled'}
        </span>
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

          <span className="work-salary-pill">{job.salary}</span>
        </div>

        <div className="work-job-highlights">
          <span>
            <ShieldCheck size={14} />
            {job.visaSponsorship ? 'Visa sponsorship' : 'No sponsorship'}
          </span>
          <span>
            <Warehouse size={14} />
            {job.accommodationProvided ? 'Accommodation' : 'Self-arranged stay'}
          </span>
          <span>
            <Sparkles size={14} />
            {job.positions} openings
          </span>
        </div>

        <div className="work-job-meta">
          <span>
            <CalendarDays size={14} />
            Deadline {formatDate(job.deadline)}
          </span>
          <span className={`work-status-pill ${job.status}`}>{job.status.replace(/_/g, ' ')}</span>
        </div>

        <div className="work-job-actions">
          <Link to={buildJobDetailPath(job.id)} className="btn-secondary work-job-secondary">
            View Job
          </Link>
          <Link to={buildJobApplyPath(job.id)} className="btn-primary work-job-primary">
            Apply Now
          </Link>
        </div>
      </div>
    </article>
  )
}

function WorkAbroad() {
  const { sections } = usePageSections('work_abroad')
  const navigate = useNavigate()
  const { countrySlug } = useParams()
  const categories = useMemo(() => ['All Categories', ...getJobCategories()], [])
  const routeCountry = useMemo(() => getCountryMetaBySlug(countrySlug), [countrySlug])
  const [countryFilter, setCountryFilter] = useState(routeCountry?.country || 'All Countries')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [searchTerm, setSearchTerm] = useState('')

  const hero = sections.hero
  const cta = sections.cta

  useEffect(() => {
    setCountryFilter(routeCountry?.country || 'All Countries')
  }, [routeCountry?.country])

  const featuredJobs = useMemo(() => JOB_CATALOG.filter((job) => job.featured).slice(0, 8), [])

  const filteredJobs = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase()

    return JOB_CATALOG.filter((job) => {
      const matchesCountry = countryFilter === 'All Countries' || job.country === countryFilter
      const matchesType = typeFilter === 'all' || job.type === typeFilter
      const matchesCategory = categoryFilter === 'All Categories' || job.category === categoryFilter
      const matchesSearch =
        !lowerSearch ||
        job.title.toLowerCase().includes(lowerSearch) ||
        job.employer.toLowerCase().includes(lowerSearch) ||
        job.region.toLowerCase().includes(lowerSearch) ||
        job.country.toLowerCase().includes(lowerSearch)

      return matchesCountry && matchesType && matchesCategory && matchesSearch
    })
  }, [categoryFilter, countryFilter, searchTerm, typeFilter])

  const resultsLabel = `Showing ${filteredJobs.length} of ${JOB_CATALOG.length} jobs`
  const activeCountryMeta = countryFilter === 'All Countries'
    ? null
    : JOB_COUNTRY_OPTIONS.find((item) => item.country === countryFilter) || null

  function handleCountryChange(nextCountry) {
    setCountryFilter(nextCountry)
    navigate(nextCountry === 'All Countries' ? '/work-abroad' : buildWorkAbroadPath(nextCountry))
  }

  function resetFilters() {
    setCountryFilter('All Countries')
    setTypeFilter('all')
    setCategoryFilter('All Categories')
    setSearchTerm('')
    navigate('/work-abroad')
  }

  return (
    <div className="work-page">
      <SEO
        title="Work Abroad"
        description="Browse skilled and unskilled jobs abroad with country filters, featured roles, and direct application links."
        path={countrySlug ? `/work-abroad/${countrySlug}` : '/work-abroad'}
      />

      <section className="work-hero">
        <div className="container work-hero-grid">
          <div className="work-hero-copy">
            <span className="section-badge work-hero-badge">{hero.badge_text}</span>
            <h1>{hero.heading}</h1>
            <p>{hero.subheading}</p>

            <div className="work-hero-actions">
              <Link to={hero.primary_btn_url} className="btn-primary">
                {hero.primary_btn_text}
              </Link>
              <Link to={hero.secondary_btn_url} className="btn-secondary work-hero-secondary">
                {hero.secondary_btn_text}
              </Link>
            </div>

            <div className="work-hero-stats">
              {(hero.settings?.stats ?? []).map((stat) => (
                <div key={stat.label} className="work-hero-stat">
                  <strong>
                    {stat.value}
                    {stat.suffix || ''}
                  </strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <article className="work-hero-panel">
            <div className="work-hero-panel-head">
              <span className="work-hero-panel-kicker">
                <Sparkles size={16} />
                Hiring snapshot
              </span>
              <h2>Skilled and unskilled routes in one place</h2>
              <p>
                Use the filters to narrow roles by destination, category, and job type before you open a full listing.
              </p>
            </div>

            <div className="work-hero-panel-points">
              <div>
                <Globe2 size={18} />
                <span>8 countries covered</span>
              </div>
              <div>
                <ShieldCheck size={18} />
                <span>Visa support available on many roles</span>
              </div>
              <div>
                <Warehouse size={18} />
                <span>Accommodation assistance on selected jobs</span>
              </div>
            </div>

            {activeCountryMeta ? (
              <div className="work-country-focus">
                <span>{activeCountryMeta.flag}</span>
                <div>
                  <strong>{activeCountryMeta.country}</strong>
                  <p>{filteredJobs.filter((job) => job.country === activeCountryMeta.country).length} matching openings</p>
                </div>
              </div>
            ) : null}
          </article>
        </div>
      </section>

      <AnimatedSection>
        <section className="work-filter-section">
          <div className="container">
            <div className="work-filter-shell">
              <div className="work-filter-head">
                <div>
                  <span className="section-badge">Search Jobs</span>
                  <h2>Filter live work abroad opportunities</h2>
                </div>
                <p>{hero.settings?.filter_hint || 'Narrow jobs by country, type, category, and job title.'}</p>
              </div>

              <div className="work-filter-grid">
                <label>
                  <span>Country</span>
                  <select value={countryFilter} onChange={(event) => handleCountryChange(event.target.value)}>
                    <option value="All Countries">All Countries</option>
                    {JOB_COUNTRY_OPTIONS.map((item) => (
                      <option key={item.slug} value={item.country}>
                        {item.country}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Type</span>
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Category</span>
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="work-search-field">
                  <span>Search</span>
                  <div className="work-search-input">
                    <Search size={16} />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={hero.settings?.search_hint || 'Search by job title or employer'}
                    />
                  </div>
                </label>
              </div>

              <div className="work-filter-footer">
                <strong>{resultsLabel}</strong>
                <button type="button" className="work-reset-btn" onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.06}>
        <section className="work-section">
          <div className="container">
            <div className="work-section-header">
              <div>
                <span className="section-badge">Featured Jobs</span>
                <h2>Highlighted roles people are applying for right now</h2>
              </div>
              <Link to="/work-abroad" className="btn-secondary work-header-link">
                View all jobs
              </Link>
            </div>

            <div className="work-featured-strip">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} featured />
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <section className="work-section alt">
          <div className="container">
            <div className="work-section-header">
              <div>
                <span className="section-badge">All Jobs</span>
                <h2>Explore every filtered opening</h2>
              </div>
              <p>Open a role to see the full requirements, benefits, and direct application button.</p>
            </div>

            {filteredJobs.length ? (
              <div className="work-job-grid">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <article className="work-empty-state">
                <h3>No jobs matched your filters</h3>
                <p>
                  Try clearing the filters or broadening your search. You can also contact Brightpath and we will help
                  you find a better fit.
                </p>
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

      <AnimatedSection delay={0.18}>
        <section className="work-section">
          <div className="container">
            <div className="work-cta-panel">
              <div>
                <span className="section-badge">{cta.badge_text}</span>
                <h2>{cta.heading}</h2>
                <p>{cta.subheading}</p>
              </div>

              <div className="work-cta-actions">
                <Link to={cta.primary_btn_url} className="btn-primary">
                  {cta.primary_btn_text}
                </Link>
                <Link to={cta.secondary_btn_url} className="btn-secondary">
                  {cta.secondary_btn_text}
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

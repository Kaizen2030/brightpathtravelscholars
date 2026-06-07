import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Globe2,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import {
  buildJobApplyPath,
  buildJobDetailPath,
  buildWorkAbroadPath,
  getCountryMeta,
  getJobById,
  JOB_CATALOG,
} from '../lib/jobCatalog'
import { getJobImageUrl } from '../lib/jobMedia'
import './JobDetail.css'

function formatDate(value) {
  if (!value) return 'Date to be confirmed'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function SimilarJobCard({ job }) {
  const imageUrl = getJobImageUrl(job)

  return (
    <article className="job-detail-similar-card">
      <div
        className="job-detail-similar-image"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(53, 21, 83, 0.08) 0%, rgba(53, 21, 83, 0.54) 100%), url(${imageUrl})`,
        }}
      >
        <span>{job.country}</span>
      </div>
      <div className="job-detail-similar-body">
        <p className="job-detail-similar-country">{job.country}</p>
        <h3>{job.title}</h3>
        <p className="job-detail-similar-employer">{job.employer}</p>
        <div className="job-detail-similar-footer">
          <span>{job.salary}</span>
          <Link to={buildJobDetailPath(job.id)}>View Job</Link>
        </div>
      </div>
    </article>
  )
}

function JobDetail() {
  const { jobId } = useParams()
  const job = getJobById(jobId)
  const countryMeta = job ? getCountryMeta(job.country) : null

  if (!job) {
    return <Navigate to="/work-abroad" replace />
  }

  const isClosed = job.status === 'closed'
  const similarJobs = JOB_CATALOG.filter((item) => item.country === job.country && item.id !== job.id).slice(0, 3)
  const heroImage = getJobImageUrl(job)

  return (
    <div className="job-detail-page">
      <SEO
        title={`${job.title} | Work Abroad`}
        description={`${job.title} in ${job.country} with ${job.employer}. Explore salary, requirements, benefits, and how to apply.`}
        path={buildJobDetailPath(job.id)}
      />

      <section className="job-detail-hero">
        <div className="container job-detail-hero-grid">
          <div className="job-detail-copy">
            <span className="section-badge job-detail-badge">
              {job.country}
            </span>
            <h1>{job.title}</h1>
            <p>{job.description}</p>

            <div className="job-detail-meta">
              <span>
                <Briefcase size={16} />
                {job.employer}
              </span>
              <span>
                <MapPin size={16} />
                {job.region}
              </span>
              <span className={`job-detail-type ${job.type}`}>{job.type}</span>
            </div>

            <div className="job-detail-actions">
              {isClosed ? (
                <button type="button" className="btn-primary job-detail-closed" disabled>
                  Applications Closed
                </button>
              ) : (
                <Link to={buildJobApplyPath(job.id)} className="btn-primary">
                  Apply Now
                  <ArrowRight size={16} />
                </Link>
              )}
              <Link to={buildWorkAbroadPath(job.countrySlug)} className="btn-secondary job-detail-secondary">
                Back to {job.country} Jobs
              </Link>
            </div>
          </div>

          <article className="job-detail-media-card">
            <div className="job-detail-media" style={{ backgroundImage: `url(${heroImage})` }} />
            <div className="job-detail-media-copy">
              <span className="job-detail-media-kicker">
                <Globe2 size={16} />
                Country summary
              </span>
              <h2>{countryMeta?.country || job.country}</h2>
              <p>
                A strong route for candidates looking for a structured overseas role in {job.category.toLowerCase()}
                .
              </p>
            </div>
          </article>
        </div>
      </section>

      <AnimatedSection>
        <section className="job-detail-section">
          <div className="container">
            <div className="job-detail-stats-grid">
              <div>
                <span>Salary</span>
                <strong>{job.salary}</strong>
              </div>
              <div>
                <span>Positions Open</span>
                <strong>{job.positions}</strong>
              </div>
              <div>
                <span>Contract</span>
                <strong>{job.contractDuration}</strong>
              </div>
              <div>
                <span>Visa Sponsorship</span>
                <strong>{job.visaSponsorship ? 'Yes' : 'No'}</strong>
              </div>
              <div>
                <span>Accommodation</span>
                <strong>{job.accommodationProvided ? 'Yes' : 'No'}</strong>
              </div>
              <div>
                <span>Experience</span>
                <strong>{job.experience}</strong>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="job-detail-section alt">
          <div className="container job-detail-content-grid">
            <div className="job-detail-main-column">
              <article className="job-detail-card">
                <span className="job-detail-card-kicker">
                  <BadgeCheck size={16} />
                  Description
                </span>
                <p>{job.description}</p>
                <p>
                  This opening is currently marked as <strong>{job.status.replace(/_/g, ' ')}</strong> and is best
                  suited to applicants who can move quickly on documentation and be ready for the next intake.
                </p>
              </article>

              <article className="job-detail-card">
                <span className="job-detail-card-kicker">
                  <CheckCircle2 size={16} />
                  Requirements
                </span>
                <ul className="job-detail-list">
                  {job.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="job-detail-card">
                <span className="job-detail-card-kicker">
                  <ShieldCheck size={16} />
                  Benefits
                </span>
                <ul className="job-detail-list benefits">
                  {job.benefits.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>

            <aside className="job-detail-sidebar">
              <article className="job-detail-card job-detail-side-card">
                <span className="job-detail-card-kicker">
                  <Briefcase size={16} />
                  Employer info
                </span>
                <div className="job-detail-side-info">
                  <div>
                    <span>Employer</span>
                    <strong>{job.employer}</strong>
                  </div>
                  <div>
                    <span>Country</span>
                    <strong>{job.country}</strong>
                  </div>
                  <div>
                    <span>Language</span>
                    <strong>{job.language}</strong>
                  </div>
                  <div>
                    <span>Category</span>
                    <strong>{job.category}</strong>
                  </div>
                </div>
              </article>

              <article className="job-detail-card job-detail-alert">
                <span className="job-detail-card-kicker">
                  <CalendarDays size={16} />
                  Deadline alert
                </span>
                <h3>{formatDate(job.deadline)}</h3>
                <p>
                  {job.positions} positions currently open. Status: <strong>{job.status.replace(/_/g, ' ')}</strong>.
                </p>
                <div className={`job-detail-status ${job.status}`}>{job.status.replace(/_/g, ' ')}</div>
              </article>

              <article className="job-detail-card job-detail-side-cta">
                <h3>Ready to apply?</h3>
                <p>Submit your application and keep your CV ready before the deadline closes.</p>
                {isClosed ? (
                  <button type="button" className="btn-primary job-detail-closed" disabled>
                    Applications Closed
                  </button>
                ) : (
                  <Link to={buildJobApplyPath(job.id)} className="btn-primary">
                    Apply for this role
                  </Link>
                )}
              </article>
            </aside>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.16}>
        <section className="job-detail-section">
          <div className="container">
            <div className="job-detail-section-header">
              <div>
                <span className="section-badge">Similar Jobs</span>
                <h2>More roles in {job.country}</h2>
              </div>
              <Link to={buildWorkAbroadPath(job.countrySlug)} className="btn-secondary">
                View all {job.country} jobs
              </Link>
            </div>

            {similarJobs.length ? (
              <div className="job-detail-similar-grid">
                {similarJobs.map((similarJob) => (
                  <SimilarJobCard key={similarJob.id} job={similarJob} />
                ))}
              </div>
            ) : (
              <div className="job-detail-empty">
                <p>No similar jobs were found for this country yet. Check back soon for more openings.</p>
              </div>
            )}
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default JobDetail

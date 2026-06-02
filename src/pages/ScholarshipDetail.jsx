import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import {
  buildScholarshipApplyPath,
  getScholarshipBySlug,
} from '../lib/scholarshipCatalog'
import './ScholarshipDetail.css'

function ScholarshipDetail() {
  const { scholarshipSlug } = useParams()
  const scholarship = getScholarshipBySlug(scholarshipSlug)

  if (!scholarship) {
    return <Navigate to="/study-abroad" replace />
  }

  return (
    <div className="scholarship-detail-page">
      <SEO
        title={`${scholarship.title} | Scholarship Application`}
        description={`Learn about ${scholarship.title} and start a guided scholarship application with Brightpath Travel Scholars.`}
        path={`/scholarships/${scholarship.slug}`}
      />

      <section className="scholarship-detail-hero">
        <div className="container scholarship-detail-hero-grid">
          <div>
            <span className="section-badge scholarship-detail-badge">{scholarship.category}</span>
            <h1>{scholarship.title}</h1>
            <p>{scholarship.summary}</p>

            <div className="scholarship-detail-meta">
              <span><strong>Provider:</strong> {scholarship.provider}</span>
              <span><strong>Destination:</strong> {scholarship.destination}</span>
              <span><strong>Coverage:</strong> {scholarship.coverage}</span>
            </div>

            <div className="scholarship-detail-actions">
              <Link to={buildScholarshipApplyPath(scholarship.slug)} className="btn-primary">
                Apply for This Scholarship
              </Link>
              <Link to="/contact" className="btn-secondary scholarship-detail-secondary">
                Talk to an Advisor
              </Link>
            </div>
          </div>

          <article className="scholarship-detail-sidecard">
            <span>Application support</span>
            <h2>We help students prepare a stronger scholarship case.</h2>
            <p>
              Our team can help you package your academic profile, check destination fit, and move from interest to
              a clean, review-ready application.
            </p>
          </article>
        </div>
      </section>

      <AnimatedSection>
        <section className="scholarship-detail-section">
          <div className="container scholarship-detail-grid">
            <article className="scholarship-detail-card">
              <h2>Overview</h2>
              <p>{scholarship.overview}</p>
            </article>

            <article className="scholarship-detail-card">
              <h2>Best For</h2>
              <ul>
                {scholarship.bestFor.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="scholarship-detail-card">
              <h2>What to Prepare</h2>
              <ul>
                {scholarship.requirements.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="scholarship-detail-section alt">
          <div className="container">
            <div className="scholarship-detail-cta">
              <div>
                <span className="section-badge">Next Step</span>
                <h2>Start a targeted application for {scholarship.title}.</h2>
                <p>
                  We will collect the student details your team needs, keep the scholarship context attached, and help
                  the applicant move into your admissions pipeline.
                </p>
              </div>

              <Link to={buildScholarshipApplyPath(scholarship.slug)} className="scholarship-detail-inline-link">
                Continue to Application
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default ScholarshipDetail

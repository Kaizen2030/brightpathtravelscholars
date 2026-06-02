import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { getDestinationGuide } from '../lib/destinationGuides'
import { buildUniversityDetailPath, getUniversityBySlug } from '../lib/universityCatalog'
import './UniversityDetail.css'

function UniversityDetail() {
  const { universitySlug } = useParams()
  const university = getUniversityBySlug(universitySlug)
  const destinationGuide = university ? getDestinationGuide(university.destinationSlug) : null

  if (!university) {
    return <Navigate to="/study-abroad" replace />
  }

  return (
    <div className="university-detail-page">
      <SEO
        title={`${university.name} | University Guide`}
        description={`Explore tuition, costs, programs, scholarships, admissions, and student life for ${university.name}.`}
        path={buildUniversityDetailPath(university.slug)}
      />

      <section className="university-detail-hero">
        <div className="container university-detail-hero-grid">
          <div>
            <span className="section-badge university-detail-badge">{university.destination}</span>
            <h1>{university.name}</h1>
            <p>{university.overview}</p>

            <div className="university-detail-meta">
              <span>
                <Building2 size={16} />
                {university.type}
              </span>
              <span>
                <MapPin size={16} />
                {university.city}
              </span>
            </div>

            <div className="university-detail-actions">
              <Link
                to={`/apply?destination=${encodeURIComponent(university.destination)}&university=${encodeURIComponent(university.name)}`}
                className="btn-primary"
              >
                Apply to {university.name}
              </Link>
              <Link to={`/study-abroad/${university.destinationSlug}`} className="btn-secondary university-detail-secondary">
                View {university.destination} Guide
              </Link>
            </div>
          </div>

          <article className="university-detail-summary">
            <h2>Quick Cost Snapshot</h2>
            <div className="university-detail-facts">
              <div>
                <span>Tuition</span>
                <strong>{university.tuition}</strong>
              </div>
              <div>
                <span>Living Costs</span>
                <strong>{university.livingCosts}</strong>
              </div>
              <div>
                <span>Destination</span>
                <strong>{university.destination}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <AnimatedSection>
        <section className="university-detail-section">
          <div className="container university-detail-grid">
            <article className="university-detail-card">
              <h2>Popular Programs</h2>
              <ul>
                {university.programs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="university-detail-card">
              <h2>Scholarships and Funding</h2>
              <ul>
                {university.scholarships.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="university-detail-card">
              <h2>Admissions Checklist</h2>
              <ul>
                {university.admissions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="university-detail-card">
              <h2>Why Students Choose This School</h2>
              <ul>
                {university.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="university-detail-card">
              <h2>Housing and Student Living</h2>
              <ul>
                {university.housing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="university-detail-card">
              <h2>Country Context</h2>
              <p>{destinationGuide?.overview || `${university.destination} offers a strong international study environment.`}</p>
              <div className="university-detail-country-cta">
                <Link to={`/study-abroad/${university.destinationSlug}`}>
                  Explore {university.destination} costs, scholarships, fellowships, and work options
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="university-detail-section alt">
          <div className="container">
            <div className="university-detail-cta">
              <div>
                <span className="section-badge">Application Path</span>
                <h2>Start a targeted application for {university.name}.</h2>
                <p>
                  We will keep both the university and destination context attached so your team knows exactly what the
                  student is interested in.
                </p>
              </div>

              <div className="university-detail-cta-actions">
                <Link
                  to={`/apply?destination=${encodeURIComponent(university.destination)}&university=${encodeURIComponent(university.name)}`}
                  className="btn-primary"
                >
                  Apply Now
                </Link>
                <Link to="/contact" className="btn-secondary">
                  Book Consultation
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default UniversityDetail

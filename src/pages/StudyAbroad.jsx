import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Globe, GraduationCap, Plane, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { usePageSections } from '../hooks/usePageSections'
import { getDestinationGuide, mergeDestinationCards } from '../lib/destinationGuides'
import { FLIGHT_FALLBACK_IMAGE, TRAVEL_FALLBACK_IMAGE, getDestinationFallbackImage } from '../lib/fallbackImages'
import { buildOverlayBackground } from '../lib/mediaStyles'
import {
  buildScholarshipApplyPath,
  buildScholarshipDetailPath,
  getScholarshipByTitle,
} from '../lib/scholarshipCatalog'
import { buildUniversityDetailPath, getUniversityByName } from '../lib/universityCatalog'
import { supabase } from '../lib/supabaseClient'
import './StudyAbroad.css'

const STEP_ICONS = [Globe, GraduationCap, ShieldCheck, Plane, ChevronRight]

const SCHOLARSHIP_FALLBACKS = [
  {
    id: 'sch-1',
    university: 'University of Essex',
    name: 'Regional Excellence Scholarship',
    amount: 'Up to GBP 5,000',
    deadline: '2026-07-15',
    eligibility: 'For international applicants joining eligible undergraduate and postgraduate programmes.',
    apply_url: '/contact',
  },
  {
    id: 'sch-2',
    university: 'Deakin University',
    name: 'Vice-Chancellor Merit Award',
    amount: '25% tuition reduction',
    deadline: '2026-08-10',
    eligibility: 'Strong academic performance and successful offer holders.',
    apply_url: '/contact',
  },
  {
    id: 'sch-3',
    university: 'University of Manitoba',
    name: 'International Student Entrance Scholarship',
    amount: 'CAD 3,000',
    deadline: '2026-05-30',
    eligibility: 'For new international students entering selected full-time programmes.',
    apply_url: '/contact',
  },
  {
    id: 'sch-4',
    university: 'Middlesex Dubai',
    name: 'Academic Excellence Scholarship',
    amount: 'Up to 20%',
    deadline: '2026-09-01',
    eligibility: 'For students with strong grades and complete admission documents.',
    apply_url: '/contact',
  },
]

const SCHOLARSHIP_GUIDE_SECTIONS = [
  {
    title: 'Merit-Based Scholarships',
    description: 'Awarded for strong academic performance, leadership, sports, or talents.',
    groups: [
      {
        label: 'Examples',
        items: [
          'High GPA or exam scores',
          'Leadership achievements',
          'Debate, music, art, coding, or innovation awards',
        ],
      },
      {
        label: 'Popular examples',
        items: ['Fulbright Program', 'Chevening Scholarships', 'Commonwealth Scholarships'],
      },
    ],
  },
  {
    title: 'Need-Based Scholarships',
    description: 'Given to students with financial need.',
    groups: [
      {
        label: 'These may require',
        items: ['Family income proof', 'Bank statements', 'Sponsorship letters'],
      },
      {
        label: 'Common in',
        items: ['USA universities', 'Some Canadian universities', 'Private foundations'],
      },
    ],
  },
  {
    title: 'Government Scholarships',
    description: 'Funded by governments to attract international students.',
    groups: [
      {
        label: 'Examples',
        items: ['Global Affairs Canada scholarships', 'DAAD in Germany', 'Erasmus+ in Europe', 'MEXT in Japan'],
      },
    ],
  },
  {
    title: 'University Scholarships',
    description: 'Offered directly by colleges and universities.',
    groups: [
      {
        label: 'They can be',
        items: ['Automatic entrance scholarships', 'Competitive awards', 'Department-specific awards'],
      },
      {
        label: 'Examples',
        items: [
          'University of Toronto Lester B. Pearson Scholarship',
          'University of British Columbia International Scholars Program',
          'McGill University entrance awards',
        ],
      },
    ],
  },
  {
    title: 'Athletic Scholarships',
    description: 'For talented athletes competing at a high level.',
    groups: [
      {
        label: 'Often support',
        items: ['Football', 'Basketball', 'Track and field'],
      },
      {
        label: 'Common in',
        items: ['USA NCAA schools', 'Some Canadian colleges'],
      },
    ],
  },
  {
    title: 'Research Scholarships',
    description: "For master's and PhD students.",
    groups: [
      {
        label: 'Often include',
        items: ['Tuition coverage', 'Monthly stipend', 'Research funding', 'Teaching assistant jobs'],
      },
      {
        label: 'Common in',
        items: ['Canada', 'Germany', 'UK', 'USA'],
      },
    ],
  },
  {
    title: 'Country-Specific Scholarships',
    description: 'Created for students from particular countries or regions.',
    groups: [
      {
        label: 'Examples',
        items: ['India-focused student funding programs', 'Refugee scholarships'],
      },
    ],
  },
  {
    title: 'Subject-Specific Scholarships',
    description: 'For certain careers or programs.',
    groups: [
      {
        label: 'Common fields',
        items: ['Engineering', 'AI & Computer Science', 'Nursing', 'Medicine', 'Agriculture', 'Business'],
      },
      {
        label: 'Good to know',
        items: ['Tech companies and foundations also sponsor these.'],
      },
    ],
  },
  {
    title: 'Diversity & Inclusion Scholarships',
    description: 'For underrepresented groups.',
    groups: [
      {
        label: 'Examples of target groups',
        items: ['Women in STEM', 'Indigenous students', 'Refugees', 'First-generation students'],
      },
      {
        label: 'Popular examples',
        items: ['Schlumberger Foundation programs', 'Mastercard Foundation scholarships'],
      },
    ],
  },
  {
    title: 'Fully Funded Scholarships',
    description: 'Cover almost everything.',
    groups: [
      {
        label: 'Usually cover',
        items: ['Tuition', 'Accommodation', 'Flights', 'Health insurance', 'Living expenses'],
      },
      {
        label: 'Examples',
        items: ['Rhodes Scholarship', 'Vanier Canada Graduate Scholarships', 'Chevening Scholarships'],
      },
    ],
  },
  {
    title: 'Partial Scholarships',
    description: 'Cover only part of costs.',
    groups: [
      {
        label: 'Often include',
        items: ['25%-75% tuition', 'Books', 'Residence discounts'],
      },
      {
        label: 'Good to know',
        items: ['These are much more common than full scholarships.'],
      },
    ],
  },
]

const BEST_SCHOLARSHIP_COUNTRIES = ['Canada', 'Germany', 'United Kingdom', 'United States', 'Australia', 'China']

function formatDeadline(date) {
  if (!date) return 'Rolling'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function DestinationDetailPage({ hero, destination, guide }) {
  const brandStart = '#5b2c89'
  const brandEnd = '#7a42b5'
  const accent = '#d4af37'
  const pageStyle = {
    '--destination-start': brandStart,
    '--destination-mid': brandStart,
    '--destination-end': brandEnd,
    '--destination-accent': accent,
    '--destination-accent-soft': 'rgba(212, 175, 55, 0.16)',
    '--destination-glow': 'rgba(212, 175, 55, 0.22)',
  }
  const heroBackground = buildOverlayBackground(
    destination?.image_url || getDestinationFallbackImage(destination?.slug) || hero?.media_url,
    TRAVEL_FALLBACK_IMAGE,
    'rgba(91, 44, 137, 0.76)',
    'rgba(53, 21, 83, 0.48)',
  )

  return (
    <div className="study-page destination-page" style={pageStyle}>
      <SEO
        title={`Study in ${guide.name}`}
        description={`Explore universities, tuition, living costs, scholarships, fellowships, and admissions guidance for studying in ${guide.name}.`}
        path={`/study-abroad/${guide.slug}`}
      />

      <section className="study-destination-hero" style={{ background: heroBackground }}>
        <div className="container">
          <div className="study-destination-breadcrumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/study-abroad">Study Abroad</Link>
            <span>/</span>
            <span>{guide.name}</span>
          </div>

          <div className="study-destination-hero-grid">
            <div className="study-destination-hero-copy">
              <span className="section-badge study-hero-badge">Destination Guide</span>
              <div className="study-destination-hero-heading">
                <span className="study-guide-country-code large">{guide.label}</span>
                <div>
                  <h1>Study in {guide.name}</h1>
                  <p>{guide.tagline}</p>
                </div>
              </div>
              <p className="study-destination-overview">{guide.overview}</p>

              <div className="study-destination-hero-actions">
                <Link to={`/apply?destination=${encodeURIComponent(guide.name)}`} className="btn-primary">
                  Apply for {guide.name}
                </Link>
                <Link to="/contact" className="btn-secondary study-hero-secondary">
                  Book Consultation
                </Link>
              </div>

              <article className="study-destination-spotlight-card study-destination-spotlight-card-inline">
                <span className="study-destination-card-kicker">{guide.spotlight.kicker}</span>
                <h2>{guide.spotlight.title}</h2>
                <p>{guide.spotlight.body}</p>

                <div className="study-destination-tag-row">
                  {guide.spotlight.tags.map((item) => (
                    <span key={item} className="study-destination-tag">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            </div>

            <article className="study-destination-summary-card">
              <div className="study-destination-summary-head">
                <div>
                  <span className="study-destination-card-kicker">Quick Snapshot</span>
                  <h2>{guide.name} at a glance</h2>
                </div>
              </div>

              <div className="study-guide-quickfacts">
                <div className="study-guide-fact">
                  <span>Tuition</span>
                  <strong>{guide.quickFacts.tuition}</strong>
                </div>
                <div className="study-guide-fact">
                  <span>Living Costs</span>
                  <strong>{guide.quickFacts.living}</strong>
                </div>
                <div className="study-guide-fact">
                  <span>Work Options</span>
                  <strong>{guide.quickFacts.work}</strong>
                </div>
                <div className="study-guide-fact">
                  <span>Post-Study</span>
                  <strong>{guide.quickFacts.postStudy}</strong>
                </div>
                <div className="study-guide-fact">
                  <span>Main Intakes</span>
                  <strong>{guide.quickFacts.intakes}</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="study-destination-body">
        <div className="container">
          <div className="study-destination-body-grid">
            <article className="study-destination-bestfor-card">
              <span className="study-destination-section-label">Best for</span>
              <div className="study-destination-bestfor-list">
                {guide.bestFit.map((item) => (
                  <div key={item} className="study-destination-bestfor-item">
                    <div className="study-destination-bestfor-dot" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="study-destination-details-card">
              <span className="study-destination-section-label">At a glance</span>
              <div className="study-destination-detail-list">
                <div className="study-destination-detail-row">
                  <div className="study-destination-detail-key">Post-study</div>
                  <div className="study-destination-detail-val">{guide.quickFacts.postStudy}</div>
                </div>
                <div className="study-destination-detail-row">
                  <div className="study-destination-detail-key">Work rights</div>
                  <div className="study-destination-detail-val">{guide.quickFacts.work}</div>
                </div>
                <div className="study-destination-detail-row">
                  <div className="study-destination-detail-key">Top cities</div>
                  <div className="study-destination-detail-val">{guide.studentLife?.[0]}</div>
                </div>
                <div className="study-destination-detail-row">
                  <div className="study-destination-detail-key">Campus vibe</div>
                  <div className="study-destination-detail-val">{guide.studentLife?.[1]}</div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section className="study-section">
          <div className="container">
            <div className="study-section-header">
              <span className="section-badge">Country Overview</span>
              <h2>{guide.name} universities, scholarships, and student pathways</h2>
              <p>
                Compare costs, top academic areas, funding routes, fellowships, and a wider university directory for {guide.name}.
              </p>
            </div>

            <div className="study-guide-grid">
              <article className="study-guide-card">
                <h3>Top Scholarships</h3>
                <ul>
                  {guide.scholarships.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="study-guide-card">
                <h3>Fellowships and Research Funding</h3>
                <ul>
                  {guide.fellowships.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="study-guide-card">
                <h3>Popular Fields of Study</h3>
                <ul>
                  {guide.popularFields.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="study-guide-card">
                <h3>Why Students Choose {guide.name}</h3>
                <ul>
                  {guide.whyChoose.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="study-guide-card">
                <h3>Admissions and Planning Checklist</h3>
                <ul>
                  {guide.admissions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="study-guide-card">
                <h3>Student Life and Cities</h3>
                <ul>
                  {guide.studentLife.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="study-section alt">
          <div className="container">
            <div className="study-section-header">
              <span className="section-badge">University Directory</span>
              <h2>{guide.universityCollection.length}+ universities and colleges in {guide.name}</h2>
              <p>
                This is a larger in-country list so students can browse more than just the 2 or 3 preview schools from
                the overview cards.
              </p>
            </div>

            <div className="study-country-university-grid">
              {guide.universityCollection.map((university) => {
                const universityItem = getUniversityByName(university.name)

                return (
                  <article key={`${guide.slug}-${university.name}`} className="study-country-university-card">
                    <div>
                      <span className="study-country-university-city">{university.city}</span>
                      <h3>{university.name}</h3>
                      <p>{university.focus}</p>
                    </div>

                    <div className="study-country-university-actions">
                      {universityItem ? (
                        <Link to={buildUniversityDetailPath(universityItem.slug)} className="study-guide-university-link secondary">
                          View Profile
                        </Link>
                      ) : null}
                      <Link
                        to={`/apply?destination=${encodeURIComponent(guide.name)}&university=${encodeURIComponent(university.name)}`}
                        className="study-guide-university-link"
                      >
                        Apply
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <section className="study-section">
          <div className="container">
            <div className="study-country-cta-panel">
              <div>
                <span className="section-badge">Next Step</span>
                <h2>Need help choosing the right university in {guide.name}?</h2>
                <p>
                  Start an application or book a consultation and we will help compare schools, tuition range,
                  scholarship access, and the best fit for your course goals.
                </p>
              </div>

              <div className="study-guide-cta-actions">
                <Link to={`/apply?destination=${encodeURIComponent(guide.name)}`} className="btn-primary">
                  Apply for {guide.name}
                </Link>
                <Link to="/study-abroad" className="btn-secondary">
                  Back to All Destinations
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

function StudyAbroad() {
  const { sections } = usePageSections('study_abroad')
  const [scholarships, setScholarships] = useState(SCHOLARSHIP_FALLBACKS)
  const [loadingScholarships, setLoadingScholarships] = useState(true)
  const [openIndexes, setOpenIndexes] = useState([0])
  const params = useParams()
  const location = useLocation()

  useEffect(() => {
    let ignore = false

    async function loadScholarships() {
      setLoadingScholarships(true)

      try {
        const { data, error } = await supabase
          .from('scholarships')
          .select('id, university, name, amount, deadline, eligibility, apply_url')
          .order('deadline', { ascending: true })

        if (ignore) return

        if (!error && data?.length) {
          setScholarships(data)
        }
      } catch (error) {
        console.error('[StudyAbroad] Failed to load scholarships:', error)
      } finally {
        if (!ignore) {
          setLoadingScholarships(false)
        }
      }
    }

    loadScholarships()

    return () => {
      ignore = true
    }
  }, [])

  const hero = sections.hero
  const destinationsSection = sections.destinations
  const stepsSection = sections.steps
  const requirements = sections.requirements
  const scholarshipsSection = sections.scholarships
  const faq = sections.faq
  const cta = sections.cta

  const destinationItems = useMemo(() => mergeDestinationCards(destinationsSection.items ?? []), [destinationsSection.items])

  const selectedDestination = useMemo(() => {
    const queryDestination = new URLSearchParams(location.search).get('destination')
    const slug = params.countrySlug || queryDestination
    return destinationItems.find((destination) => destination.slug === slug) || null
  }, [destinationItems, location.search, params.countrySlug])
  const selectedDestinationGuide = useMemo(
    () => (selectedDestination?.slug ? getDestinationGuide(selectedDestination.slug) : null),
    [selectedDestination?.slug],
  )

  function toggleFaq(index) {
    setOpenIndexes((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    )
  }

  if (params.countrySlug && !selectedDestinationGuide) {
    return <Navigate to="/study-abroad" replace />
  }

  if (params.countrySlug && selectedDestination && selectedDestinationGuide) {
    return <DestinationDetailPage hero={hero} destination={selectedDestination} guide={selectedDestinationGuide} />
  }

  return (
    <div className="study-page">
      <SEO
        title="Study Abroad"
        description="Explore study destinations, scholarships, admission requirements, FAQs, and application support through Brightpath Travel Scholars."
        path="/study-abroad"
      />

      <section
        className="study-hero"
        style={{
          background: buildOverlayBackground(hero.media_url, TRAVEL_FALLBACK_IMAGE, 'rgba(91, 44, 137, 0.72)', 'rgba(53, 21, 83, 0.38)'),
        }}
      >
        <div className="container study-hero-grid">
          <div className="study-hero-copy">
            <span className="section-badge study-hero-badge">{hero.badge_text}</span>
            <h1>{hero.heading}</h1>
            <p>{hero.subheading}</p>
            <div className="study-hero-actions">
              <Link to={hero.primary_btn_url} className="btn-primary">
                {hero.primary_btn_text}
              </Link>
              <Link to={hero.secondary_btn_url} className="btn-secondary study-hero-secondary">
                {hero.secondary_btn_text}
              </Link>
            </div>

            {selectedDestination ? (
              <div className="study-selected-destination">
                <strong>Viewing destination focus:</strong>
                <span>
                  {selectedDestination.code} {selectedDestination.name}
                </span>
              </div>
            ) : null}
          </div>

          <div className="study-hero-map">
            <div className="study-map-grid" />
            <div className="study-map-card">
              <span>{hero.settings?.map_card_badge}</span>
              <h3>{hero.settings?.map_card_title}</h3>
              <p>{hero.settings?.map_card_body}</p>
            </div>
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section className="study-section">
          <div className="container">
            <div className="study-section-header">
              <span className="section-badge">{destinationsSection.badge_text}</span>
              <h2>{destinationsSection.heading}</h2>
              <p>{destinationsSection.subheading}</p>
            </div>

            <div className="study-destinations-grid">
              {destinationItems.map((destination, index) => (
                <article
                  key={destination.slug}
                  className={`study-destination-card${selectedDestination?.slug === destination.slug ? ' selected' : ''}`}
                  style={{
                    background: `linear-gradient(150deg, rgba(91, 44, 137, 0.36), rgba(53, 21, 83, 0.54)), url(${destination.image_url || getDestinationFallbackImage(destination.slug) || FLIGHT_FALLBACK_IMAGE}) center/cover`,
                  }}
                >
                  <span className="study-destination-flag">{destination.code}</span>
                  <h3>{destination.name}</h3>
                  <p>{destination.summary}</p>
                  <ul>
                    {(destination.universities ?? []).map((university) => {
                      const universityItem = getUniversityByName(university)

                      return (
                        <li key={university}>
                          {universityItem ? (
                            <Link to={buildUniversityDetailPath(universityItem.slug)} className="study-university-link">
                              {university}
                            </Link>
                          ) : (
                            university
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  <Link to={`/study-abroad/${destination.slug}`} className="study-destination-link">
                    Explore
                    <ChevronRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="study-section alt">
          <div className="container">
            <div className="study-section-header">
              <span className="section-badge">{stepsSection.badge_text}</span>
              <h2>{stepsSection.heading}</h2>
              <p>{stepsSection.subheading}</p>
            </div>

            <div className="study-steps-grid">
              {(stepsSection.items ?? []).map((step, index) => {
                const Icon = STEP_ICONS[index] || STEP_ICONS[STEP_ICONS.length - 1]

                return (
                  <article key={step.title} className="study-step-card">
                    <div className="study-step-top">
                      <span className="study-step-number">{index + 1}</span>
                      <span className="study-step-icon">
                        <Icon size={18} />
                      </span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <section className="study-section">
          <div className="container">
            <div className="study-requirements-grid">
              <article className="study-requirements-card">
                <span className="section-badge">{requirements.settings?.academic?.badge}</span>
                <h2>{requirements.settings?.academic?.heading}</h2>
                <ul>
                  {(requirements.settings?.academic?.points ?? []).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>

              <article className="study-requirements-card">
                <span className="section-badge">{requirements.settings?.documents?.badge}</span>
                <h2>{requirements.settings?.documents?.heading}</h2>
                <ul>
                  {(requirements.settings?.documents?.points ?? []).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.16}>
        <section className="study-section alt">
          <div className="container">
            <div className="study-section-header">
              <span className="section-badge">{scholarshipsSection.badge_text}</span>
              <h2>{scholarshipsSection.heading}</h2>
              <p>{scholarshipsSection.subheading}</p>
            </div>

            <div className="study-scholarships-grid">
              {(loadingScholarships ? SCHOLARSHIP_FALLBACKS : scholarships).map((scholarship) => (
                <article key={scholarship.id} className="study-scholarship-card">
                  <span className="study-scholarship-university">{scholarship.university}</span>
                  <h3>{scholarship.name}</h3>
                  <div className="study-scholarship-meta">
                    <span>{scholarship.amount}</span>
                    <span>Deadline: {formatDeadline(scholarship.deadline)}</span>
                  </div>
                  <p>{scholarship.eligibility}</p>
                  <a
                    href={scholarship.apply_url || '/contact'}
                    target={scholarship.apply_url && scholarship.apply_url.startsWith('http') ? '_blank' : undefined}
                    rel={scholarship.apply_url && scholarship.apply_url.startsWith('http') ? 'noreferrer' : undefined}
                    className="study-scholarship-link"
                  >
                    Apply
                  </a>
                </article>
              ))}
            </div>

            <div className="study-scholarship-guide">
              <div className="study-scholarship-guide-header">
                <h3>Scholarship types explained</h3>
                <p>
                  Use this guide to understand the different funding paths available before you shortlist universities
                  and build your application plan.
                </p>
              </div>

              <div className="study-scholarship-guide-grid">
                {SCHOLARSHIP_GUIDE_SECTIONS.map((section) => (
                  <article key={section.title} className="study-scholarship-guide-card">
                    <h3>{section.title}</h3>
                    <p>{section.description}</p>

                    <div className="study-scholarship-guide-groups">
                      {section.groups.map((group) => (
                        <div key={`${section.title}-${group.label}`} className="study-scholarship-guide-group">
                          <h4>{group.label}</h4>
                          <ul>
                            {group.items.map((item) => {
                              const scholarshipItem = getScholarshipByTitle(item)

                              return (
                                <li key={item} className="study-scholarship-guide-item">
                                  <span>{item}</span>
                                  {scholarshipItem ? (
                                    <span className="study-scholarship-guide-actions">
                                      <Link
                                        to={buildScholarshipDetailPath(scholarshipItem.slug)}
                                        className="study-scholarship-guide-link secondary"
                                      >
                                        Details
                                      </Link>
                                      <Link
                                        to={buildScholarshipApplyPath(scholarshipItem.slug)}
                                        className="study-scholarship-guide-link"
                                      >
                                        Apply
                                      </Link>
                                    </span>
                                  ) : null}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <article className="study-scholarship-countries-card">
                <div>
                  <h3>Best Countries for International Scholarships</h3>
                  <p>These destinations are usually among the strongest places to find broad scholarship options.</p>
                </div>

                <div className="study-scholarship-country-list">
                  {BEST_SCHOLARSHIP_COUNTRIES.map((country) => (
                    <span key={country} className="study-scholarship-country-pill">
                      {country}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <section className="study-section">
          <div className="container">
            <div className="study-section-header">
              <span className="section-badge">{faq.badge_text}</span>
              <h2>{faq.heading}</h2>
              <p>{faq.subheading}</p>
            </div>

            <div className="study-faq-list">
              {(faq.items ?? []).map((item, index) => {
                const isOpen = openIndexes.includes(index)

                return (
                  <article key={item.question} className={`study-faq-item${isOpen ? ' open' : ''}`}>
                    <button type="button" className="study-faq-trigger" onClick={() => toggleFaq(index)}>
                      <span>{item.question}</span>
                      <ChevronDown size={18} className={isOpen ? 'rotate' : ''} />
                    </button>
                    <div className="study-faq-panel" aria-hidden={!isOpen}>
                      <p>{item.answer}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.24}>
        <section className="study-section study-cta">
          <div className="container">
            <div className="study-cta-panel">
              <div>
                <span className="section-badge">{cta.badge_text}</span>
                <h2>{cta.heading}</h2>
                <p>{cta.subheading}</p>
              </div>
              <div className="study-cta-actions">
                <Link to={cta.primary_btn_url} className="btn-primary">
                  {cta.primary_btn_text}
                </Link>
                <Link to={cta.secondary_btn_url} className="btn-secondary study-cta-secondary">
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

export default StudyAbroad

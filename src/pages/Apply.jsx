/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe2,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { useAuth } from '../context/AuthContext'
import { usePageSections } from '../hooks/usePageSections'
import { getScholarshipBySlug } from '../lib/scholarshipCatalog'
import { buildJobApplyPath, buildJobDetailPath, getJobById, JOB_COUNTRY_OPTIONS } from '../lib/jobCatalog'
import { supabase } from '../lib/supabaseClient'
import './Apply.css'

function buildReference(id, prefix = 'NEX') {
  if (!id) return `${prefix}-${Date.now()}`
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`
}

function formatShortDate(value) {
  if (!value) return 'Date to be confirmed'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const JOB_EDUCATION_OPTIONS = [
  'Primary',
  'Secondary / High School',
  'Diploma / Certificate',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
]

const JOB_EXPERIENCE_OPTIONS = [
  'No experience',
  'Less than 1 year',
  '1-2 years',
  '3-5 years',
  '5-10 years',
  '10+ years',
]

const JOB_ENG_PROFICIENCY = ['Basic', 'Intermediate', 'Fluent']
const JOB_FRENCH_PROFICIENCY = ['N/A', 'Basic', 'Intermediate', 'Fluent']
const JOB_HEARD_FROM_OPTIONS = ['Google Search', 'Social Media', 'Friend or Family', 'WhatsApp', 'Referral', 'Other']

function buildJobInitialForm() {
  return {
    full_name: '',
    email: '',
    phone: '',
    country_of_residence: '',
    passport_number: '',
    date_of_birth: '',
    education_level: JOB_EDUCATION_OPTIONS[1],
    years_experience: JOB_EXPERIENCE_OPTIONS[0],
    current_occupation: '',
    english_proficiency: JOB_ENG_PROFICIENCY[2],
    french_proficiency: JOB_FRENCH_PROFICIENCY[0],
    has_valid_passport: 'yes',
    available_to_relocate: 'yes',
    cover_letter: '',
    heard_from: '',
    consent: false,
  }
}

function ToggleChoice({ label, value, selected, onChange }) {
  return (
    <button
      type="button"
      className={`apply-toggle-choice${selected === value ? ' active' : ''}`}
      onClick={() => onChange(value)}
    >
      {label}
    </button>
  )
}

function JobApplicationFlow({ job, user }) {
  const hero = {
    badge_text: 'Work Abroad Application',
    heading: `Apply for ${job.title}`,
    subheading: `Send your work-abroad profile for ${job.employer} in ${job.region}, ${job.country}.`,
  }
  const [form, setForm] = useState(buildJobInitialForm())
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submittedReference, setSubmittedReference] = useState('')
  const [submittedNoteSummary, setSubmittedNoteSummary] = useState('')

  useEffect(() => {
    setForm(buildJobInitialForm())
    setErrors({})
    setSubmitting(false)
    setSubmittedReference('')
    setSubmittedNoteSummary('')
  }, [job.id])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.full_name.trim()) nextErrors.full_name = 'Full name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.'
    if (!form.country_of_residence.trim()) nextErrors.country_of_residence = 'Country of residence is required.'
    if (!form.passport_number.trim()) nextErrors.passport_number = 'Passport number is required.'
    if (!form.date_of_birth) nextErrors.date_of_birth = 'Date of birth is required.'
    if (!form.education_level.trim()) nextErrors.education_level = 'Education level is required.'
    if (!form.years_experience.trim()) nextErrors.years_experience = 'Years of experience is required.'
    if (!form.current_occupation.trim()) nextErrors.current_occupation = 'Current occupation is required.'
    if (!form.english_proficiency.trim()) nextErrors.english_proficiency = 'English proficiency is required.'
    if (!form.consent) nextErrors.consent = 'You must confirm the information is accurate.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return

  setSubmitting(true)

  try {
      const payload = {
        job_id: job.id,
        user_id: user?.id ?? null,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country_of_residence: form.country_of_residence.trim(),
        passport_number: form.passport_number.trim(),
        date_of_birth: form.date_of_birth,
        education_level: form.education_level,
        years_experience: form.years_experience,
        current_occupation: form.current_occupation.trim(),
        english_proficiency: form.english_proficiency,
        french_proficiency: form.french_proficiency,
        has_valid_passport: form.has_valid_passport === 'yes',
        available_to_relocate: form.available_to_relocate === 'yes',
        notes: form.cover_letter.trim() || null,
        heard_from: form.heard_from,
        status: 'pending',
      }

      const { data, error } = await supabase.from('job_applications').insert(payload).select('id').single()

      if (error) throw error

      setSubmittedReference(buildReference(data?.id, 'JOB'))
      setSubmittedNoteSummary(form.cover_letter.trim())
      setErrors({})
      setForm(buildJobInitialForm())
    } catch (error) {
      console.error('[Apply] Failed to submit job application:', error)
      setErrors({ submit: 'We could not submit your job application right now. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedReference) {
    return (
      <div className="apply-page">
        <SEO
          title={`${job.title} Application`}
          description={`Submit your application for ${job.title} in ${job.country} and receive a reference number for follow-up.`}
          path={buildJobApplyPath(job.id)}
        />

        <section className="apply-success">
          <div className="container">
            <div className="apply-success-card apply-job-success-card">
              <span className="apply-success-icon">
                <CheckCircle2 size={28} />
              </span>
              <h1>Job application submitted.</h1>
              <p>
                Your reference number is <strong>{submittedReference}</strong>. We will review your work abroad
                profile and contact you with the next steps.
              </p>
              <div className="apply-job-success-grid">
                <div>
                  <span>Job</span>
                  <strong>{job.title}</strong>
                </div>
                <div>
                  <span>Employer</span>
                  <strong>{job.employer}</strong>
                </div>
                <div>
                  <span>Notes Shared</span>
                  <strong>{submittedNoteSummary ? 'Yes' : 'No'}</strong>
                </div>
              </div>
              <div className="apply-job-success-actions">
                <Link to={buildJobDetailPath(job.id)} className="btn-secondary">
                  View Job Details
                </Link>
                <Link to="/work-abroad" className="btn-primary">
                  Browse More Jobs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="apply-page">
      <SEO
        title={`${job.title} Application`}
        description={`Apply for ${job.title} in ${job.country} with Brightpath Travel Scholars.`}
        path={buildJobApplyPath(job.id)}
      />

      <section className="apply-hero apply-job-hero">
        <div className="container">
          <span className="section-badge apply-hero-badge">{hero.badge_text}</span>
          <h1>{hero.heading}</h1>
          <p>{hero.subheading}</p>

          <div className="apply-job-context">
            <div>
              <MapPin size={16} />
              <span>
                {job.region}, {job.country}
              </span>
            </div>
            <div>
              <Briefcase size={16} />
              <span>{job.employer}</span>
            </div>
            <div>
              <CalendarDays size={16} />
              <span>Deadline {formatShortDate(job.deadline)}</span>
            </div>
            <div>
              <ShieldCheck size={16} />
              <span>{job.visaSponsorship ? 'Visa sponsorship available' : 'No sponsorship guarantee'}</span>
            </div>
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section className="apply-section">
          <div className="container">
            <div className="apply-form-shell apply-job-shell">
              <div className="apply-progress-header">
                <div>
                  <span className="section-badge">Work Abroad Profile</span>
                  <h2>Complete your job application</h2>
                </div>
                <span className="apply-progress-text">Single step submission</span>
              </div>

              <div className="apply-job-overview">
                <div className="apply-job-overview-card">
                  <span className="apply-job-overview-kicker">
                    <FileText size={14} />
                    Role overview
                  </span>
                  <h3>{job.title}</h3>
                  <p>
                    {job.category} role in {job.region}. {job.type === 'skilled' ? 'Skilled route' : 'Unskilled route'} with
                    direct application support.
                  </p>
                </div>

                <div className="apply-job-overview-card">
                  <span className="apply-job-overview-kicker">
                    <Globe2 size={14} />
                    Key details
                  </span>
                  <div className="apply-job-overview-list">
                    <span>{job.salary}</span>
                    <span>{job.contractDuration}</span>
                    <span>{job.positions} positions</span>
                  </div>
                </div>
              </div>

              <form className="apply-form apply-job-form" onSubmit={handleSubmit}>
                <div className="apply-job-section-title">
                  <span className="section-badge">Personal Information</span>
                  <p>Share the details we need to review your application and contact you.</p>
                </div>

                <div className="apply-fields-grid apply-job-grid">
                  <label>
                    <span>Full Name</span>
                    <input type="text" value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} required />
                    {errors.full_name ? <small>{errors.full_name}</small> : null}
                  </label>

                  <label>
                    <span>Email</span>
                    <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
                    {errors.email ? <small>{errors.email}</small> : null}
                  </label>

                  <label>
                    <span>Phone Number</span>
                    <input type="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required />
                    {errors.phone ? <small>{errors.phone}</small> : null}
                  </label>

                  <label>
                    <span>Country of Residence</span>
                    <select value={form.country_of_residence} onChange={(event) => updateField('country_of_residence', event.target.value)} required>
                      <option value="">Select a country</option>
                      {JOB_COUNTRY_OPTIONS.map((country) => (
                        <option key={country.slug} value={country.country}>
                          {country.country}
                        </option>
                      ))}
                    </select>
                    {errors.country_of_residence ? <small>{errors.country_of_residence}</small> : null}
                  </label>

                  <label>
                    <span>Passport Number</span>
                    <input type="text" value={form.passport_number} onChange={(event) => updateField('passport_number', event.target.value)} required />
                    {errors.passport_number ? <small>{errors.passport_number}</small> : null}
                  </label>

                  <label>
                    <span>Date of Birth</span>
                    <input type="date" value={form.date_of_birth} onChange={(event) => updateField('date_of_birth', event.target.value)} required />
                    {errors.date_of_birth ? <small>{errors.date_of_birth}</small> : null}
                  </label>
                </div>

                <div className="apply-job-section-title">
                  <span className="section-badge">Background</span>
                  <p>Tell us about your education, experience, and language level.</p>
                </div>

                <div className="apply-fields-grid apply-job-grid">
                  <label>
                    <span>Highest Education Level</span>
                    <select value={form.education_level} onChange={(event) => updateField('education_level', event.target.value)} required>
                      {JOB_EDUCATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.education_level ? <small>{errors.education_level}</small> : null}
                  </label>

                  <label>
                    <span>Years of Experience</span>
                    <select value={form.years_experience} onChange={(event) => updateField('years_experience', event.target.value)} required>
                      {JOB_EXPERIENCE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.years_experience ? <small>{errors.years_experience}</small> : null}
                  </label>

                  <label>
                    <span>Current Occupation</span>
                    <input type="text" value={form.current_occupation} onChange={(event) => updateField('current_occupation', event.target.value)} required />
                    {errors.current_occupation ? <small>{errors.current_occupation}</small> : null}
                  </label>

                  <label>
                    <span>English Proficiency</span>
                    <select value={form.english_proficiency} onChange={(event) => updateField('english_proficiency', event.target.value)} required>
                      {JOB_ENG_PROFICIENCY.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.english_proficiency ? <small>{errors.english_proficiency}</small> : null}
                  </label>

                  <label>
                    <span>French Proficiency</span>
                    <select value={form.french_proficiency} onChange={(event) => updateField('french_proficiency', event.target.value)}>
                      {JOB_FRENCH_PROFICIENCY.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>How did you hear about us?</span>
                    <select value={form.heard_from} onChange={(event) => updateField('heard_from', event.target.value)}>
                      <option value="">Select an option</option>
                      {JOB_HEARD_FROM_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="apply-job-toggle-grid">
                  <label className="apply-job-toggle-card">
                    <span>Do you have a valid passport?</span>
                    <div className="apply-toggle-group">
                      <ToggleChoice
                        label="Yes"
                        value="yes"
                        selected={form.has_valid_passport}
                        onChange={(value) => updateField('has_valid_passport', value)}
                      />
                      <ToggleChoice
                        label="No"
                        value="no"
                        selected={form.has_valid_passport}
                        onChange={(value) => updateField('has_valid_passport', value)}
                      />
                    </div>
                  </label>

                  <label className="apply-job-toggle-card">
                    <span>Can you relocate within 3 months?</span>
                    <div className="apply-toggle-group">
                      <ToggleChoice
                        label="Yes"
                        value="yes"
                        selected={form.available_to_relocate}
                        onChange={(value) => updateField('available_to_relocate', value)}
                      />
                      <ToggleChoice
                        label="No"
                        value="no"
                        selected={form.available_to_relocate}
                        onChange={(value) => updateField('available_to_relocate', value)}
                      />
                    </div>
                  </label>
                </div>

                <div className="apply-job-section-title">
                  <span className="section-badge">Additional Notes</span>
                  <p>Share a few extra details about your availability, experience, or anything you want us to know.</p>
                </div>

                <div className="apply-fields-grid apply-job-grid">
                  <label className="apply-cover-field" style={{ gridColumn: '1 / -1' }}>
                    <span>Notes / Extra Details</span>
                    <textarea
                      rows="7"
                      value={form.cover_letter}
                      onChange={(event) => updateField('cover_letter', event.target.value)}
                      placeholder="Optional note about your experience, availability, timeline, or why this role fits you"
                    />
                  </label>
                </div>

                <label className="apply-checkbox apply-job-consent">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(event) => updateField('consent', event.target.checked)}
                  />
                  <span>I confirm that the information provided is accurate and I am ready to be contacted about this application.</span>
                </label>
                {errors.consent ? <small>{errors.consent}</small> : null}

                {errors.submit ? <div className="apply-submit-error">{errors.submit}</div> : null}

                <div className="apply-actions">
                  <Link to={buildJobDetailPath(job.id)} className="btn-secondary apply-nav-btn">
                    View Job Details
                  </Link>
                  <button type="submit" className="btn-primary apply-nav-btn" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Job Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

function buildInitialForm(settings, scholarship) {
  const destinationOptions = settings.destination_options ?? []
  const requestedDestination = settings.requested_destination?.trim()
  const requestedUniversity = settings.requested_university?.trim()
  const scholarshipDestination = scholarship?.destination?.trim()
  let destination = destinationOptions[0] || 'United Kingdom'

  if (scholarshipDestination) {
    destination = scholarshipDestination
  }

  if (requestedDestination) {
    destination = requestedDestination
  }

  return {
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    nationality: '',
    city: '',
    highest_qualification: '',
    year_completed: '',
    institution: requestedUniversity || '',
    grade: '',
    english_test: settings.english_tests?.[0] || 'IELTS',
    english_score: '',
    destination,
    intake: settings.intake_options?.[0] || 'January 2026',
    course_type: settings.course_types?.[0] || 'Undergraduate',
    field_of_study: '',
    budget_range: '',
    wants_scholarship: scholarship ? 'yes' : settings.scholarship_options?.[0] || 'yes',
    agreed_to_contact: false,
  }
}

function Apply() {
  const { user } = useAuth()
  const { sections } = usePageSections('apply')
  const { scholarshipSlug } = useParams()
  const [searchParams] = useSearchParams()
  const applicationType = searchParams.get('type') || ''
  const jobId = searchParams.get('jobId') || ''
  const hero = sections.hero
  const wizard = sections.wizard
  const successSection = sections.success
  const wizardSettings = useMemo(() => wizard.settings ?? {}, [wizard.settings])
  const requestedDestination = searchParams.get('destination') || ''
  const requestedUniversity = searchParams.get('university') || ''
  const selectedJob = useMemo(() => {
    if (applicationType !== 'job') return null
    return getJobById(jobId)
  }, [applicationType, jobId])
  const selectedScholarship = useMemo(() => {
    const querySlug = searchParams.get('scholarship')
    return getScholarshipBySlug(scholarshipSlug || querySlug || '')
  }, [scholarshipSlug, searchParams])
  const destinationOptions = useMemo(() => {
    const baseOptions = wizardSettings.destination_options ?? []
    const preferredDestination = selectedScholarship?.destination?.trim() || requestedDestination.trim()

    if (!preferredDestination || baseOptions.includes(preferredDestination)) {
      return baseOptions
    }

    return [preferredDestination, ...baseOptions]
  }, [requestedDestination, selectedScholarship?.destination, wizardSettings.destination_options])

  const initialForm = useMemo(
    () =>
      buildInitialForm(
        {
          ...wizardSettings,
          destination_options: destinationOptions,
          requested_destination: requestedDestination,
          requested_university: requestedUniversity,
        },
        selectedScholarship,
      ),
    [destinationOptions, requestedDestination, requestedUniversity, selectedScholarship, wizardSettings],
  )

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submittedReference, setSubmittedReference] = useState('')

  useEffect(() => {
    setForm((current) => ({
      ...initialForm,
      full_name: current.full_name,
      email: current.email,
      phone: current.phone,
      dob: current.dob,
      nationality: current.nationality,
      city: current.city,
      highest_qualification: current.highest_qualification,
      year_completed: current.year_completed,
      institution: current.institution,
      grade: current.grade,
      english_score: current.english_score,
      field_of_study: current.field_of_study,
      budget_range: current.budget_range,
      agreed_to_contact: current.agreed_to_contact,
      english_test: wizardSettings.english_tests?.includes(current.english_test)
        ? current.english_test
        : initialForm.english_test,
      destination: destinationOptions.includes(current.destination)
        ? current.destination
        : initialForm.destination,
      intake: wizardSettings.intake_options?.includes(current.intake) ? current.intake : initialForm.intake,
      course_type: wizardSettings.course_types?.includes(current.course_type)
        ? current.course_type
        : initialForm.course_type,
      wants_scholarship: wizardSettings.scholarship_options?.includes(current.wants_scholarship)
        ? current.wants_scholarship
        : initialForm.wants_scholarship,
    }))
  }, [destinationOptions, initialForm, wizardSettings])

  const stepLabels = wizardSettings.step_labels ?? ['Personal Info', 'Academic Background', 'Study Preferences', 'Review & Submit']
  const progress = useMemo(() => ((step + 1) / stepLabels.length) * 100, [step, stepLabels.length])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function validateCurrentStep() {
    const nextErrors = {}

    if (step === 0) {
      if (!form.full_name.trim()) nextErrors.full_name = 'Full name is required.'
      if (!form.email.trim()) nextErrors.email = 'Email is required.'
      if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.'
      if (!form.dob) nextErrors.dob = 'Date of birth is required.'
      if (!form.nationality.trim()) nextErrors.nationality = 'Nationality is required.'
      if (!form.city.trim()) nextErrors.city = 'City is required.'
    }

    if (step === 1) {
      if (!form.highest_qualification.trim()) nextErrors.highest_qualification = 'Highest qualification is required.'
      if (!form.year_completed.trim()) nextErrors.year_completed = 'Year completed is required.'
      if (!form.institution.trim()) nextErrors.institution = 'Institution name is required.'
      if (!form.grade.trim()) nextErrors.grade = 'Grade or GPA is required.'
      if (form.english_test !== 'None' && !form.english_score.trim()) {
        nextErrors.english_score = 'Please provide your English test score.'
      }
    }

    if (step === 2) {
      if (!form.destination) nextErrors.destination = 'Preferred destination is required.'
      if (!form.intake) nextErrors.intake = 'Preferred intake is required.'
      if (!form.course_type) nextErrors.course_type = 'Course type is required.'
      if (!form.field_of_study.trim()) nextErrors.field_of_study = 'Field of study is required.'
      if (!form.budget_range.trim()) nextErrors.budget_range = 'Budget range is required.'
    }

    if (step === 3 && !form.agreed_to_contact) {
      nextErrors.agreed_to_contact = 'You must agree to be contacted by Brightpath Travel Scholars.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function nextStep() {
    if (!validateCurrentStep()) return
    setStep((current) => Math.min(current + 1, stepLabels.length - 1))
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateCurrentStep()) return

    setSubmitting(true)

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dob: form.dob,
        nationality: form.nationality.trim(),
        city: form.city.trim(),
        highest_qualification: form.highest_qualification.trim(),
        year_completed: form.year_completed.trim(),
        institution: form.institution.trim(),
        grade: form.grade.trim(),
        english_test: form.english_test,
        english_score: form.english_score.trim(),
        destination: form.destination,
        intake: form.intake,
        course_type: selectedScholarship ? `${form.course_type} | Scholarship Application` : form.course_type,
        field_of_study: selectedScholarship
          ? `${form.field_of_study.trim()} | Scholarship Interest: ${selectedScholarship.title}`
          : form.field_of_study.trim(),
        budget_range: form.budget_range.trim(),
        wants_scholarship: form.wants_scholarship === 'yes',
        status: 'pending',
      }

      const { data, error } = await supabase.from('applications').insert(payload).select('id').single()

      if (error) throw error

      setSubmittedReference(buildReference(data?.id))
      setForm(initialForm)
      setStep(0)
      setErrors({})
    } catch (error) {
      console.error('[Apply] Failed to submit application:', error)
      setErrors({ submit: 'We could not submit your application right now. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (scholarshipSlug && !selectedScholarship) {
    return <Navigate to="/study-abroad" replace />
  }

  if (applicationType === 'job') {
    if (!selectedJob) {
      return <Navigate to="/work-abroad" replace />
    }

    return <JobApplicationFlow job={selectedJob} user={user} />
  }

  if (submittedReference) {
    return (
      <div className="apply-page">
        <SEO
          title="Apply"
          description={
            selectedScholarship
              ? `Submit your application for ${selectedScholarship.title} and receive a reference number for follow-up.`
              : 'Submit your Brightpath Travel Scholars study abroad application and receive a reference number for follow-up.'
          }
          path={selectedScholarship ? `/scholarships/${selectedScholarship.slug}/apply` : '/apply'}
        />

        <section className="apply-success">
          <div className="container">
            <div className="apply-success-card">
              <span className="apply-success-icon">
                <CheckCircle2 size={28} />
              </span>
              <h1>{successSection.heading}</h1>
              <p>
                Your reference number is <strong>{submittedReference}</strong>. {successSection.subheading}
              </p>
              {selectedScholarship ? <p>You applied under the <strong>{selectedScholarship.title}</strong> track.</p> : null}
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSubmittedReference('')
                  setStep(0)
                  setErrors({})
                  setForm(initialForm)
                }}
              >
                {successSection.primary_btn_text || 'Start Another Application'}
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="apply-page">
      <SEO
        title={selectedScholarship ? `${selectedScholarship.title} Application` : 'Apply'}
        description={
          selectedScholarship
            ? `Apply for ${selectedScholarship.title} through Brightpath Travel Scholars with a guided scholarship application form.`
            : 'Apply to study abroad with Brightpath Travel Scholars through a guided multi-step application form.'
        }
        path={selectedScholarship ? `/scholarships/${selectedScholarship.slug}/apply` : '/apply'}
      />

      <section className="apply-hero">
        <div className="container">
          <span className="section-badge apply-hero-badge">
            {selectedScholarship ? 'Scholarship Application' : hero.badge_text}
          </span>
          <h1>{selectedScholarship ? `Apply for ${selectedScholarship.title}` : hero.heading}</h1>
          <p>
            {selectedScholarship
              ? `Share your academic background and goals so we can review your fit for ${selectedScholarship.title} and move you into the right scholarship support flow.`
              : requestedDestination
                ? `Start your ${requestedDestination}${requestedUniversity ? ` application for ${requestedUniversity}` : ' application'} with a guided form covering your background, goals, budget, and scholarship interest.`
              : hero.subheading}
          </p>

          {selectedScholarship || requestedDestination || requestedUniversity ? (
            <div className="apply-scholarship-context">
              <div className="apply-scholarship-context-row">
                <span>Destination</span>
                <strong>{selectedScholarship?.destination || requestedDestination}</strong>
              </div>
              {requestedUniversity ? (
                <div className="apply-scholarship-context-row">
                  <span>University</span>
                  <strong>{requestedUniversity}</strong>
                </div>
              ) : null}
              {selectedScholarship ? (
                <>
                  <div className="apply-scholarship-context-row">
                    <span>Scholarship</span>
                    <strong>{selectedScholarship.title}</strong>
                  </div>
                  <div className="apply-scholarship-context-row">
                    <span>Category</span>
                    <strong>{selectedScholarship.category}</strong>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <AnimatedSection>
        <section className="apply-section">
          <div className="container">
            <div className="apply-form-shell">
              <div className="apply-progress-header">
                <div>
                  <span className="section-badge">Step {step + 1} of {stepLabels.length}</span>
                  <h2>{stepLabels[step]}</h2>
                </div>
                <span className="apply-progress-text">{Math.round(progress)}% complete</span>
              </div>

              <div className="apply-progress-track">
                <div className="apply-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <div className="apply-step-markers">
                {stepLabels.map((label, index) => (
                  <div key={label} className={`apply-step-marker${index <= step ? ' active' : ''}`}>
                    <span>{index + 1}</span>
                    <strong>{label}</strong>
                  </div>
                ))}
              </div>

              <form className="apply-form" onSubmit={handleSubmit}>
                {step === 0 ? (
                  <div className="apply-fields-grid">
                    <label>
                      <span>Full Name</span>
                      <input type="text" value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} required />
                      {errors.full_name ? <small>{errors.full_name}</small> : null}
                    </label>

                    <label>
                      <span>Email</span>
                      <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
                      {errors.email ? <small>{errors.email}</small> : null}
                    </label>

                    <label>
                      <span>Phone</span>
                      <input type="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required />
                      {errors.phone ? <small>{errors.phone}</small> : null}
                    </label>

                    <label>
                      <span>Date of Birth</span>
                      <input type="date" value={form.dob} onChange={(event) => updateField('dob', event.target.value)} required />
                      {errors.dob ? <small>{errors.dob}</small> : null}
                    </label>

                    <label>
                      <span>Nationality</span>
                      <input type="text" value={form.nationality} onChange={(event) => updateField('nationality', event.target.value)} required />
                      {errors.nationality ? <small>{errors.nationality}</small> : null}
                    </label>

                    <label>
                      <span>City</span>
                      <input type="text" value={form.city} onChange={(event) => updateField('city', event.target.value)} required />
                      {errors.city ? <small>{errors.city}</small> : null}
                    </label>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="apply-fields-grid">
                    <label>
                      <span>Highest Qualification</span>
                      <input
                        type="text"
                        value={form.highest_qualification}
                        onChange={(event) => updateField('highest_qualification', event.target.value)}
                        required
                      />
                      {errors.highest_qualification ? <small>{errors.highest_qualification}</small> : null}
                    </label>

                    <label>
                      <span>Year Completed</span>
                      <input
                        type="text"
                        value={form.year_completed}
                        onChange={(event) => updateField('year_completed', event.target.value)}
                        placeholder="e.g. 2024"
                        required
                      />
                      {errors.year_completed ? <small>{errors.year_completed}</small> : null}
                    </label>

                    <label>
                      <span>Institution Name</span>
                      <input type="text" value={form.institution} onChange={(event) => updateField('institution', event.target.value)} required />
                      {errors.institution ? <small>{errors.institution}</small> : null}
                    </label>

                    <label>
                      <span>Grade / GPA</span>
                      <input type="text" value={form.grade} onChange={(event) => updateField('grade', event.target.value)} required />
                      {errors.grade ? <small>{errors.grade}</small> : null}
                    </label>

                    <label>
                      <span>English Test</span>
                      <select value={form.english_test} onChange={(event) => updateField('english_test', event.target.value)}>
                        {(wizardSettings.english_tests ?? []).map((test) => (
                          <option key={test} value={test}>
                            {test}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Score</span>
                      <input
                        type="text"
                        value={form.english_score}
                        onChange={(event) => updateField('english_score', event.target.value)}
                        placeholder={form.english_test === 'None' ? 'Not required' : 'Enter score'}
                        disabled={form.english_test === 'None'}
                      />
                      {errors.english_score ? <small>{errors.english_score}</small> : null}
                    </label>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="apply-fields-grid">
                    <label>
                      <span>Preferred Destination</span>
                      <select value={form.destination} onChange={(event) => updateField('destination', event.target.value)}>
                        {destinationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.destination ? <small>{errors.destination}</small> : null}
                    </label>

                    <label>
                      <span>Preferred Intake</span>
                      <select value={form.intake} onChange={(event) => updateField('intake', event.target.value)}>
                        {(wizardSettings.intake_options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.intake ? <small>{errors.intake}</small> : null}
                    </label>

                    <label>
                      <span>Course Type</span>
                      <select value={form.course_type} onChange={(event) => updateField('course_type', event.target.value)}>
                        {(wizardSettings.course_types ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.course_type ? <small>{errors.course_type}</small> : null}
                    </label>

                    <label>
                      <span>Field of Study</span>
                      <input type="text" value={form.field_of_study} onChange={(event) => updateField('field_of_study', event.target.value)} required />
                      {errors.field_of_study ? <small>{errors.field_of_study}</small> : null}
                    </label>

                    <label>
                      <span>Budget Range</span>
                      <input
                        type="text"
                        value={form.budget_range}
                        onChange={(event) => updateField('budget_range', event.target.value)}
                        placeholder="e.g. USD 10,000 - 20,000 per year"
                        required
                      />
                      {errors.budget_range ? <small>{errors.budget_range}</small> : null}
                    </label>

                    <label>
                      <span>Interested in Scholarships?</span>
                      <select value={form.wants_scholarship} onChange={(event) => updateField('wants_scholarship', event.target.value)}>
                        {(wizardSettings.scholarship_options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="apply-review">
                    {selectedScholarship ? (
                      <div className="apply-review-banner">
                        <strong>Target Scholarship:</strong> {selectedScholarship.title}
                      </div>
                    ) : null}

                    <div className="apply-review-grid">
                      <div>
                        <h3>{stepLabels[0]}</h3>
                        <p><strong>Name:</strong> {form.full_name}</p>
                        <p><strong>Email:</strong> {form.email}</p>
                        <p><strong>Phone:</strong> {form.phone}</p>
                        <p><strong>Date of Birth:</strong> {form.dob}</p>
                        <p><strong>Nationality:</strong> {form.nationality}</p>
                        <p><strong>City:</strong> {form.city}</p>
                      </div>
                      <div>
                        <h3>{stepLabels[1]}</h3>
                        <p><strong>Qualification:</strong> {form.highest_qualification}</p>
                        <p><strong>Year Completed:</strong> {form.year_completed}</p>
                        <p><strong>Institution:</strong> {form.institution}</p>
                        <p><strong>Grade / GPA:</strong> {form.grade}</p>
                        <p><strong>English Test:</strong> {form.english_test}</p>
                        <p><strong>Score:</strong> {form.english_score || 'N/A'}</p>
                      </div>
                      <div>
                        <h3>{stepLabels[2]}</h3>
                        <p><strong>Destination:</strong> {form.destination}</p>
                        <p><strong>Intake:</strong> {form.intake}</p>
                        <p><strong>Course Type:</strong> {form.course_type}</p>
                        <p><strong>Field:</strong> {form.field_of_study}</p>
                        <p><strong>Budget:</strong> {form.budget_range}</p>
                        <p><strong>Scholarship Interest:</strong> {form.wants_scholarship}</p>
                      </div>
                    </div>

                    <label className="apply-checkbox">
                      <input
                        type="checkbox"
                        checked={form.agreed_to_contact}
                        onChange={(event) => updateField('agreed_to_contact', event.target.checked)}
                      />
                      <span>
                        I agree to be contacted by Brightpath Travel Scholars about this
                        {selectedScholarship ? ` ${selectedScholarship.title}` : ''} application.
                      </span>
                    </label>
                    {errors.agreed_to_contact ? <small>{errors.agreed_to_contact}</small> : null}
                  </div>
                ) : null}

                {errors.submit ? <div className="apply-submit-error">{errors.submit}</div> : null}

                <div className="apply-actions">
                  {step > 0 ? (
                    <button type="button" className="btn-secondary apply-nav-btn" onClick={previousStep}>
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                  ) : (
                    <span />
                  )}

                  {step < stepLabels.length - 1 ? (
                    <button type="button" className="btn-primary apply-nav-btn" onClick={nextStep}>
                      Next
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button type="submit" className="btn-primary apply-nav-btn" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default Apply

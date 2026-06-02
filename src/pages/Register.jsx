import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, User2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { usePageSections } from '../hooks/usePageSections'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

function Register() {
  const { sections } = usePageSections('register')
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const hero = sections.hero
  const formSection = sections.form

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, navigate, user])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    if (form.password.length < 6) {
      setSubmitting(false)
      setError('Use a password with at least 6 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setSubmitting(false)
      setError('Your passwords do not match.')
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user?.id && data.session) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: form.email.trim(),
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            role: 'user',
          },
          { onConflict: 'id' },
        )

        if (profileError) {
          console.warn('[Register] Profile upsert skipped after signup:', profileError)
        }
      }

      setSuccess(
        formSection.settings?.success_message ||
          'Account created. Please check your email to confirm your registration before signing in.',
      )
      setForm({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      })
    } catch (submitError) {
      console.error('[Register] Registration failed:', submitError)
      setError(submitError.message || 'We could not create your account right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <SEO
        title="Register"
        description="Create your Brightpath Travel Scholars account to start your study abroad journey and track your application."
        path="/register"
      />

      <div className="container auth-shell">
        <section className="auth-panel auth-panel-hero">
          <span className="section-badge">{hero.badge_text}</span>
          <h1>{hero.heading}</h1>
          <p>{hero.subheading}</p>
          <div className="auth-highlights">
            {(hero.items ?? []).map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-panel auth-card-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>{formSection.heading}</h2>
              <p>{formSection.subheading}</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Full Name</span>
                <div className="auth-input-wrap">
                  <User2 size={18} />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.full_name}
                    onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                    required
                  />
                </div>
              </label>

              <label>
                <span>Email Address</span>
                <div className="auth-input-wrap">
                  <Mail size={18} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </div>
              </label>

              <label>
                <span>Phone Number</span>
                <div className="auth-input-wrap">
                  <Phone size={18} />
                  <input
                    type="tel"
                    placeholder="+254..."
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    required
                  />
                </div>
              </label>

              <label>
                <span>Password</span>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </label>

              <label>
                <span>Confirm Password</span>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </label>

              {error ? <p className="auth-message error">{error}</p> : null}
              {success ? <p className="auth-message success">{success}</p> : null}

              <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
                {submitting ? 'Creating Account...' : formSection.primary_btn_text || 'Register'}
                {!submitting ? <ArrowRight size={18} /> : null}
              </button>
            </form>

            <div className="auth-links">
              <span>
                {formSection.settings?.footer_text || 'Already have an account?'}{' '}
                <Link to={formSection.settings?.footer_link_url || '/login'}>
                  {formSection.settings?.footer_link_text || 'Sign in'}
                </Link>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Register

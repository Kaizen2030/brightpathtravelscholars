import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { usePageSections } from '../hooks/usePageSections'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

function Login() {
  const { sections } = usePageSections('login')
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: location.state?.email ?? '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const hero = sections.hero
  const formSection = sections.form
  const resetMessage = location.state?.message

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, navigate, user])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })

      if (signInError) throw signInError

      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      console.error('[Login] Sign in failed:', submitError)
      setError(submitError.message || 'We could not sign you in right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <SEO
        title="Login"
        description="Sign in to your Brightpath Travel Scholars dashboard to track your application and manage your profile."
        path="/login"
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
                <span>Password</span>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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

              {resetMessage ? <p className="auth-message success">{resetMessage}</p> : null}
              {error ? <p className="auth-message error">{error}</p> : null}

              <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
                {submitting ? 'Signing In...' : formSection.primary_btn_text || 'Sign In'}
                {!submitting ? <ArrowRight size={18} /> : null}
              </button>
            </form>

            <div className="auth-links">
              <Link to="/forgot-password">{formSection.settings?.forgot_link_text || 'Forgot your password?'}</Link>
              <span>
                {formSection.settings?.footer_text || 'New here?'}{' '}
                <Link to={formSection.settings?.footer_link_url || '/register'}>
                  {formSection.settings?.footer_link_text || 'Create an account'}
                </Link>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login

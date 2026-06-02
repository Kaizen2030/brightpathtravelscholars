import { useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { usePageSections } from '../hooks/usePageSections'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

function ForgotPassword() {
  const { sections } = usePageSections('forgot_password')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const recovery = sections.hero

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      })

      if (resetError) throw resetError

      setSuccess(
        recovery.settings?.success_message || 'Password reset instructions have been sent to your email address.',
      )
      setEmail('')
    } catch (submitError) {
      console.error('[ForgotPassword] Reset request failed:', submitError)
      setError(submitError.message || 'We could not send the reset email right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <SEO
        title="Forgot Password"
        description="Request a Brightpath Travel Scholars password reset email."
        path="/forgot-password"
        noindex
      />

      <div className="container auth-shell auth-shell-single">
        <section className="auth-panel auth-card-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <span className="section-badge">{recovery.badge_text}</span>
              <h2>{recovery.heading}</h2>
              <p>{recovery.subheading}</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Email Address</span>
                <div className="auth-input-wrap">
                  <Mail size={18} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </label>

              {error ? <p className="auth-message error">{error}</p> : null}
              {success ? <p className="auth-message success">{success}</p> : null}

              <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
                {submitting ? 'Sending...' : recovery.primary_btn_text || 'Send Reset Link'}
                {!submitting ? <ArrowRight size={18} /> : null}
              </button>
            </form>

            <div className="auth-links">
              <span>
                {recovery.settings?.footer_text || 'Remembered your password?'}{' '}
                <Link to={recovery.settings?.footer_link_url || '/login'}>
                  {recovery.settings?.footer_link_text || 'Back to sign in'}
                </Link>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ForgotPassword

import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

function ResetPassword() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [verifyingLink, setVerifyingLink] = useState(Boolean(searchParams.get('code')))

  const code = searchParams.get('code')

  useEffect(() => {
    let isActive = true

    async function verifyRecoveryCode() {
      if (!code) {
        setVerifyingLink(false)
        return
      }

      if (user) {
        setVerifyingLink(false)
        return
      }

      if (loading) {
        return
      }

      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) throw exchangeError
      } catch (exchangeError) {
        console.error('[ResetPassword] Recovery link verification failed:', exchangeError)
        if (isActive) {
          setError(exchangeError.message || 'This password reset link is no longer valid.')
        }
      } finally {
        if (isActive) {
          setVerifyingLink(false)
        }
      }
    }

    verifyRecoveryCode()

    return () => {
      isActive = false
    }
  }, [code, loading, user])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    if (!user) {
      setSubmitting(false)
      setError('Open the reset link from your email before setting a new password.')
      return
    }

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
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password,
      })

      if (updateError) throw updateError

      const userEmail = user.email || ''
      await supabase.auth.signOut()

      navigate('/login', {
        replace: true,
        state: {
          email: userEmail,
          message: 'Password updated. Sign in with your new password.',
        },
      })
    } catch (submitError) {
      console.error('[ResetPassword] Password update failed:', submitError)
      setError(submitError.message || 'We could not update your password right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <SEO
        title="Reset Password"
        description="Set a new Brightpath Travel Scholars password after using your recovery email."
        path="/reset-password"
        noindex
      />

      <div className="container auth-shell auth-shell-single">
        <section className="auth-panel auth-card-panel">
          <div className="auth-card">
            <div className="auth-card-header">
              <span className="section-badge">Password Recovery</span>
              <h2>Set a new password</h2>
              <p>Choose a new password and confirm it before going back to sign in.</p>
            </div>

            {verifyingLink || loading ? (
              <p className="auth-message">Checking your reset link...</p>
            ) : null}

            {!verifyingLink && !loading && !user ? (
              <p className="auth-message error">
                This reset link is not active anymore. Please request a new one from the forgot password page.
              </p>
            ) : null}

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>New Password</span>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a new password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required
                    disabled={!user || submitting}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    disabled={!user}
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
                    placeholder="Confirm your new password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    required
                    disabled={!user || submitting}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showConfirmPassword}
                    disabled={!user}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </label>

              {message ? <p className="auth-message success">{message}</p> : null}
              {error ? <p className="auth-message error">{error}</p> : null}

              <button type="submit" className="btn-primary auth-submit" disabled={submitting || !user}>
                {submitting ? 'Updating...' : 'Update Password'}
                {!submitting ? <ArrowRight size={18} /> : null}
              </button>
            </form>

            <div className="auth-links">
              <span>
                Want to go back? <Link to="/login">Sign in</Link>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ResetPassword

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
  const hashParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '',
  )
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [verifyingLink, setVerifyingLink] = useState(
    Boolean(searchParams.get('code') || searchParams.get('token_hash') || hashParams.get('access_token')),
  )
  const [awaitingRecoverySession, setAwaitingRecoverySession] = useState(Boolean(searchParams.get('code') || searchParams.get('token_hash') || hashParams.get('access_token')))

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const accessToken = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')
  const hasRecoveryParams = Boolean(code || tokenHash || (accessToken && refreshToken))

  useEffect(() => {
    let isActive = true

    async function verifyRecoveryLink() {
      if (!hasRecoveryParams) {
        setVerifyingLink(false)
        setAwaitingRecoverySession(false)
        return
      }

      if (user) {
        setVerifyingLink(false)
        setAwaitingRecoverySession(false)
        return
      }

      if (loading) {
        return
      }

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        } else if (tokenHash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          })
          if (verifyError) throw verifyError
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (sessionError) throw sessionError
        }

        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, '/reset-password')
        }

        setAwaitingRecoverySession(true)
      } catch (exchangeError) {
        console.error('[ResetPassword] Recovery link verification failed:', exchangeError)
        if (isActive) {
          setAwaitingRecoverySession(false)
          setError(exchangeError.message || 'This password reset link is no longer valid.')
        }
      } finally {
        if (isActive) {
          setVerifyingLink(false)
        }
      }
    }

    verifyRecoveryLink()

    return () => {
      isActive = false
    }
  }, [accessToken, code, hasRecoveryParams, loading, refreshToken, tokenHash, user])

  useEffect(() => {
    if (!hasRecoveryParams) return undefined

    let isActive = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!isActive) return

      if (event === 'PASSWORD_RECOVERY') {
        setAwaitingRecoverySession(true)
        setVerifyingLink(false)
        setError('')
      }
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [hasRecoveryParams])

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

            {verifyingLink || loading || (awaitingRecoverySession && !user) ? (
              <p className="auth-message">Checking your reset link...</p>
            ) : null}

            {!verifyingLink && !loading && !awaitingRecoverySession && !user && hasRecoveryParams ? (
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

import { createClient } from '@supabase/supabase-js'
import { supabaseAnonKey, supabaseUrl } from './supabaseClient'

const analyticsSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
})

const ANALYTICS_SESSION_KEY = 'brightpath-analytics-session-v1'
const ANALYTICS_COUNTRY_KEY = 'brightpath-analytics-country-v1'
const ANALYTICS_DISABLED_KEY = 'brightpath-analytics-disabled-v1'
const ANALYTICS_FAIL_COUNT_KEY = 'brightpath-analytics-failcount-v1'
const MAX_ANALYTICS_FAILURES = 3

function safeRead(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Ignore storage issues and keep analytics best-effort.
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage issues and keep analytics best-effort.
  }
}

function createFallbackId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function isAnalyticsDisabled() {
  if (typeof window === 'undefined') return false
  // Allow build-time env override in Vite: VITE_DISABLE_ANALYTICS='true'
  try {
    // Opt-in: only enable analytics when VITE_ENABLE_ANALYTICS is explicitly set to 'true'
    if (import.meta?.env?.VITE_DISABLE_ANALYTICS === 'true') return true
    if (import.meta?.env?.VITE_ENABLE_ANALYTICS !== 'true') return true
  } catch {
    // ignore access errors
  }

  return safeRead(ANALYTICS_DISABLED_KEY) === 'true'
}

function getFailureCount() {
  try {
    const raw = safeRead(ANALYTICS_FAIL_COUNT_KEY)
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

function resetFailureCount() {
  try {
    safeWrite(ANALYTICS_FAIL_COUNT_KEY, '0')
  } catch {
    // ignore
  }
}

function incFailureCount() {
  try {
    const next = getFailureCount() + 1
    safeWrite(ANALYTICS_FAIL_COUNT_KEY, String(next))
    return next
  } catch {
    return getFailureCount()
  }
}

function disableAnalytics() {
  if (typeof window === 'undefined') return
  safeWrite(ANALYTICS_DISABLED_KEY, 'true')
}

function enableAnalytics() {
  if (typeof window === 'undefined') return
  safeRemove(ANALYTICS_DISABLED_KEY)
}

function isUnauthorizedError(error) {
  const status = Number(error?.status || error?.statusCode || error?.code || 0)
  const message = String(error?.message || '').toLowerCase()
  return status === 401 || status === 403 || message.includes('unauthorized') || message.includes('forbidden')
}

export function getAnalyticsSessionId() {
  if (typeof window === 'undefined') return createFallbackId()

  const existing = safeRead(ANALYTICS_SESSION_KEY)
  if (existing) return existing

  const nextId = globalThis.crypto?.randomUUID?.() ?? createFallbackId()
  safeWrite(ANALYTICS_SESSION_KEY, nextId)
  return nextId
}

export function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth
  if (width < 640) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

async function resolveCountry() {
  if (typeof window === 'undefined') {
    return { country_code: '', country_name: 'Unknown' }
  }

  const cached = safeRead(ANALYTICS_COUNTRY_KEY)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // ignore bad cache and resolve again
    }
  }

  try {
    const response = await fetch('https://ipapi.co/json/', {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) throw new Error('Country lookup failed.')

    const data = await response.json()
    const payload = {
      country_code: data.country_code || '',
      country_name: data.country_name || data.country || 'Unknown',
    }

    safeWrite(ANALYTICS_COUNTRY_KEY, JSON.stringify(payload))
    return payload
  } catch {
    const fallback = { country_code: '', country_name: 'Unknown' }
    safeWrite(ANALYTICS_COUNTRY_KEY, JSON.stringify(fallback))
    return fallback
  }
}

async function upsertAnalyticsSession({ pathname, title, user }) {
  if (isAnalyticsDisabled()) return null

  const sessionId = getAnalyticsSessionId()
  const country = await resolveCountry()
  const deviceType = getDeviceType()

  try {
    const { error } = await analyticsSupabase.from('analytics_sessions').upsert(
      {
        session_id: sessionId,
        user_id: user?.id ?? null,
        email: user?.email ?? null,
        country_code: country.country_code,
        country_name: country.country_name,
        device_type: deviceType,
        current_path: pathname,
        current_title: title || '',
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'session_id' },
    )

    if (error) {
      if (isUnauthorizedError(error)) {
        disableAnalytics()
        return null
      }

      const status = Number(error?.status || error?.statusCode || error?.code || 0)
      if (!status || status === 0) {
        const next = incFailureCount()
        if (next >= MAX_ANALYTICS_FAILURES) {
          disableAnalytics()
          return null
        }
      }

      throw error
    }

    resetFailureCount()
    return { sessionId, country, deviceType }
  } catch (err) {
    const next = incFailureCount()
    if (next >= MAX_ANALYTICS_FAILURES) {
      disableAnalytics()
      return null
    }
    throw err
  }
}

export async function recordPageView({ pathname, title, user }) {
  if (typeof window === 'undefined' || pathname.startsWith('/admin')) return
  try {
    const result = await upsertAnalyticsSession({ pathname, title, user })
    if (!result) return

    const { sessionId, country, deviceType } = result

    const { error } = await analyticsSupabase.from('analytics_events').insert({
      session_id: sessionId,
      user_id: user?.id ?? null,
      path: pathname,
      page_title: title || '',
      referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
      country_code: country.country_code,
      country_name: country.country_name,
      device_type: deviceType,
      event_type: 'page_view',
    })

    if (error) {
      if (isUnauthorizedError(error)) {
        disableAnalytics()
        return
      }

      const status = Number(error?.status || error?.statusCode || error?.code || 0)
      if (!status || status === 0) {
        const next = incFailureCount()
        if (next >= MAX_ANALYTICS_FAILURES) {
          disableAnalytics()
          return
        }
      }

      throw error
    }

    resetFailureCount()
  } catch (err) {
    try {
      const next = incFailureCount()
      if (next >= MAX_ANALYTICS_FAILURES) {
        disableAnalytics()
        return
      }
    } catch {
      // ignore
    }
    console.warn('[Analytics] recordPageView error:', err)
  }
}

export async function touchAnalyticsSession({ pathname, title, user }) {
  if (typeof window === 'undefined' || pathname.startsWith('/admin')) return
  try {
    const result = await upsertAnalyticsSession({ pathname, title, user })
    if (!result) return
  } catch (err) {
    try {
      const next = incFailureCount()
      if (next >= MAX_ANALYTICS_FAILURES) {
        disableAnalytics()
        return
      }
    } catch {
      // ignore
    }
    console.warn('[Analytics] touchAnalyticsSession error:', err)
  }
}

export function resetAnalyticsDisabledFlag() {
  enableAnalytics()
}

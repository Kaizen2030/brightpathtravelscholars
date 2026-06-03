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

function isAnalyticsDisabled() {
  if (typeof window === 'undefined') return false
  return safeRead(ANALYTICS_DISABLED_KEY) === 'true'
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

    throw error
  }

  return { sessionId, country, deviceType }
}

export async function recordPageView({ pathname, title, user }) {
  if (typeof window === 'undefined' || pathname.startsWith('/admin')) return

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

    throw error
  }
}

export async function touchAnalyticsSession({ pathname, title, user }) {
  if (typeof window === 'undefined' || pathname.startsWith('/admin')) return

  const result = await upsertAnalyticsSession({ pathname, title, user })
  if (!result) return
}

export function resetAnalyticsDisabledFlag() {
  enableAnalytics()
}

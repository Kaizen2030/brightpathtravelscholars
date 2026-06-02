import { createClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(value) {
  const rawValue = value?.trim()

  if (!rawValue) {
    throw new Error('Missing VITE_SUPABASE_URL in your environment.')
  }

  try {
    const parsedUrl = new URL(rawValue)

    if (parsedUrl.hostname === 'supabase.com') {
      const segments = parsedUrl.pathname.split('/').filter(Boolean)
      const projectIndex = segments.indexOf('project')
      const projectRef = projectIndex >= 0 ? segments[projectIndex + 1] : ''

      if (projectRef) {
        return `https://${projectRef}.supabase.co`
      }
    }
  } catch {
    throw new Error('VITE_SUPABASE_URL is not a valid URL.')
  }

  return rawValue
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase

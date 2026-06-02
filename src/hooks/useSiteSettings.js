import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { buildSiteSettings, readCachedSiteSettings, writeCachedSiteSettings, getDefaultSiteSettings } from '../lib/siteSettings'

export function useSiteSettings() {
  const [settings, setSettings] = useState(() => readCachedSiteSettings())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadSettings() {
      setLoading(true)

      try {
        const { data, error } = await supabase.from('site_settings').select('key, value').order('key', { ascending: true })

        if (ignore) return

        if (error) {
          console.error('[SiteSettings] Failed to load site settings:', error)
          const fallback = getDefaultSiteSettings()
          setSettings(fallback)
          writeCachedSiteSettings(fallback)
        } else {
          const nextSettings = buildSiteSettings(data ?? [])
          setSettings(nextSettings)
          writeCachedSiteSettings(nextSettings)
        }
      } catch (error) {
        console.error('[SiteSettings] Unexpected load failure:', error)
        if (!ignore) {
          const fallback = getDefaultSiteSettings()
          setSettings(fallback)
          writeCachedSiteSettings(fallback)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      ignore = true
    }
  }, [])

  return { settings, loading }
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { buildSiteSettings, readCachedSiteSettings, writeCachedSiteSettings, getDefaultSiteSettings } from '../lib/siteSettings'
import { fetchCached } from '../lib/dataCache'

export function useSiteSettings() {
  const [settings, setSettings] = useState(() => readCachedSiteSettings())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadSettings() {
      setLoading(true)

      try {
        const data = await fetchCached(
          'site_settings',
          async () => {
            const { data, error } = await supabase.from('site_settings').select('key, value').order('key', { ascending: true })
            if (error) throw error
            return data ?? []
          },
          5 * 60 * 1000,
        )

        if (ignore) return

        const nextSettings = buildSiteSettings(data ?? [])
        setSettings(nextSettings)
        writeCachedSiteSettings(nextSettings)
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

    function handleExternalUpdate() {
      // Reload settings when an external update is signalled (admin saved changes)
      loadSettings()
    }

    window.addEventListener('brightpath:site-settings-updated', handleExternalUpdate)

    return () => {
      ignore = true
      window.removeEventListener('brightpath:site-settings-updated', handleExternalUpdate)
    }
  }, [])

  return { settings, loading }
}

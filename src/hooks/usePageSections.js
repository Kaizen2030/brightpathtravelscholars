import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getPageSectionDefaults, mergePageSections } from '../lib/pageSections'
import { fetchCached } from '../lib/dataCache'

export function usePageSections(pageKey) {
  const [sections, setSections] = useState(() => getPageSectionDefaults(pageKey))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadSections() {
      setLoading(true)

      try {
        const cacheKey = `page_sections:${pageKey}`
        const data = await fetchCached(
          cacheKey,
          async () => {
            const { data, error } = await supabase
              .from('page_sections')
              .select(
                'id, page_key, section_key, label, heading, subheading, body_text, badge_text, primary_btn_text, primary_btn_url, secondary_btn_text, secondary_btn_url, media_url, media_secondary_url, enabled, order_index, items_json, settings_json',
              )
              .eq('page_key', pageKey)
              .order('order_index', { ascending: true })

            if (error) throw error
            return data ?? []
          },
          5 * 60 * 1000,
        )

        if (ignore) return

        setSections(mergePageSections(pageKey, data ?? []))
      } catch (error) {
        console.error(`[PageSections] Unexpected load failure for ${pageKey}:`, error)
        if (!ignore) {
          setSections(getPageSectionDefaults(pageKey))
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadSections()

    function handleExternalUpdate(e) {
      try {
        const updatedPage = e?.detail?.pageKey
        if (!updatedPage || updatedPage !== pageKey) return
        loadSections()
      } catch {
        // ignore
      }
    }

    window.addEventListener('brightpath:page-sections-updated', handleExternalUpdate)

    return () => {
      ignore = true
      window.removeEventListener('brightpath:page-sections-updated', handleExternalUpdate)
    }
  }, [pageKey])

  return { sections, loading }
}

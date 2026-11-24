import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { clearCache, fetchCached } from './dataCache'
import { getCountryMeta, JOB_CATALOG } from './jobCatalog'

export const JOBS_CACHE_KEY = 'public_jobs'
export const JOBS_UPDATED_EVENT = 'brightpath:jobs-updated'
export const JOB_STATUS_OPTIONS = ['open', 'closing_soon', 'closed']
export const JOB_TYPE_OPTIONS = ['unskilled', 'skilled']

function inferSalaryPeriod(salary) {
  const normalized = String(salary || '').toLowerCase()
  if (normalized.includes('/hour')) return 'hour'
  if (normalized.includes('/month')) return 'month'
  return 'year'
}

function toList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

/** Convert a `public.jobs` database row into the shape the public pages use. */
export function normalizeJobRow(row) {
  if (!row) return null
  const meta = getCountryMeta(row.country || '')

  return {
    id: row.id,
    title: row.title || '',
    country: row.country || '',
    countrySlug: meta.slug,
    flag: meta.flag,
    region: row.region || '',
    type: row.type || 'unskilled',
    category: row.category || '',
    salary: row.salary || '',
    salaryPeriod: inferSalaryPeriod(row.salary),
    positions: Number(row.positions) || 0,
    experience: row.experience || '',
    education: row.education || '',
    language: row.language || '',
    visaSponsorship: Boolean(row.visa_sponsorship),
    accommodationProvided: Boolean(row.accommodation_provided),
    contractDuration: row.contract_duration || '',
    description: row.description || '',
    requirements: toList(row.requirements),
    benefits: toList(row.benefits),
    employer: row.employer || '',
    postedDate: row.posted_date || '',
    deadline: row.deadline || '',
    imageKeyword: '',
    imageUrl: row.image_url || '',
    featured: Boolean(row.featured),
    status: row.status || 'open',
    isPublished: row.is_published !== false,
    orderIndex: Number(row.order_index) || 0,
  }
}

/** Convert a catalog job (camelCase) into a `public.jobs` row (snake_case). */
export function jobToRow(job) {
  return {
    id: job.id,
    title: job.title,
    country: job.country,
    region: job.region,
    type: job.type,
    category: job.category,
    salary: job.salary,
    positions: Number(job.positions) || 0,
    experience: job.experience || null,
    education: job.education || null,
    language: job.language || null,
    visa_sponsorship: Boolean(job.visaSponsorship),
    accommodation_provided: Boolean(job.accommodationProvided),
    contract_duration: job.contractDuration || null,
    employer: job.employer || null,
    description: job.description || null,
    requirements: toList(job.requirements),
    benefits: toList(job.benefits),
    image_url: job.imageUrl || null,
    featured: Boolean(job.featured),
    status: job.status || 'open',
    posted_date: job.postedDate || null,
    deadline: job.deadline || null,
    is_published: job.isPublished !== false,
    order_index: Number(job.orderIndex) || 0,
  }
}

async function fetchPublishedJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_published', true)
    .order('order_index', { ascending: true })
    .order('posted_date', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeJobRow).filter(Boolean)
}

/**
 * Loads jobs from Supabase. Until the `jobs` table exists and has rows,
 * the built-in catalog is used so the site never shows an empty jobs board.
 */
export function useJobs() {
  const [jobs, setJobs] = useState(JOB_CATALOG)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('catalog')

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      try {
        const rows = await fetchCached(JOBS_CACHE_KEY, fetchPublishedJobs, 5 * 60 * 1000)
        if (ignore) return
        if (rows.length) {
          setJobs(rows)
          setSource('database')
        } else {
          setJobs(JOB_CATALOG)
          setSource('catalog')
        }
      } catch (error) {
        if (!ignore) {
          console.warn('[Jobs] Falling back to built-in catalog:', error?.message || error)
          setJobs(JOB_CATALOG)
          setSource('catalog')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()

    function handleUpdate() {
      clearCache(JOBS_CACHE_KEY)
      load()
    }

    window.addEventListener(JOBS_UPDATED_EVENT, handleUpdate)
    return () => {
      ignore = true
      window.removeEventListener(JOBS_UPDATED_EVENT, handleUpdate)
    }
  }, [])

  return { jobs, loading, source }
}

export function notifyJobsUpdated() {
  clearCache(JOBS_CACHE_KEY)
  window.dispatchEvent(new Event(JOBS_UPDATED_EVENT))
}

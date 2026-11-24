/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { JOB_CATALOG, JOB_CATEGORY_OPTIONS, JOB_COUNTRIES, buildJobDetailPath } from '../../lib/jobCatalog'
import { getDefaultJobImageUrl, getJobImageUrl, JOB_IMAGE_LIBRARY } from '../../lib/jobMedia'
import { JOB_STATUS_OPTIONS, JOB_TYPE_OPTIONS, jobToRow, normalizeJobRow, notifyJobsUpdated } from '../../lib/jobsStore'
import './AdminCatalog.css'

const MIGRATION_FILE = 'supabase/migrations/20261124_jobs_scholarships_admin.sql'

function todayIso(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

const EMPTY_FORM = {
  id: '',
  title: '',
  country: 'Canada',
  region: '',
  type: 'unskilled',
  category: 'Warehouse',
  salary: '',
  positions: 1,
  experience: 'No experience required',
  education: 'Secondary school',
  language: 'English basic',
  visa_sponsorship: true,
  accommodation_provided: false,
  contract_duration: '1 year renewable',
  employer: '',
  description: '',
  requirements: '',
  benefits: '',
  image_url: '',
  featured: false,
  status: 'open',
  posted_date: '',
  deadline: '',
  is_published: true,
  order_index: 0,
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isMissingTableError(error) {
  const message = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  return message.includes('42p01') || message.includes('pgrst205') || message.includes('does not exist') || message.includes('could not find the table')
}

function rowToForm(row) {
  return {
    ...EMPTY_FORM,
    ...row,
    positions: row.positions ?? 1,
    requirements: Array.isArray(row.requirements) ? row.requirements.join('\n') : row.requirements || '',
    benefits: Array.isArray(row.benefits) ? row.benefits.join('\n') : row.benefits || '',
    image_url: row.image_url || '',
    posted_date: row.posted_date || '',
    deadline: row.deadline || '',
    order_index: row.order_index ?? 0,
  }
}

function formToRow(form) {
  const lines = (value) =>
    String(value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  return {
    id: form.id,
    title: form.title.trim(),
    country: form.country.trim(),
    region: form.region.trim(),
    type: form.type,
    category: form.category.trim(),
    salary: form.salary.trim(),
    positions: Number(form.positions) || 0,
    experience: form.experience.trim() || null,
    education: form.education.trim() || null,
    language: form.language.trim() || null,
    visa_sponsorship: Boolean(form.visa_sponsorship),
    accommodation_provided: Boolean(form.accommodation_provided),
    contract_duration: form.contract_duration.trim() || null,
    employer: form.employer.trim() || null,
    description: form.description.trim() || null,
    requirements: lines(form.requirements),
    benefits: lines(form.benefits),
    image_url: form.image_url.trim() || null,
    featured: Boolean(form.featured),
    status: form.status,
    posted_date: form.posted_date || null,
    deadline: form.deadline || null,
    is_published: Boolean(form.is_published),
    order_index: Number(form.order_index) || 0,
    updated_at: new Date().toISOString(),
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function JobsManager() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [isNew, setIsNew] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('country', { ascending: true })
        .order('order_index', { ascending: true })
        .order('posted_date', { ascending: false })

      if (error) throw error
      setRows(data ?? [])
      setTableMissing(false)
    } catch (error) {
      if (isMissingTableError(error)) {
        setTableMissing(true)
      } else {
        setNotice({ type: 'error', text: `Could not load jobs: ${error.message || error}` })
      }
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const existingIds = useMemo(() => new Set(rows.map((row) => row.id)), [rows])
  const missingCatalogJobs = useMemo(() => JOB_CATALOG.filter((job) => !existingIds.has(job.id)), [existingIds])

  const countryOptions = useMemo(
    () => [...new Set([...JOB_COUNTRIES, ...rows.map((row) => row.country).filter(Boolean)])],
    [rows],
  )
  const categoryOptions = useMemo(
    () => [...new Set([...JOB_CATEGORY_OPTIONS, ...rows.map((row) => row.category).filter(Boolean)])].sort(),
    [rows],
  )

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (countryFilter !== 'all' && row.country !== countryFilter) return false
      if (categoryFilter !== 'all' && row.category !== categoryFilter) return false
      if (statusFilter === 'hidden' && row.is_published !== false) return false
      if (statusFilter !== 'all' && statusFilter !== 'hidden' && row.status !== statusFilter) return false
      if (!query) return true
      return [row.title, row.region, row.employer, row.country, row.category, row.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [categoryFilter, countryFilter, rows, search, statusFilter])

  const stats = useMemo(
    () => ({
      total: rows.length,
      published: rows.filter((row) => row.is_published !== false).length,
      featured: rows.filter((row) => row.featured).length,
      closed: rows.filter((row) => row.status === 'closed').length,
    }),
    [rows],
  )

  async function importCatalog() {
    if (!missingCatalogJobs.length) return
    setBusy(true)
    setNotice(null)
    try {
      const payload = missingCatalogJobs.map((job, index) => ({ ...jobToRow(job), order_index: index }))
      // ignoreDuplicates => existing rows are never overwritten.
      const { error } = await supabase.from('jobs').upsert(payload, { onConflict: 'id', ignoreDuplicates: true })
      if (error) throw error
      setNotice({ type: 'success', text: `Imported ${payload.length} built-in jobs. Existing jobs were left unchanged.` })
      notifyJobsUpdated()
      await loadJobs()
    } catch (error) {
      setNotice({ type: 'error', text: `Import failed: ${error.message || error}` })
    } finally {
      setBusy(false)
    }
  }

  function resetImageState(nextPreview = '') {
    setImageFile(null)
    setImagePreview(nextPreview)
    setPickerOpen(false)
  }

  function openEditor(row = null, { duplicate = false } = {}) {
    if (row) {
      const nextForm = rowToForm(row)
      if (duplicate) {
        nextForm.id = ''
        nextForm.title = `${nextForm.title} (copy)`
        nextForm.featured = false
      }
      setForm(nextForm)
      setIsNew(duplicate)
      resetImageState(row.image_url || '')
    } else {
      setForm({ ...EMPTY_FORM, posted_date: todayIso(), deadline: todayIso(60) })
      setIsNew(true)
      resetImageState('')
    }
    setModalOpen(true)
  }

  function closeEditor() {
    setModalOpen(false)
    resetImageState('')
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function uploadImage(jobId) {
    if (!imageFile) return null
    const safeName = (imageFile.name || 'image.jpg').replace(/[^a-z0-9.-]/gi, '-')
    const filePath = `jobs/${jobId}-${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from('site-assets').upload(filePath, imageFile, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath)
    return data?.publicUrl || null
  }

  async function handleSave(event) {
    event.preventDefault()
    setBusy(true)
    setNotice(null)

    try {
      let id = form.id
      if (isNew) {
        const base = slugify(`${form.country}-${form.title}-${form.region}`) || 'job'
        id = existingIds.has(base) ? `${base}-${Date.now().toString(36)}` : base
      }

      let imageUrl = form.image_url
      if (imageFile) {
        try {
          imageUrl = (await uploadImage(id)) || imageUrl
        } catch (uploadError) {
          throw new Error(`Image upload failed (${uploadError.message || uploadError}). You can paste an image URL instead.`, {
            cause: uploadError,
          })
        }
      }

      const payload = formToRow({ ...form, id, image_url: imageUrl || '' })
      const query = isNew
        ? supabase.from('jobs').insert(payload)
        : supabase.from('jobs').update(payload).eq('id', id)
      const { error } = await query
      if (error) throw error

      setNotice({ type: 'success', text: isNew ? `Job "${payload.title}" created.` : `Job "${payload.title}" updated.` })
      closeEditor()
      notifyJobsUpdated()
      await loadJobs()
    } catch (error) {
      setNotice({ type: 'error', text: error.message || String(error) })
    } finally {
      setBusy(false)
    }
  }

  async function patchJob(row, patch, successText) {
    setBusy(true)
    setNotice(null)
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', row.id)
      if (error) throw error
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, ...patch } : item)))
      setNotice({ type: 'success', text: successText })
      notifyJobsUpdated()
    } catch (error) {
      setNotice({ type: 'error', text: error.message || String(error) })
    } finally {
      setBusy(false)
    }
  }

  async function deleteJob(row) {
    const confirmed = window.confirm(
      `Delete "${row.title}" (${row.region})?\n\nThis permanently removes the listing. Tip: use "Hide" instead if you may want it back. Job applications already submitted are NOT affected.`,
    )
    if (!confirmed) return

    setBusy(true)
    setNotice(null)
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', row.id)
      if (error) throw error
      setRows((current) => current.filter((item) => item.id !== row.id))
      setNotice({ type: 'success', text: `Deleted "${row.title}".` })
      notifyJobsUpdated()
    } catch (error) {
      setNotice({ type: 'error', text: error.message || String(error) })
    } finally {
      setBusy(false)
    }
  }

  const autoImage = useMemo(
    () => getDefaultJobImageUrl(normalizeJobRow({ ...formToRow({ ...form, id: form.id || 'preview' }) })),
    [form],
  )
  const previewImage = imagePreview || form.image_url || autoImage

  if (loading) {
    return <div className="admin-loading">Loading jobs...</div>
  }

  if (tableMissing) {
    return (
      <section className="admin-panel-card">
        <div className="admin-panel-card-header">
          <div>
            <h2>Jobs database not set up yet</h2>
            <p>
              The website is currently showing the {JOB_CATALOG.length} built-in jobs. To edit jobs here, run{' '}
              <code>{MIGRATION_FILE}</code> in the Supabase SQL editor, then reload this page.
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={loadJobs}>
            Check again
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="admin-section-stack">
      {notice ? <div className={`admin-notice ${notice.type === 'error' ? 'error' : 'success'}`}>{notice.text}</div> : null}

      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <span>Total jobs</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Visible on site</span>
          <strong>{stats.published}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Featured</span>
          <strong>{stats.featured}</strong>
        </article>
        <article className="admin-stat-card">
          <span>Closed</span>
          <strong>{stats.closed}</strong>
        </article>
      </div>

      {missingCatalogJobs.length ? (
        <section className="admin-panel-card catalog-import-card">
          <div className="admin-panel-card-header">
            <div>
              <h2>{rows.length ? 'New built-in jobs available' : 'Import the job listings'}</h2>
              <p>
                {missingCatalogJobs.length} built-in job{missingCatalogJobs.length === 1 ? '' : 's'} are not in the database yet
                {rows.length ? '' : ' (the website is showing them from the built-in list until you import)'}. Importing only adds
                missing jobs — nothing you have edited is overwritten.
              </p>
            </div>
            <button type="button" className="admin-btn admin-btn-primary" onClick={importCatalog} disabled={busy}>
              {busy ? 'Importing...' : `Import ${missingCatalogJobs.length} jobs`}
            </button>
          </div>
        </section>
      ) : null}

      <section className="admin-panel-card">
        <div className="admin-panel-card-header">
          <div>
            <h2>Job Listings</h2>
            <p>
              Showing {filteredRows.length} of {rows.length} jobs. Changes appear on the Work Abroad page immediately.
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => openEditor(null)}>
            Add Job
          </button>
        </div>

        <div className="catalog-filters">
          <label className="admin-field">
            <span>Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, city, employer..."
            />
          </label>
          <label className="admin-field">
            <span>Country</span>
            <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
              <option value="all">All countries</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country} ({rows.filter((row) => row.country === country).length})
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closing_soon">Closing soon</option>
              <option value="closed">Closed</option>
              <option value="hidden">Hidden from site</option>
            </select>
          </label>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Job</th>
                <th>Location</th>
                <th>Pay</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const job = normalizeJobRow(row)
                return (
                  <tr key={row.id} className={row.is_published === false ? 'catalog-row-hidden' : ''}>
                    <td data-label="Image">
                      <img className="catalog-thumb" src={getJobImageUrl(job)} alt="" loading="lazy" />
                    </td>
                    <td data-label="Job">
                      <strong>{row.title}</strong>
                      <div className="catalog-subtext">
                        {row.employer} · {row.category} · {row.type}
                      </div>
                      <div className="catalog-tags">
                        {row.featured ? <span className="catalog-tag featured">Featured</span> : null}
                        {row.is_published === false ? <span className="catalog-tag hidden">Hidden</span> : null}
                        {row.image_url ? <span className="catalog-tag">Custom image</span> : null}
                      </div>
                    </td>
                    <td data-label="Location">
                      {row.region}
                      <div className="catalog-subtext">{row.country}</div>
                    </td>
                    <td data-label="Pay">{row.salary}</td>
                    <td data-label="Status">
                      <span className={`catalog-status ${row.status}`}>{String(row.status).replace(/_/g, ' ')}</span>
                    </td>
                    <td data-label="Deadline">{formatDate(row.deadline)}</td>
                    <td data-label="Actions">
                      <div className="admin-action-row catalog-actions">
                        <button type="button" className="admin-btn admin-btn-soft" onClick={() => openEditor(row)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-soft"
                          disabled={busy}
                          onClick={() =>
                            patchJob(
                              row,
                              { is_published: row.is_published === false },
                              row.is_published === false ? `"${row.title}" is visible again.` : `"${row.title}" hidden from the website.`,
                            )
                          }
                        >
                          {row.is_published === false ? 'Show' : 'Hide'}
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-soft"
                          disabled={busy}
                          onClick={() =>
                            patchJob(
                              row,
                              { featured: !row.featured },
                              row.featured ? `"${row.title}" un-featured.` : `"${row.title}" featured on the homepage.`,
                            )
                          }
                        >
                          {row.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button type="button" className="admin-btn admin-btn-soft" onClick={() => openEditor(row, { duplicate: true })}>
                          Duplicate
                        </button>
                        <a
                          className="admin-btn admin-btn-soft"
                          href={buildJobDetailPath(row.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                        <button type="button" className="admin-btn admin-btn-danger" disabled={busy} onClick={() => deleteJob(row)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!filteredRows.length ? <p className="admin-empty">No jobs match these filters.</p> : null}
        </div>
      </section>

      {modalOpen ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal catalog-modal">
            <div className="admin-modal-header">
              <h3>{isNew ? 'Add Job' : 'Edit Job'}</h3>
              <button type="button" className="admin-icon-btn" onClick={closeEditor} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form className="admin-modal-form catalog-form" onSubmit={handleSave}>
              <label className="admin-field catalog-span-2">
                <span>Job title *</span>
                <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
              </label>
              <label className="admin-field">
                <span>Country *</span>
                <input
                  list="job-country-options"
                  value={form.country}
                  onChange={(event) => updateField('country', event.target.value)}
                  required
                />
                <datalist id="job-country-options">
                  {countryOptions.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </label>
              <label className="admin-field">
                <span>City, Province / Region *</span>
                <input
                  value={form.region}
                  onChange={(event) => updateField('region', event.target.value)}
                  placeholder="e.g. Toronto, Ontario"
                  required
                />
              </label>
              <label className="admin-field">
                <span>Category *</span>
                <input
                  list="job-category-options"
                  value={form.category}
                  onChange={(event) => updateField('category', event.target.value)}
                  required
                />
                <datalist id="job-category-options">
                  {categoryOptions.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>
              <label className="admin-field">
                <span>Type</span>
                <select value={form.type} onChange={(event) => updateField('type', event.target.value)}>
                  {JOB_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type === 'skilled' ? 'Skilled' : 'Unskilled'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Pay *</span>
                <input
                  value={form.salary}
                  onChange={(event) => updateField('salary', event.target.value)}
                  placeholder="CAD $18 - $22/hour"
                  required
                />
                <small className="catalog-hint">End with /hour, /month or /year so the pay filter works.</small>
              </label>
              <label className="admin-field">
                <span>Employer</span>
                <input value={form.employer} onChange={(event) => updateField('employer', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Open positions</span>
                <input
                  type="number"
                  min="0"
                  value={form.positions}
                  onChange={(event) => updateField('positions', event.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>Contract</span>
                <input value={form.contract_duration} onChange={(event) => updateField('contract_duration', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Experience</span>
                <input value={form.experience} onChange={(event) => updateField('experience', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Education</span>
                <input value={form.education} onChange={(event) => updateField('education', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Language</span>
                <input value={form.language} onChange={(event) => updateField('language', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Status</span>
                <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                  {JOB_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Posted date</span>
                <input type="date" value={form.posted_date} onChange={(event) => updateField('posted_date', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Application deadline</span>
                <input type="date" value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Sort order (lower shows first)</span>
                <input type="number" value={form.order_index} onChange={(event) => updateField('order_index', event.target.value)} />
              </label>

              <div className="catalog-checks catalog-span-2">
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.visa_sponsorship}
                    onChange={(event) => updateField('visa_sponsorship', event.target.checked)}
                  />
                  <span>Visa sponsorship</span>
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.accommodation_provided}
                    onChange={(event) => updateField('accommodation_provided', event.target.checked)}
                  />
                  <span>Accommodation help</span>
                </label>
                <label className="admin-checkbox">
                  <input type="checkbox" checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} />
                  <span>Featured on homepage</span>
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(event) => updateField('is_published', event.target.checked)}
                  />
                  <span>Visible on website</span>
                </label>
              </div>

              <label className="admin-field catalog-span-2">
                <span>Description</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="What the job involves, where it is, who it suits."
                />
              </label>
              <label className="admin-field">
                <span>Requirements (one per line)</span>
                <textarea rows={6} value={form.requirements} onChange={(event) => updateField('requirements', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Benefits (one per line)</span>
                <textarea rows={6} value={form.benefits} onChange={(event) => updateField('benefits', event.target.value)} />
              </label>

              <div className="admin-field catalog-span-2">
                <span>Image</span>
                <div className="catalog-image-editor">
                  <img className="catalog-image-preview" src={previewImage} alt="Job preview" />
                  <div className="catalog-image-controls">
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(event) => {
                        updateField('image_url', event.target.value)
                        setImageFile(null)
                        setImagePreview('')
                      }}
                      placeholder="Paste an image URL (leave empty for an automatic photo)"
                    />
                    <div className="admin-action-row">
                      <label className="admin-btn admin-btn-soft catalog-file-btn">
                        Upload image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null
                            setImageFile(file)
                            setImagePreview(file ? URL.createObjectURL(file) : '')
                          }}
                        />
                      </label>
                      <button type="button" className="admin-btn admin-btn-soft" onClick={() => setPickerOpen((open) => !open)}>
                        {pickerOpen ? 'Close library' : 'Choose from library'}
                      </button>
                      {form.image_url || imageFile ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-soft"
                          onClick={() => {
                            updateField('image_url', '')
                            resetImageState('')
                          }}
                        >
                          Use automatic image
                        </button>
                      ) : null}
                    </div>
                    <small className="catalog-hint">
                      {imageFile
                        ? `Will upload "${imageFile.name}" when you save.`
                        : form.image_url
                          ? 'Using your custom image.'
                          : 'Using an automatic photo that matches the job type.'}
                    </small>
                  </div>
                </div>

                {pickerOpen ? (
                  <div className="catalog-library">
                    {JOB_IMAGE_LIBRARY.map((group) => (
                      <div key={group.group} className="catalog-library-group">
                        <strong>{group.group}</strong>
                        <div className="catalog-library-grid">
                          {group.images.map((url) => (
                            <button
                              key={url}
                              type="button"
                              className={`catalog-library-item${form.image_url === url ? ' selected' : ''}`}
                              onClick={() => {
                                updateField('image_url', url)
                                setImageFile(null)
                                setImagePreview('')
                              }}
                            >
                              <img src={url.replace('w=1200', 'w=300')} alt="" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="admin-modal-actions catalog-span-2">
                <button type="button" className="admin-btn admin-btn-soft" onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
                  {busy ? 'Saving...' : isNew ? 'Create Job' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default JobsManager

import { useEffect, useMemo, useState } from 'react'
import { Copy, Download, Plus, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import './CertificateBuilder.css'

const STORAGE_KEY = 'brightpath-ielts-builder-cache-v2'
const TABLE_NAME = 'ielts_reports'
const IMAGE_BUCKET = 'site-assets'
const TEMPLATE_VERSION = '2026'

const IMAGE_FIELDS = [
  {
    key: 'profile_photo_url',
    label: 'Profile photo',
    helper: 'Shown in the candidate photo box.',
    fit: 'cover',
  },
  {
    key: 'centre_stamp_url',
    label: 'Centre stamp',
    helper: 'Shown in the centre stamp circle.',
    fit: 'contain',
  },
  {
    key: 'validation_stamp_url',
    label: 'Validation stamp',
    helper: 'Shown in the validation stamp circle.',
    fit: 'contain',
  },
  {
    key: 'british_council_logo_url',
    label: 'British Council logo',
    helper: 'Shown in the footer logo strip.',
    fit: 'contain',
  },
  {
    key: 'idp_logo_url',
    label: 'IDP logo',
    helper: 'Shown in the footer logo strip.',
    fit: 'contain',
  },
  {
    key: 'cambridge_logo_url',
    label: 'Cambridge logo',
    helper: 'Shown in the footer logo strip.',
    fit: 'contain',
  },
]

function getImageFieldLabel(fieldKey) {
  return IMAGE_FIELDS.find((field) => field.key === fieldKey)?.label || fieldKey.replace(/_/g, ' ')
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `cert-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function createBlankRecord() {
  return {
    id: createId(),
    full_name: '',
    candidate_id: '',
    report_number: '',
    passport_number: '',
    nationality: '',
    date_of_birth: '',
    test_type: 'Academic',
    test_date: '',
    issue_date: getTodayInputValue(),
    centre_name: 'Brightpath Travel Scholars',
    centre_code: 'BTS-2026',
    location: 'Nairobi, Kenya',
    listening: '7.5',
    reading: '7.5',
    writing: '7.0',
    speaking: '7.5',
    overall: '',
    verifier_name: 'Brightpath Academic Officer',
    verifier_title: 'Assessment Coordinator',
    profile_photo_url: '',
    centre_stamp_url: '',
    validation_stamp_url: '',
    british_council_logo_url: '',
    idp_logo_url: '',
    cambridge_logo_url: '',
    notes:
      'Internal use only. Prepared for counselling and application support. Not an official IELTS certificate.',
    template_version: TEMPLATE_VERSION,
    created_by: '',
    updated_by: '',
    created_at: '',
    updated_at: '',
  }
}

function readCachedRecords() {
  if (typeof window === 'undefined') return []

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    const parsed = rawValue ? JSON.parse(rawValue) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCachedRecords(records) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Ignore cache issues so the builder stays usable.
  }
}

function getDayOrdinal(day) {
  const remainder = day % 100
  if (remainder >= 11 && remainder <= 13) return 'TH'
  switch (day % 10) {
    case 1:
      return 'ST'
    case 2:
      return 'ND'
    case 3:
      return 'RD'
    default:
      return 'TH'
  }
}

function formatIeltsUpperDate(value) {
  if (!value) return '10TH APRIL 2023'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '10TH APRIL 2023'

  const day = date.getDate()
  const month = date.toLocaleString('en-GB', { month: 'long' }).toUpperCase()
  return `${day}${getDayOrdinal(day)} ${month} ${date.getFullYear()}`
}

function formatBirthDate(value) {
  if (!value) return '01/05/1975'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '01/05/1975'

  return date.toLocaleDateString('en-GB')
}

function splitDisplayName(fullName) {
  const clean = toTextValue(fullName)
  if (!clean) return { family: '', first: '' }

  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { family: '', first: parts[0] }

  return {
    family: parts.slice(-1).join(' '),
    first: parts.slice(0, -1).join(' '),
  }
}

function getCefrLevel(overallBand) {
  if (!Number.isFinite(overallBand)) return 'C1'
  if (overallBand >= 8.5) return 'C2'
  if (overallBand >= 7) return 'C1'
  if (overallBand >= 5.5) return 'B2'
  if (overallBand >= 4) return 'B1'
  return 'A2'
}

function roundToHalf(value) {
  return Math.round(value * 2) / 2
}

function normalizeBandNumber(value) {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0

  return Math.min(9, roundToHalf(parsed))
}

function formatBand(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0'
}

function formatInputBand(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed.toFixed(1) : ''
}

function toTextValue(value) {
  return `${value ?? ''}`.trim()
}

function normalizeRecord(record = {}) {
  const base = createBlankRecord()

  return {
    ...base,
    id: record.id ?? base.id,
    full_name: toTextValue(record.full_name),
    candidate_id: toTextValue(record.candidate_id),
    report_number: toTextValue(record.report_number),
    passport_number: toTextValue(record.passport_number),
    nationality: toTextValue(record.nationality),
    date_of_birth: record.date_of_birth ?? '',
    test_type: record.test_type || base.test_type,
    test_date: record.test_date ?? '',
    issue_date: record.issue_date ?? base.issue_date,
    centre_name: toTextValue(record.centre_name) || base.centre_name,
    centre_code: toTextValue(record.centre_code) || base.centre_code,
    location: toTextValue(record.location) || base.location,
    listening: formatInputBand(record.listening ?? base.listening),
    reading: formatInputBand(record.reading ?? base.reading),
    writing: formatInputBand(record.writing ?? base.writing),
    speaking: formatInputBand(record.speaking ?? base.speaking),
    overall: formatInputBand(record.overall ?? base.overall),
    verifier_name: toTextValue(record.verifier_name) || base.verifier_name,
    verifier_title: toTextValue(record.verifier_title) || base.verifier_title,
    profile_photo_url: toTextValue(record.profile_photo_url),
    centre_stamp_url: toTextValue(record.centre_stamp_url),
    validation_stamp_url: toTextValue(record.validation_stamp_url),
    british_council_logo_url: toTextValue(record.british_council_logo_url),
    idp_logo_url: toTextValue(record.idp_logo_url),
    cambridge_logo_url: toTextValue(record.cambridge_logo_url),
    notes: toTextValue(record.notes) || base.notes,
    template_version: toTextValue(record.template_version) || TEMPLATE_VERSION,
    created_by: record.created_by ?? '',
    updated_by: record.updated_by ?? '',
    created_at: record.created_at ?? '',
    updated_at: record.updated_at ?? '',
  }
}

function isEmptyDraft(record) {
  return ['full_name', 'candidate_id', 'report_number', 'passport_number', 'nationality'].every((key) => {
    return !toTextValue(record[key])
  })
}

function buildSummary(record) {
  const scores = [record.listening, record.reading, record.writing, record.speaking].map(normalizeBandNumber)
  const computedOverall = roundToHalf(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  const overallBand = toTextValue(record.overall) ? normalizeBandNumber(record.overall) : computedOverall

  return {
    overallBand,
    scoreRows: [
      { label: 'Listening', value: scores[0] },
      { label: 'Reading', value: scores[1] },
      { label: 'Writing', value: scores[2] },
      { label: 'Speaking', value: scores[3] },
    ],
  }
}

function buildPayload(record, existingRecord, userId) {
  const nowIso = new Date().toISOString()
  const scoreRows = [record.listening, record.reading, record.writing, record.speaking].map(normalizeBandNumber)
  const computedOverall = roundToHalf(scoreRows.reduce((sum, score) => sum + score, 0) / scoreRows.length)
  const overallBand = toTextValue(record.overall) ? normalizeBandNumber(record.overall) : computedOverall

  return {
    id: record.id || createId(),
    full_name: toTextValue(record.full_name),
    candidate_id: toTextValue(record.candidate_id) || null,
    report_number: toTextValue(record.report_number) || null,
    passport_number: toTextValue(record.passport_number) || null,
    nationality: toTextValue(record.nationality) || null,
    date_of_birth: record.date_of_birth || null,
    test_type: record.test_type || 'Academic',
    test_date: record.test_date || null,
    issue_date: record.issue_date || getTodayInputValue(),
    centre_name: toTextValue(record.centre_name) || 'Brightpath Travel Scholars',
    centre_code: toTextValue(record.centre_code) || null,
    location: toTextValue(record.location) || null,
    listening: scoreRows[0],
    reading: scoreRows[1],
    writing: scoreRows[2],
    speaking: scoreRows[3],
    overall: overallBand,
    verifier_name: toTextValue(record.verifier_name) || null,
    verifier_title: toTextValue(record.verifier_title) || null,
    profile_photo_url: toTextValue(record.profile_photo_url) || null,
    centre_stamp_url: toTextValue(record.centre_stamp_url) || null,
    validation_stamp_url: toTextValue(record.validation_stamp_url) || null,
    british_council_logo_url: toTextValue(record.british_council_logo_url) || null,
    idp_logo_url: toTextValue(record.idp_logo_url) || null,
    cambridge_logo_url: toTextValue(record.cambridge_logo_url) || null,
    notes: toTextValue(record.notes) || null,
    template_version: TEMPLATE_VERSION,
    created_by: existingRecord?.created_by || userId || null,
    updated_by: userId || null,
    created_at: existingRecord?.created_at || record.created_at || nowIso,
    updated_at: nowIso,
  }
}

function getOverallBand(record) {
  const summary = buildSummary(record)
  return summary.overallBand
}

function buildPreviewSnapshot(record, overallBand) {
  const nameParts = splitDisplayName(record.full_name)
  const candidateNumber = toTextValue(record.candidate_id) || '256489'
  const reportNumber = toTextValue(record.report_number) || '17UH001039AMEf001A'
  const centreCode = toTextValue(record.centre_code) || 'BD001'
  const issueDate = formatIeltsUpperDate(record.issue_date)
  const testType = record.test_type === 'Academic' ? 'ACADEMIC' : 'GENERAL'
  const scoreBand = (value) => formatBand(normalizeBandNumber(value))
  const originCountry = toTextValue(record.nationality) || 'Zimbabwe'
  const verifierName = toTextValue(record.verifier_name) || 'Admin'
  const verifierTitle = toTextValue(record.verifier_title) || 'Administrator'
  const overallDisplay = formatBand(overallBand)

  return {
    testType,
    trainingLabel: record.test_type === 'Academic' ? 'ACADEMIC' : 'GENERAL TRAINING',
    issueDate,
    centreCode,
    candidateNumber,
    reportNumber,
    familyName: nameParts.family || 'Munetsi',
    firstName: nameParts.first || 'Brighton',
    candidateId: toTextValue(record.passport_number) || 'B8992361',
    dob: formatBirthDate(record.date_of_birth),
    sex: 'M',
    schemeCode: 'Private candidate',
    originCountry,
    nationality: originCountry,
    firstLanguage: 'Shona',
    listening: scoreBand(record.listening || 7.5),
    reading: scoreBand(record.reading || 7.5),
    writing: scoreBand(record.writing || 7.5),
    speaking: scoreBand(record.speaking || 7.5),
    overallDisplay,
    cefr: getCefrLevel(overallBand),
    verifierName,
    verifierTitle,
    location: toTextValue(record.location) || 'Zimbabwe',
    profilePhotoUrl: toTextValue(record.profile_photo_url),
    centreStampUrl: toTextValue(record.centre_stamp_url),
    validationStampUrl: toTextValue(record.validation_stamp_url),
    britishCouncilLogoUrl: toTextValue(record.british_council_logo_url),
    idpLogoUrl: toTextValue(record.idp_logo_url),
    cambridgeLogoUrl: toTextValue(record.cambridge_logo_url),
  }
}

function buildImageUploadPath(recordId, fieldKey, file) {
  const safeName = toTextValue(file?.name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `ielts-builder/${recordId}/${fieldKey}/${Date.now()}-${safeName || 'upload'}`
}

function CertificateBuilder() {
  const { user } = useAuth()
  const initialCachedRecords = readCachedRecords().map(normalizeRecord)
  const [records, setRecords] = useState(initialCachedRecords)
  const [draft, setDraft] = useState(() => initialCachedRecords[0] ?? createBlankRecord())
  const [storageMode, setStorageMode] = useState(initialCachedRecords.length ? 'local-cache' : 'loading')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')
  const [notice, setNotice] = useState('Loading shared applicant records...')

  useEffect(() => {
    let ignore = false

    async function loadRecords() {
      setLoading(true)

      try {
        const { data, error } = await supabase.from(TABLE_NAME).select('*').order('updated_at', { ascending: false })

        if (error) throw error
        if (ignore) return

        const nextRecords = (data ?? []).map(normalizeRecord)
        setRecords(nextRecords)
        writeCachedRecords(nextRecords)
        setStorageMode('supabase')
        setNotice(
          nextRecords.length
            ? 'Shared Supabase records loaded.'
            : 'Supabase storage is ready. Save the first applicant to begin.',
        )

        setDraft((current) => {
          const currentMatch = nextRecords.find((item) => item.id === current.id)
          if (currentMatch) return currentMatch
          if (isEmptyDraft(current)) return nextRecords[0] ?? createBlankRecord()
          return current
        })
      } catch (error) {
        console.error('[CertificateBuilder] Failed to load shared records:', error)

        if (ignore) return

        const cachedRecords = readCachedRecords().map(normalizeRecord)
        setRecords(cachedRecords)
        setStorageMode(cachedRecords.length ? 'local-cache' : 'offline')

        if (cachedRecords.length) {
          setNotice('Could not reach Supabase. Showing browser-cached records until the connection returns.')
          setDraft((current) => cachedRecords.find((item) => item.id === current.id) ?? cachedRecords[0] ?? current)
        } else {
          setNotice('Could not reach Supabase yet. You can still draft a record, and it will stay in browser cache.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadRecords()

    return () => {
      ignore = true
    }
  }, [user?.id])

  useEffect(() => {
    writeCachedRecords(records)
  }, [records])

  const overallBand = getOverallBand(draft)
  const preview = useMemo(() => buildPreviewSnapshot(draft, overallBand), [draft, overallBand])
  const storageBadge =
    loading
      ? 'Syncing shared storage'
      : storageMode === 'supabase'
      ? 'Shared Supabase storage'
      : storageMode === 'local-cache'
        ? 'Browser cache fallback'
        : 'Loading shared storage'

  function updateField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function handleImageUpload(fieldKey, file) {
    if (!file) return

    const recordId = draft.id
    setUploadingField(fieldKey)
    setNotice(null)

    try {
      const filePath = buildImageUploadPath(draft.id, fieldKey, file)
      const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      setDraft((current) => ({ ...current, [fieldKey]: publicUrl }))
      setRecords((current) => current.map((item) => (item.id === recordId ? { ...item, [fieldKey]: publicUrl } : item)))
      setNotice(`${getImageFieldLabel(fieldKey)} uploaded.`)
    } catch (error) {
      console.error('[CertificateBuilder] Image upload failed:', error)
      setNotice(error.message || 'Could not upload the image.')
    } finally {
      setUploadingField('')
    }
  }

  function clearImageField(fieldKey) {
    const recordId = draft.id
    setDraft((current) => ({ ...current, [fieldKey]: '' }))
    setRecords((current) => current.map((item) => (item.id === recordId ? { ...item, [fieldKey]: '' } : item)))
    setNotice(`${getImageFieldLabel(fieldKey)} removed.`)
  }

  function renderUploadCard(field) {
    const value = draft[field.key]
    const isUploading = uploadingField === field.key

    return (
      <div key={field.key} className="certificate-image-card">
        <div className="certificate-image-card-head">
          <div>
            <strong>{field.label}</strong>
            <span>{field.helper}</span>
          </div>
          {value ? (
            <button type="button" className="certificate-image-clear" onClick={() => clearImageField(field.key)}>
              <X size={14} />
              Remove
            </button>
          ) : null}
        </div>

        <div className={`certificate-image-preview${field.fit === 'cover' ? ' is-cover' : ''}`}>
          {value ? (
            <img src={value} alt={field.label} />
          ) : (
            <div className="certificate-image-placeholder">
              <span>{field.label}</span>
            </div>
          )}
        </div>

        <label className={`admin-btn admin-btn-soft admin-upload-btn${isUploading ? ' is-uploading' : ''}`}>
          <Upload size={16} />
          {isUploading ? 'Uploading...' : `Upload ${field.label}`}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => handleImageUpload(field.key, event.target.files?.[0])}
          />
        </label>
      </div>
    )
  }

  function handleReset() {
    setDraft(createBlankRecord())
    setNotice('New internal record started.')
  }

  function handleLoad(record) {
    setDraft(normalizeRecord(record))
    setNotice(`Loaded ${record.full_name || 'saved applicant'}.`)
  }

  async function handleSave(event) {
    event.preventDefault()

    if (!toTextValue(draft.full_name)) {
      setNotice('Applicant full name is required before saving.')
      return
    }

    const existingRecord = records.find((item) => item.id === draft.id)
    const payload = buildPayload(draft, existingRecord, user?.id)
    setSaving(true)
    setNotice(null)

    try {
      const { data, error } = await supabase.from(TABLE_NAME).upsert(payload, { onConflict: 'id' }).select('*').single()

      if (error) throw error

      const savedRecord = normalizeRecord(data ?? payload)
      const nextRecords = records.some((item) => item.id === savedRecord.id)
        ? records.map((item) => (item.id === savedRecord.id ? savedRecord : item))
        : [savedRecord, ...records]

      nextRecords.sort((left, right) => {
        const leftTime = new Date(left.updated_at || left.created_at || 0).getTime()
        const rightTime = new Date(right.updated_at || right.created_at || 0).getTime()
        return rightTime - leftTime
      })

      setRecords(nextRecords)
      writeCachedRecords(nextRecords)
      setDraft(savedRecord)
      setStorageMode('supabase')
      setNotice('Saved to shared Supabase storage.')
    } catch (error) {
      console.error('[CertificateBuilder] Failed to save shared record:', error)

      const fallbackRecord = normalizeRecord(payload)
      const nextRecords = records.some((item) => item.id === fallbackRecord.id)
        ? records.map((item) => (item.id === fallbackRecord.id ? fallbackRecord : item))
        : [fallbackRecord, ...records]

      setRecords(nextRecords)
      writeCachedRecords(nextRecords)
      setDraft(fallbackRecord)
      setStorageMode('local-cache')
      setNotice('Supabase save failed, so the record was saved to browser cache instead.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(recordId) {
    const shouldDelete = window.confirm('Delete this saved applicant record?')
    if (!shouldDelete) return

    setNotice(null)

    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', recordId)
      if (error) throw error

      const nextRecords = records.filter((record) => record.id !== recordId)
      setRecords(nextRecords)
      writeCachedRecords(nextRecords)

      if (draft.id === recordId) {
        setDraft(createBlankRecord())
      }

      setStorageMode('supabase')
      setNotice('Applicant record deleted from shared storage.')
    } catch (error) {
      console.error('[CertificateBuilder] Failed to delete shared record:', error)

      const nextRecords = records.filter((record) => record.id !== recordId)
      setRecords(nextRecords)
      writeCachedRecords(nextRecords)

      if (draft.id === recordId) {
        setDraft(createBlankRecord())
      }

      setStorageMode('local-cache')
      setNotice('Could not delete from Supabase, so the record was removed from browser cache instead.')
    }
  }

  function handleDuplicate() {
    const cloned = {
      ...draft,
      id: createId(),
      full_name: draft.full_name ? `${draft.full_name} Copy` : '',
      report_number: draft.report_number ? `${draft.report_number}-COPY` : '',
      created_by: '',
      updated_by: '',
      created_at: '',
      updated_at: '',
    }

    setDraft(cloned)
    setNotice('Duplicated into a new internal record.')
  }

  function handlePrint() {
    window.print()
  }

  function handleCopySummary() {
    const lines = [
      `Applicant: ${draft.full_name || 'Not set'}`,
      `Candidate ID: ${draft.candidate_id || 'Not set'}`,
      `Report Number: ${draft.report_number || 'Not set'}`,
      `Nationality: ${draft.nationality || 'Not set'}`,
      `Test Type: ${draft.test_type || 'Academic'}`,
      `Scores: L ${formatBand(normalizeBandNumber(draft.listening))}, R ${formatBand(
        normalizeBandNumber(draft.reading),
      )}, W ${formatBand(normalizeBandNumber(draft.writing))}, S ${formatBand(normalizeBandNumber(draft.speaking))}`,
      `Overall: ${draft.overall ? formatBand(normalizeBandNumber(draft.overall)) : formatBand(overallBand)}`,
    ]

    const copyOperation = navigator.clipboard?.writeText(lines.join('\n'))

    if (copyOperation?.then) {
      copyOperation.then(
        () => setNotice('Summary copied to clipboard.'),
        () => setNotice('Copy failed. You can still print to PDF.'),
      )
    } else {
      setNotice('Copy failed. You can still print to PDF.')
    }
  }

  return (
    <section className="admin-panel-card certificate-builder-shell">
      <div className="admin-panel-card-header certificate-builder-header">
        <div>
          <h2>IELTS Builder</h2>
          <p>Shared applicant report generator with live preview and print-to-PDF export.</p>
        </div>
        <div className="certificate-builder-actions">
          <span className="certificate-builder-storage">{storageBadge}</span>
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleCopySummary}>
            <Copy size={16} />
            Copy Summary
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={handlePrint}>
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      <p className="certificate-builder-warning">
        This layout is for Brightpath internal use only. It is clearly labeled and styled as a custom report, not an
        official certificate.
      </p>

      {notice ? <p className="certificate-builder-status">{notice}</p> : null}

      <div className="certificate-builder-layout">
        <form className="certificate-builder-form" onSubmit={handleSave}>
          <div className="certificate-form-actions">
            <button type="button" className="admin-btn admin-btn-soft" onClick={handleReset}>
              <Plus size={16} />
              New Applicant
            </button>
            <button type="button" className="admin-btn admin-btn-soft" onClick={handleDuplicate}>
              <RotateCcw size={16} />
              Duplicate
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Record'}
            </button>
          </div>

          <div className="certificate-image-grid">{IMAGE_FIELDS.map((field) => renderUploadCard(field))}</div>

          <div className="certificate-form-grid">
            <label className="admin-field">
              <span>Applicant Full Name</span>
              <input
                type="text"
                required
                value={draft.full_name}
                onChange={(event) => updateField('full_name', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Candidate ID</span>
              <input type="text" value={draft.candidate_id} onChange={(event) => updateField('candidate_id', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Report Number</span>
              <input type="text" value={draft.report_number} onChange={(event) => updateField('report_number', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Passport Number</span>
              <input
                type="text"
                value={draft.passport_number}
                onChange={(event) => updateField('passport_number', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Nationality</span>
              <input type="text" value={draft.nationality} onChange={(event) => updateField('nationality', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Date of Birth</span>
              <input
                type="date"
                value={draft.date_of_birth}
                onChange={(event) => updateField('date_of_birth', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Test Type</span>
              <select value={draft.test_type} onChange={(event) => updateField('test_type', event.target.value)}>
                <option value="Academic">Academic</option>
                <option value="General Training">General Training</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Test Date</span>
              <input type="date" value={draft.test_date} onChange={(event) => updateField('test_date', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Issue Date</span>
              <input
                type="date"
                value={draft.issue_date}
                onChange={(event) => updateField('issue_date', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Centre Name</span>
              <input
                type="text"
                value={draft.centre_name}
                onChange={(event) => updateField('centre_name', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Centre Code</span>
              <input
                type="text"
                value={draft.centre_code}
                onChange={(event) => updateField('centre_code', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Location</span>
              <input type="text" value={draft.location} onChange={(event) => updateField('location', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Listening Band</span>
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={draft.listening}
                onChange={(event) => updateField('listening', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Reading Band</span>
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={draft.reading}
                onChange={(event) => updateField('reading', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Writing Band</span>
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={draft.writing}
                onChange={(event) => updateField('writing', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Speaking Band</span>
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={draft.speaking}
                onChange={(event) => updateField('speaking', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Overall Band</span>
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={draft.overall}
                onChange={(event) => updateField('overall', event.target.value)}
                placeholder={formatBand(overallBand)}
              />
            </label>
            <label className="admin-field">
              <span>Verifier Name</span>
              <input
                type="text"
                value={draft.verifier_name}
                onChange={(event) => updateField('verifier_name', event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Verifier Title</span>
              <input
                type="text"
                value={draft.verifier_title}
                onChange={(event) => updateField('verifier_title', event.target.value)}
              />
            </label>
            <label className="admin-field admin-field-full">
              <span>Notes</span>
              <textarea rows="3" value={draft.notes} onChange={(event) => updateField('notes', event.target.value)} />
            </label>
          </div>
        </form>

        <aside className="certificate-preview-column">
          <div className="ielts-trf-preview">
            <div className="ielts-paper-page">
              <div className="ielts-paper-content">
                <div className="ielts-paper-top-header">
                  <div className="ielts-logo">
                    <div className="ielts-logo-text">IELTS</div>
                    <div className="ielts-logo-sub">Test report form</div>
                  </div>
                  <div className="ielts-general-box">{preview.testType}</div>
                </div>

                <div className="ielts-notice">
                  NOTE. &nbsp;Admission to undergraduate and postgraduate courses should be based on ACADEMIC Reading and Writing Modules.
                  {preview.trainingLabel}
                  <br />
                  Reading and Writing Modules are not designed to best the fill range of language skills required for academic purposes
                  <br />
                  It is recommended that the candidate&apos;s language, ability as indicated in this Test Report Form be re-assessed after two years from date of the test
                </div>

                <div className="ielts-meta-row">
                  <div className="ielts-meta-item">
                    <span className="ielts-meta-label">Centre number</span>
                    <div className="ielts-meta-box">{preview.centreCode}</div>
                  </div>
                  <div className="ielts-meta-item">
                    <span className="ielts-meta-label">Date</span>
                    <div className="ielts-meta-box">{preview.issueDate}</div>
                  </div>
                  <div className="ielts-meta-spacer" />
                  <div className="ielts-meta-item" style={{ borderRight: 'none' }}>
                    <span className="ielts-meta-label">Candidate number</span>
                    <div className="ielts-meta-box" style={{ minWidth: '100px' }}>
                      {preview.candidateNumber}
                    </div>
                  </div>
                </div>

                <div className="ielts-section-title">Candidate Details</div>

                <div className="ielts-candidate-section">
                  <div className="ielts-fields-col">
                    <div className="ielts-field-row">
                      <div className="ielts-field-label">Family name</div>
                      <div className="ielts-field-box">{preview.familyName}</div>
                    </div>

                    <div className="ielts-field-row">
                      <div className="ielts-field-label">First name</div>
                      <div className="ielts-field-box">{preview.firstName}</div>
                    </div>

                    <div className="ielts-field-row">
                      <div className="ielts-field-label">Candidate ID</div>
                      <div className="ielts-field-box">{preview.candidateId}</div>
                    </div>

                    <div className="ielts-field-row" style={{ minHeight: '36px' }}>
                      <div className="ielts-field-label">Date of birth</div>
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 0 }}>
                        <div className="ielts-field-box" style={{ minWidth: '110px' }}>
                          {preview.dob}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
                          <span className="ielts-field-label-sm" style={{ fontSize: '10px', color: '#333' }}>
                            Sex(M/F)
                          </span>
                          <div className="ielts-field-box-sm" style={{ minWidth: '32px' }}>
                            {preview.sex}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px' }}>
                          <span className="ielts-field-label-sm" style={{ fontSize: '10px', color: '#333' }}>
                            Scheme code
                          </span>
                          <div className="ielts-field-box-sm" style={{ minWidth: '110px' }}>
                            {preview.schemeCode}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ielts-field-row">
                      <div className="ielts-field-label">
                        Country or region
                        <br />
                        of origin
                      </div>
                      <div className="ielts-field-box">{preview.originCountry}</div>
                    </div>

                    <div className="ielts-field-row">
                      <div className="ielts-field-label">
                        Country of
                        <br />
                        nationality
                      </div>
                      <div className="ielts-field-box">{preview.nationality}</div>
                    </div>

                    <div className="ielts-field-row">
                      <div className="ielts-field-label">First language</div>
                      <div className="ielts-field-box">{preview.firstLanguage}</div>
                    </div>
                  </div>

                  <div className="ielts-photo-col">
                    <div
                      className={`ielts-photo-placeholder${preview.profilePhotoUrl ? ' has-photo' : ''}`}
                      aria-hidden="true"
                    >
                        {preview.profilePhotoUrl ? (
                        <img className="ielts-photo-image" src={preview.profilePhotoUrl} alt="Candidate" />
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="ielts-section-title">Test results</div>

                <div className="ielts-results-section">
                  <div className="ielts-scores-row">
                    <div className="ielts-score-item">
                      <span className="ielts-score-skill-label">Listening</span>
                      <div className="ielts-score-box">{preview.listening}</div>
                    </div>
                    <div className="ielts-score-item">
                      <span className="ielts-score-skill-label">Reading</span>
                      <div className="ielts-score-box">{preview.reading}</div>
                    </div>
                    <div className="ielts-score-item">
                      <span className="ielts-score-skill-label">Writing</span>
                      <div className="ielts-score-box">{preview.writing}</div>
                    </div>
                    <div className="ielts-score-item">
                      <span className="ielts-score-skill-label">Speaking</span>
                      <div className="ielts-score-box">{preview.speaking}</div>
                    </div>

                    <div className="ielts-overall-group">
                      <div className="ielts-overall-label-stack">
                        Overall
                        <br />
                        band
                        <br />
                        score
                      </div>
                      <div className="ielts-overall-box">{preview.overallDisplay}</div>
                    </div>

                    <div className="ielts-cefr-group">
                      <div className="ielts-cefr-label-stack">
                        CEFR
                        <br />
                        Level
                      </div>
                      <div className="ielts-cefr-box">{preview.cefr}</div>
                    </div>
                  </div>
                </div>

                <div className="ielts-bottom-section">
                  <div className="ielts-good-box-wrap">
                    <div className="ielts-good-box">
                      <span className="ielts-good-text">GOOD</span>
                    </div>
                  </div>

                  <div className="ielts-stamps-col">
                    <div className="ielts-stamps-row">
                      <div className="ielts-stamp-group">
                        <div className="ielts-stamp-caption">Centre stamp</div>
                        <div className="ielts-stamp-bc">
                          {preview.centreStampUrl ? (
                            <img className="ielts-stamp-image" src={preview.centreStampUrl} alt="Centre stamp" />
                          ) : (
                            <>
                              <div className="ielts-stamp-bc-dots">
                                <div className="ielts-stamp-bc-dot" />
                                <div className="ielts-stamp-bc-dot" />
                                <div className="ielts-stamp-bc-dot" />
                                <div className="ielts-stamp-bc-dot" />
                              </div>
                              <div className="ielts-stamp-bc-text">
                                BRITISH
                                <br />
                                COUNCIL
                                <br />
                                EXAMINATIONS
                                <br />
                                SERVICES
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="ielts-stamp-group">
                        <div className="ielts-stamp-caption">Validation stamp</div>
                        <div className="ielts-stamp-ielts">
                          {preview.validationStampUrl ? (
                            <img className="ielts-stamp-image" src={preview.validationStampUrl} alt="Validation stamp" />
                          ) : (
                            <div className="ielts-stamp-ielts-inner">
                              <span className="ielts-stamp-ielts-text">IELTS</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ielts-sig-row">
                  <div className="ielts-sig-block">
                    <div className="ielts-sig-label">
                      Administrator&apos;s
                      <br />
                      signature
                    </div>
                    <div className="ielts-sig-line">
                      <span className="ielts-sig-cursive">{preview.verifierName}</span>
                    </div>
                  </div>

                  <div className="ielts-date-block">
                    <span className="ielts-date-label">Date</span>
                    <div className="ielts-date-box">{preview.issueDate}</div>
                  </div>

                  <div className="ielts-trf-block">
                    <div className="ielts-trf-label">
                      Test Report Form
                      <br />
                      Number
                    </div>
                    <div className="ielts-trf-box">{preview.reportNumber}</div>
                  </div>
                </div>

                <div className="ielts-bottom-logos">
                  <div className="ielts-logo-bc">
                    {preview.britishCouncilLogoUrl ? (
                      <img className="ielts-footer-image is-british-council" src={preview.britishCouncilLogoUrl} alt="British Council logo" />
                    ) : (
                      <div className="ielts-footer-placeholder is-british-council" aria-hidden="true" />
                    )}
                  </div>

                  <div className="ielts-logo-idp">
                    {preview.idpLogoUrl ? (
                      <img className="ielts-footer-image is-idp" src={preview.idpLogoUrl} alt="IDP logo" />
                    ) : (
                      <div className="ielts-footer-placeholder is-idp" aria-hidden="true" />
                    )}
                  </div>

                  <div className="ielts-logo-cambridge">
                    {preview.cambridgeLogoUrl ? (
                      <img className="ielts-footer-image is-cambridge" src={preview.cambridgeLogoUrl} alt="Cambridge logo" />
                    ) : (
                      <div className="ielts-footer-placeholder is-cambridge" aria-hidden="true" />
                    )}
                  </div>
                </div>

                <div className="ielts-verify-footer">
                  The validity of IELTS Test Report Form can be verified online by recognising organizations at
                  https//IELTS.ucles.org.uk
                </div>
              </div>
            </div>
          </div>

          <div className="certificate-records-panel">
            <div className="admin-panel-card-header compact">
              <div>
                <h3>Shared Applicants</h3>
                <p>Records are synced to Supabase and cached locally as a fallback.</p>
              </div>
              <span className="certificate-record-count">{records.length}</span>
            </div>

            <div className="certificate-record-list">
              {records.length ? (
                records.map((record) => {
                  const isActive = record.id === draft.id

                  return (
                    <article key={record.id} className={`certificate-record-item${isActive ? ' active' : ''}`}>
                      <div>
                        <strong>{record.full_name || 'Unnamed applicant'}</strong>
                        <span>
                          {record.candidate_id || 'No candidate ID'}
                          {record.report_number ? ` | ${record.report_number}` : ''}
                        </span>
                        <small>
                          {record.test_type || 'Academic'} | {record.nationality || 'Nationality pending'}
                        </small>
                      </div>
                      <div className="certificate-record-actions">
                        <button type="button" className="admin-btn admin-btn-soft" onClick={() => handleLoad(record)}>
                          Load
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                })
              ) : (
                <p className="admin-empty">
                  No shared applicants yet. Save this record to push it to Supabase and make it reusable for the team.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default CertificateBuilder

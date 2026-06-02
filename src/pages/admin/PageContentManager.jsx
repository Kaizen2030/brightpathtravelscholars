import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Plus, Save, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import {
  buildPageSectionRowsForAdmin,
  getPageOptions,
  serializePageSectionRow,
} from '../../lib/pageSections'

const IMAGE_FIELD_KEYS = new Set(['media_url', 'media_secondary_url', 'image_url', 'photo_url', 'cover_image_url'])
const LONG_TEXT_FIELD_KEYS = new Set(['subheading', 'body_text', 'description', 'summary', 'answer', 'eligibility', 'message_placeholder'])
const CONTENT_ACTIVE_PAGE_STORAGE_KEY = 'nexora-admin-content-active-page'
const CONTENT_DRAFTS_STORAGE_KEY = 'nexora-admin-content-drafts-v1'

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function slugifyFileName(value) {
  return (value || 'asset')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function humanizeLabel(value) {
  return `${value ?? ''}`
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function buildDraftState(rows) {
  const next = {}

  Object.entries(rows).forEach(([pageKey, sections]) => {
    next[pageKey] = sections.map((section) => ({
      ...section,
      items_json: cloneValue(section.items_json ?? []),
      settings_json: cloneValue(section.settings_json ?? {}),
      _itemsTemplate: cloneValue(section.items_json ?? []),
      _settingsTemplate: cloneValue(section.settings_json ?? {}),
    }))
  })

  return next
}

function readStoredJson(key) {
  try {
    const value = window.sessionStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function mergeDraftState(baseState, savedState) {
  if (!savedState || !isPlainObject(savedState)) return baseState

  const nextState = { ...baseState }

  Object.entries(baseState).forEach(([pageKey, sections]) => {
    const savedSections = Array.isArray(savedState[pageKey]) ? savedState[pageKey] : []
    const savedSectionMap = new Map(savedSections.map((section) => [section.section_key, section]))

    nextState[pageKey] = sections.map((section) => {
      const savedSection = savedSectionMap.get(section.section_key)
      if (!savedSection) return section

      return {
        ...section,
        ...savedSection,
        _itemsTemplate: section._itemsTemplate,
        _settingsTemplate: section._settingsTemplate,
      }
    })
  })

  return nextState
}

function getValueAtPath(value, path) {
  return path.reduce((current, key) => (current == null ? current : current[key]), value)
}

function updateValueAtPath(source, path, nextValue) {
  if (!path.length) {
    return nextValue
  }

  const [head, ...rest] = path
  const base = Array.isArray(source) ? [...source] : { ...(source ?? {}) }
  base[head] = updateValueAtPath(base[head], rest, nextValue)
  return base
}

function removeValueAtPath(source, path, indexToRemove) {
  const list = getValueAtPath(source, path)
  if (!Array.isArray(list)) return source

  const nextList = list.filter((_, index) => index !== indexToRemove)
  return updateValueAtPath(source, path, nextList)
}

function defaultValueFromTemplate(template) {
  if (Array.isArray(template)) {
    if (!template.length) return ''
    return cloneValue(template[0])
  }

  if (isPlainObject(template)) {
    return cloneValue(template)
  }

  if (typeof template === 'number') return 0
  if (typeof template === 'boolean') return false
  return ''
}

function appendValueAtPath(source, templateSource, path) {
  const list = getValueAtPath(source, path)
  if (!Array.isArray(list)) return source

  const templateList = getValueAtPath(templateSource, path)
  const template =
    Array.isArray(templateList) && templateList.length
      ? templateList[0]
      : list.length
        ? list[0]
        : ''

  const nextList = [...list, defaultValueFromTemplate(template)]
  return updateValueAtPath(source, path, nextList)
}

function buildUploadPath(section, fieldKey, file) {
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${slugifyFileName(`${section.section_key}-${fieldKey}`)}.${extension}`
  return `page-content/${section.page_key}/${fileName}`
}

function PageContentManager() {
  const pageOptions = useMemo(() => getPageOptions(), [])
  const [activePage, setActivePage] = useState(() => {
    try {
      const savedPage = window.sessionStorage.getItem(CONTENT_ACTIVE_PAGE_STORAGE_KEY)
      return pageOptions.some((page) => page.key === savedPage) ? savedPage : pageOptions[0]?.key || 'home'
    } catch {
      return pageOptions[0]?.key || 'home'
    }
  })
  const [pageRows, setPageRows] = useState(() => {
    const defaults = buildDraftState(buildPageSectionRowsForAdmin())
    const savedDrafts = readStoredJson(CONTENT_DRAFTS_STORAGE_KEY)
    return mergeDraftState(defaults, savedDrafts)
  })
  const [loading, setLoading] = useState(() => {
    const savedDrafts = readStoredJson(CONTENT_DRAFTS_STORAGE_KEY)
    return !savedDrafts
  })
  const [notice, setNotice] = useState(null)
  const [savingKey, setSavingKey] = useState('')
  const [uploadingKey, setUploadingKey] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadPageSections() {
      const savedDrafts = readStoredJson(CONTENT_DRAFTS_STORAGE_KEY)
      if (!savedDrafts) {
        setLoading(true)
      }
      setNotice(null)

      try {
        const { data, error } = await supabase
          .from('page_sections')
          .select(
            'id, page_key, section_key, label, heading, subheading, body_text, badge_text, primary_btn_text, primary_btn_url, secondary_btn_text, secondary_btn_url, media_url, media_secondary_url, enabled, order_index, items_json, settings_json',
          )
          .order('page_key', { ascending: true })
          .order('order_index', { ascending: true })

        if (error) throw error
        if (ignore) return

        const serverState = buildDraftState(buildPageSectionRowsForAdmin(data ?? []))
        setPageRows((current) => {
          const draftState = readStoredJson(CONTENT_DRAFTS_STORAGE_KEY)
          if (draftState) {
            return mergeDraftState(serverState, draftState)
          }

          return current ? mergeDraftState(serverState, current) : serverState
        })
      } catch (error) {
        console.error('[PageContentManager] Failed to load page sections:', error)
        if (!ignore) {
          setNotice({ type: 'error', text: error.message || 'Could not load page content.' })
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadPageSections()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CONTENT_ACTIVE_PAGE_STORAGE_KEY, activePage)
    } catch {
      // Ignore storage issues and keep the editor usable.
    }
  }, [activePage])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CONTENT_DRAFTS_STORAGE_KEY, JSON.stringify(pageRows))
    } catch {
      // Ignore storage issues and keep the editor usable.
    }
  }, [pageRows])

  function updateSection(pageKey, sectionKey, updater) {
    setPageRows((current) => ({
      ...current,
      [pageKey]: (current[pageKey] ?? []).map((section) =>
        section.section_key === sectionKey
          ? typeof updater === 'function'
            ? updater(section)
            : { ...section, ...updater }
          : section,
      ),
    }))
  }

  function updateNestedField(section, rootKey, path, value) {
    updateSection(section.page_key, section.section_key, (current) => ({
      ...current,
      [rootKey]: updateValueAtPath(current[rootKey], path, value),
    }))
  }

  function addListItem(section, rootKey, path) {
    updateSection(section.page_key, section.section_key, (current) => ({
      ...current,
      [rootKey]: appendValueAtPath(
        current[rootKey],
        rootKey === 'items_json' ? current._itemsTemplate : current._settingsTemplate,
        path,
      ),
    }))
  }

  function removeListItem(section, rootKey, path, indexToRemove) {
    updateSection(section.page_key, section.section_key, (current) => ({
      ...current,
      [rootKey]: removeValueAtPath(current[rootKey], path, indexToRemove),
    }))
  }

  async function handleSave(section) {
    const saveKey = `${section.page_key}:${section.section_key}`
    setSavingKey(saveKey)
    setNotice(null)

    try {
      const payload = serializePageSectionRow({
        ...section,
        items_json: section.items_json,
        settings_json: section.settings_json,
      })

      const { data, error } = await supabase
        .from('page_sections')
        .upsert(payload, { onConflict: 'page_key,section_key' })
        .select(
          'id, page_key, section_key, label, heading, subheading, body_text, badge_text, primary_btn_text, primary_btn_url, secondary_btn_text, secondary_btn_url, media_url, media_secondary_url, enabled, order_index, items_json, settings_json',
        )
        .single()

      if (error) throw error

      updateSection(section.page_key, section.section_key, {
        ...data,
      })
      setNotice({ type: 'success', text: `${section.label} saved.` })
    } catch (error) {
      console.error('[PageContentManager] Failed to save section:', error)
      setNotice({
        type: 'error',
        text: error.message || 'Could not save this section.',
      })
    } finally {
      setSavingKey('')
    }
  }

  async function handleTopLevelUpload(section, field, file) {
    if (!file) return

    const uploadKey = `${section.page_key}:${section.section_key}:${field}`
    setUploadingKey(uploadKey)
    setNotice(null)

    try {
      const filePath = buildUploadPath(section, field, file)
      const { error: uploadError } = await supabase.storage.from('site-assets').upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath)
      updateSection(section.page_key, section.section_key, {
        [field]: data.publicUrl,
      })
      setNotice({ type: 'success', text: 'Image uploaded. Save the section to publish it.' })
    } catch (error) {
      console.error('[PageContentManager] Upload failed:', error)
      setNotice({ type: 'error', text: error.message || 'Could not upload the image.' })
    } finally {
      setUploadingKey('')
    }
  }

  async function handleNestedImageUpload(section, rootKey, path, file) {
    if (!file) return

    const fieldKey = path.join('-')
    const uploadKey = `${section.page_key}:${section.section_key}:${rootKey}:${fieldKey}`
    setUploadingKey(uploadKey)
    setNotice(null)

    try {
      const filePath = buildUploadPath(section, fieldKey, file)
      const { error: uploadError } = await supabase.storage.from('site-assets').upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath)
      updateNestedField(section, rootKey, path, data.publicUrl)
      setNotice({ type: 'success', text: 'Image uploaded. Save the section to publish it.' })
    } catch (error) {
      console.error('[PageContentManager] Nested upload failed:', error)
      setNotice({ type: 'error', text: error.message || 'Could not upload the image.' })
    } finally {
      setUploadingKey('')
    }
  }

  async function handleNestedImageUploads(section, rootKey, path, files) {
    const fileList = Array.from(files ?? [])
    if (!fileList.length) return

    const fieldKey = path.join('-')
    const uploadKey = `${section.page_key}:${section.section_key}:${rootKey}:${fieldKey}`
    setUploadingKey(uploadKey)
    setNotice(null)

    try {
      const uploadedUrls = []

      for (const file of fileList) {
        const filePath = buildUploadPath(section, fieldKey, file)
        const { error: uploadError } = await supabase.storage.from('site-assets').upload(filePath, file, {
          upsert: true,
        })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('site-assets').getPublicUrl(filePath)
        uploadedUrls.push(data.publicUrl)
      }

      updateSection(section.page_key, section.section_key, (current) => {
        const nextRoot = updateValueAtPath(current[rootKey], path, uploadedUrls[0] ?? '')
        const parentPath = path.slice(0, -1)
        const currentParent = getValueAtPath(nextRoot, parentPath)

        if (!isPlainObject(currentParent) || uploadedUrls.length <= 1) {
          return {
            ...current,
            [rootKey]: nextRoot,
          }
        }

        return {
          ...current,
          [rootKey]: updateValueAtPath(nextRoot, parentPath, {
            ...currentParent,
            image_urls: uploadedUrls,
          }),
        }
      })

      setNotice({
        type: 'success',
        text:
          uploadedUrls.length === 1
            ? 'Image uploaded. Save the section to publish it.'
            : `${uploadedUrls.length} images uploaded. Save the section to publish them.`,
      })
    } catch (error) {
      console.error('[PageContentManager] Nested upload failed:', error)
      setNotice({ type: 'error', text: error.message || 'Could not upload the image.' })
    } finally {
      setUploadingKey('')
    }
  }

  function renderPrimitiveField(section, rootKey, path, value, parentKey) {
    const fieldKey = path[path.length - 1]
    const uploadKey = `${section.page_key}:${section.section_key}:${rootKey}:${path.join('-')}`
    const isUploading = uploadingKey === uploadKey
    const label =
      typeof fieldKey === 'number'
        ? `${humanizeLabel(parentKey || 'Item')} ${fieldKey + 1}`
        : humanizeLabel(fieldKey)
    const isImageField = IMAGE_FIELD_KEYS.has(fieldKey)
    const isLongText = LONG_TEXT_FIELD_KEYS.has(fieldKey) || String(value || '').length > 100
    const parentPath = path.slice(0, -1)
    const parentValue = parentPath.length ? getValueAtPath(section[rootKey], parentPath) : section[rootKey]
    const imageGallery = Array.isArray(parentValue?.image_urls) && parentValue.image_urls.length
      ? parentValue.image_urls.filter(Boolean)
      : value
        ? [value]
        : []

    if (typeof value === 'boolean') {
      return (
        <label key={`${rootKey}-${path.join('-')}`} className="admin-checkbox admin-checkbox-inline">
          <input
            type="checkbox"
            checked={value}
            onChange={(event) => updateNestedField(section, rootKey, path, event.target.checked)}
          />
          <span>{label}</span>
        </label>
      )
    }

    if (typeof value === 'number') {
      return (
        <label key={`${rootKey}-${path.join('-')}`} className="admin-field">
          <span>{label}</span>
          <input
            type="number"
            value={value}
            onChange={(event) => updateNestedField(section, rootKey, path, Number(event.target.value))}
          />
        </label>
      )
    }

    return (
      <div key={`${rootKey}-${path.join('-')}`} className={`admin-field${isLongText ? ' admin-field-full' : ''}`}>
        <span>{label}</span>
        {isLongText ? (
          <textarea
            rows="3"
            value={value ?? ''}
            onChange={(event) => updateNestedField(section, rootKey, path, event.target.value)}
          />
        ) : (
          <input
            type="text"
            value={value ?? ''}
            onChange={(event) => updateNestedField(section, rootKey, path, event.target.value)}
          />
        )}

        {isImageField ? (
          <div className="admin-inline-upload">
            <label className={`admin-btn admin-btn-soft admin-upload-btn${isUploading ? ' is-uploading' : ''}`}>
              <ImagePlus size={16} />
              <span>{isUploading ? 'Uploading...' : 'Upload Image(s)'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  if (files.length > 1) {
                    handleNestedImageUploads(section, rootKey, path, files)
                    return
                  }

                  handleNestedImageUpload(section, rootKey, path, files[0])
                }}
                disabled={isUploading}
                hidden
              />
            </label>
            {imageGallery.length ? (
              <div className="admin-image-preview-strip" aria-label={`${label} preview`}>
                {imageGallery.map((imageUrl, index) => (
                  <div key={`${path.join('-')}-${imageUrl}-${index}`} className="admin-image-preview-thumb">
                    <img src={imageUrl} alt={`${label} preview ${index + 1}`} />
                    {imageGallery.length > 1 ? <span>{index + 1}</span> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  function renderArrayEditor(section, rootKey, path, value, templateValue, parentKey) {
    const fieldKey = path[path.length - 1]
    const label = humanizeLabel(fieldKey || parentKey || rootKey.replace('_json', ''))
    const itemTemplate =
      Array.isArray(templateValue) && templateValue.length
        ? templateValue[0]
        : value.length
          ? value[0]
          : ''

    return (
      <div key={`${rootKey}-${path.join('-')}`} className="admin-array-group admin-field-full">
        <div className="admin-array-header">
          <div>
            <strong>{label}</strong>
            <span>{value.length ? `${value.length} item${value.length > 1 ? 's' : ''}` : 'No items yet'}</span>
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-soft"
            onClick={() => addListItem(section, rootKey, path)}
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>

        <div className="admin-array-stack">
          {value.map((item, index) => (
            <div key={`${path.join('-')}-${index}`} className="admin-array-item">
              <div className="admin-array-item-header">
                <strong>{humanizeLabel(parentKey || fieldKey)} {index + 1}</strong>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  onClick={() => removeListItem(section, rootKey, path, index)}
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>

              {renderDynamicEditor(section, rootKey, [...path, index], item, itemTemplate, fieldKey)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderObjectEditor(section, rootKey, path, value, templateValue, parentKey) {
    const fieldKey = path[path.length - 1]
    const label = path.length ? humanizeLabel(fieldKey) : humanizeLabel(rootKey.replace('_json', ''))
    const keys = Array.from(
      new Set([
        ...Object.keys(templateValue || {}),
        ...Object.keys(value || {}),
      ]),
    )

    return (
      <div key={`${rootKey}-${path.join('-') || 'root'}`} className="admin-object-group admin-field-full">
        {path.length ? (
          <div className="admin-object-header">
            <strong>{label}</strong>
          </div>
        ) : null}

        <div className="admin-object-grid">
          {keys.map((key) =>
            renderDynamicEditor(
              section,
              rootKey,
              [...path, key],
              value?.[key],
              templateValue?.[key],
              key,
            ),
          )}
        </div>
      </div>
    )
  }

  function renderDynamicEditor(section, rootKey, path, value, templateValue, parentKey = '') {
    if (Array.isArray(value)) {
      return renderArrayEditor(section, rootKey, path, value, templateValue, parentKey)
    }

    if (isPlainObject(value)) {
      return renderObjectEditor(section, rootKey, path, value, templateValue, parentKey)
    }

    return renderPrimitiveField(section, rootKey, path, value, parentKey)
  }

  const activeSections = (pageRows[activePage] ?? []).slice().sort((left, right) => left.order_index - right.order_index)

  if (loading) {
    return <div className="admin-loading">Loading page content...</div>
  }

  return (
    <section className="admin-panel-card">
      <div className="admin-panel-card-header">
        <div>
          <h2>Page Content</h2>
          <p>Edit text, numbers, buttons, cards, FAQs, and images without touching code.</p>
        </div>
      </div>

      {notice ? (
        <div className={`admin-notice ${notice.type === 'error' ? 'error' : 'success'}`}>{notice.text}</div>
      ) : null}

      <div className="admin-content-tabs">
        {pageOptions.map((page) => (
          <button
            key={page.key}
            type="button"
            className={`admin-content-tab${activePage === page.key ? ' active' : ''}`}
            onClick={() => setActivePage(page.key)}
          >
            {page.label}
          </button>
        ))}
      </div>

      <div className="admin-content-stack">
        {activeSections.map((section) => {
          const saveKey = `${section.page_key}:${section.section_key}`
          const isSaving = savingKey === saveKey
          const isUploadingPrimary = uploadingKey === `${section.page_key}:${section.section_key}:media_url`
          const isUploadingSecondary = uploadingKey === `${section.page_key}:${section.section_key}:media_secondary_url`

          return (
            <article key={saveKey} className="admin-content-card">
              <div className="admin-content-card-header">
                <div>
                  <h3>{section.label}</h3>
                  <p>{humanizeLabel(section.section_key)} section</p>
                </div>

                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { enabled: event.target.checked })
                    }
                  />
                  <span>Show This Section</span>
                </label>
              </div>

              <div className="admin-settings-form admin-content-grid">
                <label className="admin-field">
                  <span>Section Name</span>
                  <input
                    type="text"
                    value={section.label}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { label: event.target.value })
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Display Order</span>
                  <input
                    type="number"
                    value={section.order_index}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { order_index: event.target.value })
                    }
                  />
                </label>

                <label className="admin-field admin-field-full">
                  <span>Badge Text</span>
                  <input
                    type="text"
                    value={section.badge_text}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { badge_text: event.target.value })
                    }
                  />
                </label>

                <label className="admin-field admin-field-full">
                  <span>Heading</span>
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { heading: event.target.value })
                    }
                  />
                </label>

                <label className="admin-field admin-field-full">
                  <span>Subheading</span>
                  <textarea
                    rows="3"
                    value={section.subheading}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { subheading: event.target.value })
                    }
                  />
                </label>

                <label className="admin-field admin-field-full">
                  <span>Body Text</span>
                  <textarea
                    rows="3"
                    value={section.body_text}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { body_text: event.target.value })
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Primary Button Text</span>
                  <input
                    type="text"
                    value={section.primary_btn_text}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { primary_btn_text: event.target.value })
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Primary Button Link</span>
                  <input
                    type="text"
                    value={section.primary_btn_url}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { primary_btn_url: event.target.value })
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Secondary Button Text</span>
                  <input
                    type="text"
                    value={section.secondary_btn_text}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { secondary_btn_text: event.target.value })
                    }
                  />
                </label>

                <label className="admin-field">
                  <span>Secondary Button Link</span>
                  <input
                    type="text"
                    value={section.secondary_btn_url}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { secondary_btn_url: event.target.value })
                    }
                  />
                </label>

                <div className="admin-field admin-field-full">
                  <span>Primary Image</span>
                  <input
                    type="text"
                    value={section.media_url}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { media_url: event.target.value })
                    }
                  />
                  <div className="admin-inline-upload">
                    <label className="admin-btn admin-btn-soft admin-upload-btn">
                      <ImagePlus size={16} />
                      <span>{isUploadingPrimary ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleTopLevelUpload(section, 'media_url', event.target.files?.[0])}
                        disabled={isUploadingPrimary}
                        hidden
                      />
                    </label>
                  </div>
                </div>

                <div className="admin-field admin-field-full">
                  <span>Secondary Image</span>
                  <input
                    type="text"
                    value={section.media_secondary_url}
                    onChange={(event) =>
                      updateSection(section.page_key, section.section_key, { media_secondary_url: event.target.value })
                    }
                  />
                  <div className="admin-inline-upload">
                    <label className="admin-btn admin-btn-soft admin-upload-btn">
                      <ImagePlus size={16} />
                      <span>{isUploadingSecondary ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleTopLevelUpload(section, 'media_secondary_url', event.target.files?.[0])}
                        disabled={isUploadingSecondary}
                        hidden
                      />
                    </label>
                  </div>
                </div>

                {(Array.isArray(section.items_json) && section.items_json.length) ||
                (Array.isArray(section._itemsTemplate) && section._itemsTemplate.length)
                  ? renderDynamicEditor(section, 'items_json', [], section.items_json, section._itemsTemplate, 'Item')
                  : null}

                {isPlainObject(section.settings_json) && Object.keys(section.settings_json).length
                  ? renderDynamicEditor(
                      section,
                      'settings_json',
                      [],
                      section.settings_json,
                      section._settingsTemplate,
                      'Setting',
                    )
                  : null}
              </div>

              <div className="admin-content-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleSave(section)}
                  disabled={isSaving}
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save Section'}
                </button>
                <span className="admin-content-hint">
                  Images are uploaded to Supabase Storage. After uploading, click save once and the live site updates from the database.
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default PageContentManager

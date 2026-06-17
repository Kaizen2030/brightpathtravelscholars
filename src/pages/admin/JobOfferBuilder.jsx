// JobOfferBuilder.jsx
import { useEffect, useRef, useState } from 'react'
import { Download, Upload, X, Plus } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import './CertificateBuilder.css'

// --- Constants ---
const JOB_OFFER_TEMPLATE_IMAGE = '/images/job-offer-header-reference.png'
const IMAGE_BUCKET = 'site-assets'

const JOB_OFFER_IMAGE_FIELDS = [
  { key: 'company_logo_url', label: 'Company Logo', helper: 'Shown in the top-right brand box.', fit: 'contain' },
  { key: 'applicant_photo_url', label: 'Applicant Photo', helper: 'Shown in the applicant photo box.', fit: 'cover' },
  { key: 'stamp_image_url', label: 'Stamp Image', helper: 'Shown in the circular stamp area.', fit: 'contain' },
  { key: 'signature_image_url', label: 'Digital Signature', helper: 'Shown on the signature line.', fit: 'contain' },
]

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `job-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createBlankJobOfferRecord() {
  return {
    id: createId(),
    offer_reference: `<REF: CRH 38-1827-588686
2023/07/26
CHENGETAI SUNGANI
Address: Zimbabwe`,
    recipient_block: `Dear CHENGETAI,

It gives us immense pleasure to offer you an exciting chance to join our esteemed health care ensemble as a Health Care Assistant. Your unwavering commitment to providing exceptional care, alongside your exceptional flair, has greatly impressed us. With deep conviction, we feel that you would make an outstanding addition to our organization, and we are thrilled to extend this proposal.`,
    subject_heading: 'REF: JOB OFFER',
    offer_body: `Job Details:

Position: Health Care Assistant
Salary: Hourly rate of $21.70
Hours: 30 hours per week

Roles and Responsibilities:
In the role of a Health Care Assistant, you will play a crucial role in providing compassionate support and care to our patients. Your responsibilities will include assisting with daily activities, ensuring patient comfort and safety, and maintaining a clean and organized environment. Your dedication to demonstrating empathy and kindness in every interaction will be essential in creating a positive and nurturing environment for our patients.

Supervision and Support:
Throughout your journey with us, you will be under the guidance and leadership of experienced professionals who will provide mentorship and unwavering support. We firmly believe that your unique combination of skills and dedication, along with the support of our team, will significantly contribute to the success of our organization.

Benefits and Opportunities:
As part of our commitment to recognizing your valuable contributions, we offer a competitive hourly wage of $21.70. Additionally, we provide opportunities for professional development and growth, allowing you to enhance your skills and advance in your career.

Compensation and Documentation:
Your hourly wage of $21.70 will be provided before any applicable taxes or deductions. To formally accept this offer, kindly submit a signed acceptance letter along with relevant documents from your current employer to our Human Resources department.`,
    job_details: `Supervision and Support:
Throughout your journey with us, you will be under the guidance and leadership of experienced professionals who will provide mentorship and unwavering support. We firmly believe that your unique combination of skills and dedication, along with the support of our team, will significantly contribute to the success of our organization.

Benefits and Opportunities:
As part of our commitment to recognizing your valuable contributions, we offer a competitive hourly wage of $21.70. Additionally, we provide opportunities for professional development and growth, allowing you to enhance your skills and advance in your career.

Compensation and Documentation:
Your hourly wage of $21.70 will be provided before any applicable taxes or deductions. To formally accept this offer, kindly submit a signed acceptance letter along with relevant documents from your current employer to our Human Resources department.`,
    signoff: `We are thrilled at the prospect of having you join our health care family as a Health Care Assistant. Your expertise and genuine care will undoubtedly have a significant impact on the lives of those we serve. We eagerly anticipate working with you and providing you with a fulfilling and rewarding career.

Should you have any questions or require further information, please do not hesitate to contact our HR department and also send a signed copy of this document.

Congratulations on becoming part of our compassionate and dedicated team!

Sincerely,`,
    signature_label: `The Cardinal Residence Retirement Residence
Manager`,
    signature_name: 'SIMON A. JOHNSON',
    applicant_label: `Applicant's signature`,
    helpline_text: 'HELPLINE:+1 323 375 3997',
    canada_mark_text: 'Canada',
    small_print_text: `Immigration, Refugees and Citizenship Canada
Immigration, Réfugiés et Citoyenneté Canada`,
    company_logo_url: '',
    applicant_photo_url: '',
    stamp_image_url: '',
    signature_image_url: '',
    footer_text: 'Please send a signed copy of this offer letter and required documents to our HR department. Congratulations on becoming part of our compassionate and dedicated team!',
    template_version: '2026',
  }
}

function buildJobOfferPreview(record) {
  return {
    company_logo_url: record.company_logo_url || '',
    applicant_photo_url: record.applicant_photo_url || '',
    stamp_image_url: record.stamp_image_url || '',
    signature_image_url: record.signature_image_url || '',
    offer_reference: record.offer_reference || '',
    recipient_block: record.recipient_block || '',
    subject_heading: record.subject_heading || 'REF: JOB OFFER',
    offer_body: record.offer_body || '',
    job_details: record.job_details || '',
    signoff: record.signoff || '',
    signature_label: record.signature_label || '',
    signature_name: record.signature_name || '',
    signature_image_url: record.signature_image_url || '',
    applicant_label: record.applicant_label || '',
    helpline_text: record.helpline_text || '',
    canada_mark_text: record.canada_mark_text || '',
    small_print_text: record.small_print_text || '',
    footer_text: record.footer_text || '',
  }
}

// FIXED: Better text rendering that preserves formatting
function renderJobOfferTextBlocks(text, keyPrefix, className = '') {
  if (!text) return null
  
  // Split by double newlines for paragraphs
  const blocks = text.split(/\n\s*\n/).filter(block => block.trim())
  
  if (blocks.length === 0) {
    // If no double newlines, treat as single block
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length === 0) return null
    
    // Check if first line is a heading (ends with colon)
    const firstLine = lines[0] || ''
    const remainder = lines.slice(1).join('\n').trim()
    const headingMatch = firstLine.match(/^(.*?:)\s*$/)
    
    if (headingMatch && remainder) {
      return (
        <section key={`${keyPrefix}-0`} className={`job-offer-text-block has-heading ${className}`.trim()}>
          <h4>{headingMatch[1]}</h4>
          <p>{remainder}</p>
        </section>
      )
    }
    
    return (
      <p key={`${keyPrefix}-0`} className={`job-offer-text-block ${className}`.trim()}>
        {text}
      </p>
    )
  }

  return blocks.map((block, index) => {
    const lines = block.split(/\r?\n/).map((line) => line.trimEnd())
    const firstLine = lines[0] || ''
    const remainder = lines.slice(1).join('\n').trim()
    const headingMatch = firstLine.match(/^(.*?:)\s*$/)

    if (headingMatch && remainder) {
      return (
        <section key={`${keyPrefix}-${index}`} className={`job-offer-text-block has-heading ${className}`.trim()}>
          <h4>{headingMatch[1]}</h4>
          <p>{remainder}</p>
        </section>
      )
    }

    if (headingMatch) {
      return (
        <section key={`${keyPrefix}-${index}`} className={`job-offer-text-block has-heading ${className}`.trim()}>
          <h4>{headingMatch[1]}</h4>
        </section>
      )
    }

    return (
      <p key={`${keyPrefix}-${index}`} className={`job-offer-text-block ${className}`.trim()}>
        {block}
      </p>
    )
  })
}

function getJobOfferTextMetrics(element) {
  if (!element || typeof window === 'undefined') {
    return { fontSizePx: 10, lineHeightFactor: 1.2, align: 'left', fontWeight: '400' }
  }

  const computed = window.getComputedStyle(element)
  const fontSizePx = Number.parseFloat(computed.fontSize) || 10
  const lineHeightPx = Number.parseFloat(computed.lineHeight)
  const lineHeightFactor = Number.isFinite(lineHeightPx) && fontSizePx > 0 ? lineHeightPx / fontSizePx : 1.2
  const rawAlign = `${computed.textAlign || 'left'}`.toLowerCase()
  const align = rawAlign === 'center' || rawAlign === 'right' || rawAlign === 'justify' ? rawAlign : 'left'

  return {
    fontSizePx,
    lineHeightFactor,
    align,
    fontWeight: computed.fontWeight || '400',
  }
}

function addJobOfferTextLayer(pdf, stage, stageBounds, imageWidth, imageHeight, offsetX, offsetY) {
  if (!stage || !stageBounds) return

  const textNodes = Array.from(
    stage.querySelectorAll(
      '.job-offer-reference, .job-offer-heading, .job-offer-text-block, .job-offer-signature-label, .job-offer-signature-name, .job-offer-applicant-label, .job-offer-stamp-title, .job-offer-stamp-date, .job-offer-helpline',
    ),
  )

  textNodes.forEach((node) => {
    const rawText = `${node.innerText || node.textContent || ''}`.trim()
    if (!rawText) return

    const rect = node.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const metrics = getJobOfferTextMetrics(node)
    const fontSizePt = metrics.fontSizePx * 0.75
    const left = rect.left - stageBounds.left
    const top = rect.top - stageBounds.top
    const width = rect.width
    const x = offsetX + (left / stageBounds.width) * imageWidth
    const y = offsetY + (top / stageBounds.height) * imageHeight + fontSizePt * 0.9
    const maxWidth = (width / stageBounds.width) * imageWidth
    const lines = rawText.split(/\r?\n/).flatMap((line) => {
      if (!line.trim()) return ['']
      const wrapped = pdf.splitTextToSize(line, maxWidth)
      return Array.isArray(wrapped) ? wrapped : [wrapped]
    })

    pdf.setFont('helvetica', /^(bold|[7-9]00)$/.test(`${metrics.fontWeight}`) ? 'bold' : 'normal')
    pdf.setFontSize(fontSizePt)
    pdf.setTextColor(18, 18, 18)
    pdf.text(lines, x, y, {
      align: metrics.align,
      lineHeightFactor: metrics.lineHeightFactor,
      maxWidth,
    })
  })
}

// Ensure cloned stage receives up-to-date text and image sources before html2canvas runs
function syncJobOfferExportClone(sourceStage, clonedStage) {
  if (!sourceStage || !clonedStage) return

  try {
    const selectors = [
      '.job-offer-reference',
      '.job-offer-heading',
      '.job-offer-text-block',
      '.job-offer-signature-label',
      '.job-offer-signature-name',
      '.job-offer-applicant-label',
      '.job-offer-stamp-title',
      '.job-offer-stamp-date',
      '.job-offer-helpline',
    ]

    selectors.forEach((sel) => {
      const sourceNodes = Array.from(sourceStage.querySelectorAll(sel))
      const clonedNodes = Array.from(clonedStage.querySelectorAll(sel))
      sourceNodes.forEach((srcNode, i) => {
        const dst = clonedNodes[i]
        if (!dst) return
        dst.textContent = srcNode.textContent || srcNode.innerText || ''
      })
    })

    // Ensure image elements keep the same src so html2canvas can draw them
    const srcImages = Array.from(sourceStage.querySelectorAll('img'))
    const dstImages = Array.from(clonedStage.querySelectorAll('img'))
    srcImages.forEach((img, i) => {
      const d = dstImages[i]
      if (!d) return
      try {
        d.setAttribute('src', img.src || d.getAttribute('src') || '')
      } catch (e) {
        // ignore
      }
    })
  } catch (e) {
    // non-fatal
  }
}

function buildImageUploadPath(recordId, fieldKey, file) {
  const safeName = (file?.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `job-offer-builder/${recordId}/${fieldKey}/${Date.now()}-${safeName || 'upload'}`
}

function JobOfferBuilder({ onNotice }) {
  const [jobOfferDraft, setJobOfferDraft] = useState(createBlankJobOfferRecord())
  const [uploadingField, setUploadingField] = useState('')
  const [exporting, setExporting] = useState(false)
  const signatureCanvasRef = useRef(null)
  const signatureDrawStateRef = useRef({ drawing: false, lastX: 0, lastY: 0, lastTime: 0, hasInk: false })

  const jobOfferPreview = buildJobOfferPreview(jobOfferDraft)

  useEffect(() => {
    const canvas = signatureCanvasRef.current
    if (!canvas || typeof window === 'undefined') return undefined

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))

    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1f1f1f'
    ctx.lineWidth = 2.8

    signatureDrawStateRef.current = { drawing: false, lastX: 0, lastY: 0, lastTime: 0, hasInk: false }

    return undefined
  }, [])

  function getSignatureCanvasPoint(event) {
    const canvas = signatureCanvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    return { x, y }
  }

  function redrawSignatureCanvasLine(fromX, fromY, toX, toY, pressure = 0.5, speed = 0) {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pressureBoost = Math.min(1, Math.max(0, pressure)) * 1.7
    const speedPenalty = Math.min(1.2, Math.max(0, speed / 1.2)) * 0.9
    const width = Math.max(1.35, 2.1 + pressureBoost - speedPenalty)
    const deltaX = toX - fromX
    const deltaY = toY - fromY
    const wobbleSeed = (fromX * 0.017) + (fromY * 0.013) + (toX * 0.011) + (toY * 0.019) + speed * 11
    const wobbleX = Math.sin(wobbleSeed) * Math.min(0.9, 0.18 + speed * 1.4)
    const wobbleY = Math.cos(wobbleSeed * 0.9) * Math.min(0.9, 0.18 + speed * 1.4)
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    const controlX = fromX + deltaX * 0.35 + wobbleX
    const controlY = fromY + deltaY * 0.35 + wobbleY
    ctx.quadraticCurveTo(controlX, controlY, (fromX + toX) / 2, (fromY + toY) / 2)
    ctx.stroke()
  }

  function drawSignatureDot(x, y, pressure = 0.5, fade = 1) {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.globalAlpha = Math.max(0.2, Math.min(1, fade))
    ctx.beginPath()
    ctx.arc(x, y, 1.4 + pressure * 1.4, 0, Math.PI * 2)
    ctx.fillStyle = '#1f1f1f'
    ctx.fill()
    ctx.restore()
  }

  function commitSignatureCanvas({ silent = false } = {}) {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const state = signatureDrawStateRef.current
    if (!state.hasInk) {
      if (!silent) onNotice('Draw a signature first.')
      return
    }

    const imageUrl = canvas.toDataURL('image/png')
    setJobOfferDraft((current) => ({ ...current, signature_image_url: imageUrl }))
    if (!silent) onNotice('Digital signature captured.')
  }

  function clearSignatureCanvas() {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      const { width, height } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, width, height)
    }

    signatureDrawStateRef.current = { drawing: false, lastX: 0, lastY: 0, hasInk: false }
    setJobOfferDraft((current) => ({ ...current, signature_image_url: '' }))
    onNotice('Signature drawing cleared.')
  }

  function handleSignaturePointerDown(event) {
    const point = getSignatureCanvasPoint(event)
    const canvas = signatureCanvasRef.current
    if (!point || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    signatureDrawStateRef.current = {
      drawing: true,
      lastX: point.x,
      lastY: point.y,
      lastTime: event.timeStamp || Date.now(),
      hasInk: true,
    }

    canvas.setPointerCapture?.(event.pointerId)
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    drawSignatureDot(point.x, point.y, event.pressure || 0.45, 0.75)
    redrawSignatureCanvasLine(point.x, point.y, point.x + 0.1, point.y + 0.1, event.pressure || 0.45, 0)
  }

  function handleSignaturePointerMove(event) {
    const state = signatureDrawStateRef.current
    if (!state.drawing) return

    const point = getSignatureCanvasPoint(event)
    if (!point) return

    const now = event.timeStamp || Date.now()
    const dt = Math.max(1, now - (state.lastTime || now))
    const distance = Math.hypot(point.x - state.lastX, point.y - state.lastY)
    const speed = distance / dt

    redrawSignatureCanvasLine(state.lastX, state.lastY, point.x, point.y, event.pressure || 0.45, speed)
    signatureDrawStateRef.current.lastX = point.x
    signatureDrawStateRef.current.lastY = point.y
    signatureDrawStateRef.current.lastTime = now
  }

  function handleSignaturePointerUp(event) {
    const state = signatureDrawStateRef.current
    if (!state.drawing) return

    signatureDrawStateRef.current.drawing = false
    const point = getSignatureCanvasPoint(event)
    if (point) {
      signatureDrawStateRef.current.lastX = point.x
      signatureDrawStateRef.current.lastY = point.y
      signatureDrawStateRef.current.lastTime = event.timeStamp || Date.now()
      drawSignatureDot(point.x, point.y, event.pressure || 0.35, 0.9)
    }

    commitSignatureCanvas({ silent: true })
  }

  function getImageFieldLabel(fieldKey) {
    const field = JOB_OFFER_IMAGE_FIELDS.find((f) => f.key === fieldKey)
    return field?.label || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  function updateJobOfferField(field, value) {
    setJobOfferDraft((current) => ({ ...current, [field]: value }))
  }

  async function handleJobOfferImageUpload(fieldKey, file) {
    if (!file) return

    const recordId = jobOfferDraft.id
    setUploadingField(fieldKey)

    try {
      const filePath = buildImageUploadPath(jobOfferDraft.id, fieldKey, file)
      const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      setJobOfferDraft((current) => ({ ...current, [fieldKey]: publicUrl }))
      onNotice(`${getImageFieldLabel(fieldKey)} uploaded.`)
    } catch (error) {
      console.error('[JobOfferBuilder] Image upload failed:', error)
      onNotice(error.message || 'Could not upload the image.')
    } finally {
      setUploadingField('')
    }
  }

  function clearJobOfferImageField(fieldKey) {
    setJobOfferDraft((current) => ({ ...current, [fieldKey]: '' }))
    onNotice(`${getImageFieldLabel(fieldKey)} removed.`)
  }

  function renderImageCard(field, value, onUpload, onClear) {
    const isUploading = uploadingField === field.key

    return (
      <div key={field.key} className="certificate-image-card">
        <div className="certificate-image-card-head">
          <div>
            <strong>{field.label}</strong>
            <span>{field.helper}</span>
          </div>
          {value ? (
            <button type="button" className="certificate-image-clear" onClick={() => onClear(field.key)}>
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
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onUpload(field.key, file)
            }}
          />
        </label>
      </div>
    )
  }

  function renderJobOfferUploadCard(field) {
    return renderImageCard(field, jobOfferDraft[field.key], handleJobOfferImageUpload, clearJobOfferImageField)
  }

  async function handleExportPDF() {
    const stage = document.querySelector('.job-offer-stage')
    if (!stage) {
      onNotice('Could not find the job offer canvas.')
      return
    }

    setExporting(true)
    onNotice('Preparing job offer PDF...')

    try {
      await document.fonts?.ready
      
      const images = Array.from(stage.querySelectorAll('img'))
      await Promise.all(
        images.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve()
          return new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true })
            img.addEventListener('error', resolve, { once: true })
          })
        }),
      )

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

      const stageBounds = stage.getBoundingClientRect()

      const canvas = await html2canvas(stage, {
        // preserve transparency so cloned page background matches the preview
        backgroundColor: null,
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        width: stageBounds.width,
        height: stageBounds.height,
        onclone: (clonedDocument) => {
          if (clonedDocument.body) {
            clonedDocument.body.style.margin = '0'
            // keep the cloned body transparent so the cloned page's own background shows through
            clonedDocument.body.style.backgroundColor = 'transparent'
          }

          const clonedStage = clonedDocument.querySelector('.job-offer-stage')
          if (clonedStage) {
            clonedStage.style.width = `${stageBounds.width}px`
            clonedStage.style.maxWidth = `${stageBounds.width}px`
            clonedStage.style.height = `${stageBounds.height}px`
            clonedStage.style.backgroundColor = '#f5f5f4'
            clonedStage.style.overflow = 'visible'
            clonedStage.style.transform = 'none'
            clonedStage.classList.add('is-exporting')
              // copy visible text and images into the cloned stage so html2canvas captures them
              try {
                syncJobOfferExportClone(stage, clonedStage)
              } catch (e) {
                // ignore
              }
            
            const clonedBody = clonedStage.querySelector('.job-offer-body')
            if (clonedBody) {
              clonedBody.style.height = 'auto'
              clonedBody.style.overflow = 'visible'
            }

            const clonedBodyInner = clonedStage.querySelector('.job-offer-body-inner')
            if (clonedBodyInner) {
              clonedBodyInner.style.transform = 'none'
              clonedBodyInner.style.overflow = 'visible'
            }

            const textBlocks = clonedStage.querySelectorAll('.job-offer-text-block')
            textBlocks.forEach((block) => {
              block.style.display = 'block'
              block.style.visibility = 'visible'
              block.style.opacity = '1'
            })

            const clonedPage = clonedStage.querySelector('.job-offer-page')
            if (clonedPage) {
              try {
                const origPage = stage.querySelector('.job-offer-page')
                clonedPage.style.background = origPage?.style.background || window.getComputedStyle(origPage).background || '#f5f5f4'
              } catch (e) {
                clonedPage.style.background = `url('${JOB_OFFER_TEMPLATE_IMAGE}') center top / cover no-repeat, #f5f5f4`
              }
              clonedPage.style.width = `${stageBounds.width}px`
              clonedPage.style.height = `${stageBounds.height}px`
              clonedPage.style.overflow = 'visible'
            }
          }
        },
      })

      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Preserve aspect ratio: scale the captured stage to fit inside the PDF page
      const ratioX = pageWidth / stageBounds.width
      const ratioY = pageHeight / stageBounds.height
      const scaleFactor = Math.min(ratioX, ratioY)
      const targetWidth = Math.round(stageBounds.width * scaleFactor)
      const targetHeight = Math.round(stageBounds.height * scaleFactor)
      const offsetX = Math.round((pageWidth - targetWidth) / 2)
      const offsetY = Math.round((pageHeight - targetHeight) / 2)

      pdf.addImage(imageData, 'PNG', offsetX, offsetY, targetWidth, targetHeight)
      // Draw selectable/searchable text using the same mapping used for the image
      addJobOfferTextLayer(pdf, stage, stageBounds, targetWidth, targetHeight, offsetX, offsetY)
      pdf.save('brightpath-job-offer.pdf')
      
      onNotice('Job offer PDF downloaded successfully!')
    } catch (error) {
      console.error('[JobOfferBuilder] PDF export failed:', error)
      onNotice('Could not generate the job offer PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  function handleCopySummary() {
    const lines = [
      `Offer reference: ${jobOfferDraft.offer_reference || 'Not set'}`,
      `Subject heading: ${jobOfferDraft.subject_heading || 'Not set'}`,
      `Recipient block: ${jobOfferDraft.recipient_block || 'Not set'}`,
      `Offer body: ${jobOfferDraft.offer_body || 'Not set'}`,
      `Job details: ${jobOfferDraft.job_details || 'Not set'}`,
      `Sign-off: ${jobOfferDraft.signoff || 'Not set'}`,
      `Footer: ${jobOfferDraft.footer_text || 'Not set'}`,
    ]
    
    const copyOperation = navigator.clipboard?.writeText(lines.join('\n'))
    if (copyOperation?.then) {
      copyOperation.then(
        () => onNotice('Job offer summary copied to clipboard.'),
        () => onNotice('Copy failed. You can still print to PDF.')
      )
    } else {
      onNotice('Copy failed. You can still print to PDF.')
    }
  }

  function handleReset() {
    setJobOfferDraft(createBlankJobOfferRecord())
    onNotice('New job offer preview started.')
  }

  return (
    <div className="certificate-builder-layout">
      <form className="certificate-builder-form" onSubmit={(e) => e.preventDefault()}>
        <div className="certificate-form-actions">
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleReset}>
            <Plus size={16} />
            New Job Offer
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleCopySummary}>
            Copy Summary
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleExportPDF} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Creating PDF...' : 'Download PDF'}
          </button>
        </div>

        <div className="certificate-form-grid work-permit-form-grid">
          <label className="admin-field admin-field-full">
            <span>Offer reference</span>
            <textarea
              rows="4"
              value={jobOfferDraft.offer_reference}
              onChange={(event) => updateJobOfferField('offer_reference', event.target.value)}
            />
          </label>
          
          <label className="admin-field admin-field-full">
            <span>Recipient block</span>
            <textarea
              rows="5"
              value={jobOfferDraft.recipient_block}
              onChange={(event) => updateJobOfferField('recipient_block', event.target.value)}
            />
          </label>
          
          <label className="admin-field">
            <span>Subject heading</span>
            <input
              type="text"
              value={jobOfferDraft.subject_heading}
              onChange={(event) => updateJobOfferField('subject_heading', event.target.value)}
            />
          </label>

          <div className="certificate-image-grid">
            {JOB_OFFER_IMAGE_FIELDS.map((field) => renderJobOfferUploadCard(field))}
          </div>

          <label className="admin-field admin-field-full">
            <span>Offer body</span>
            <textarea
              rows="8"
              value={jobOfferDraft.offer_body}
              onChange={(event) => updateJobOfferField('offer_body', event.target.value)}
            />
          </label>
          
          <label className="admin-field admin-field-full">
            <span>Job details</span>
            <textarea
              rows="8"
              value={jobOfferDraft.job_details}
              onChange={(event) => updateJobOfferField('job_details', event.target.value)}
            />
          </label>
          
          <label className="admin-field admin-field-full">
            <span>Sign-off block</span>
            <textarea
              rows="6"
              value={jobOfferDraft.signoff}
              onChange={(event) => updateJobOfferField('signoff', event.target.value)}
            />
          </label>

          <label className="admin-field admin-field-full">
            <span>Signature label</span>
            <textarea
              rows="3"
              value={jobOfferDraft.signature_label}
              onChange={(event) => updateJobOfferField('signature_label', event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Signature name</span>
            <input
              type="text"
              value={jobOfferDraft.signature_name}
              onChange={(event) => updateJobOfferField('signature_name', event.target.value)}
            />
          </label>

          <div className="admin-field admin-field-full signature-pad-field">
            <span>Draw Signature</span>
            <div className="signature-pad-wrap">
              <canvas
                ref={signatureCanvasRef}
                className="signature-pad-canvas"
                width="600"
                height="180"
                onPointerDown={handleSignaturePointerDown}
                onPointerMove={handleSignaturePointerMove}
                onPointerUp={handleSignaturePointerUp}
                onPointerCancel={handleSignaturePointerUp}
                onPointerLeave={handleSignaturePointerUp}
              />
            </div>
            <div className="signature-pad-actions">
              <button type="button" className="admin-btn admin-btn-soft" onClick={clearSignatureCanvas}>
                <X size={16} />
                Clear
              </button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={commitSignatureCanvas}>
                Use Drawing
              </button>
            </div>
            <small>Draw your signature here, or use the upload card above if you already have one saved.</small>
          </div>

          <label className="admin-field">
            <span>Applicant label</span>
            <input
              type="text"
              value={jobOfferDraft.applicant_label}
              onChange={(event) => updateJobOfferField('applicant_label', event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Helpline text</span>
            <input
              type="text"
              value={jobOfferDraft.helpline_text}
              onChange={(event) => updateJobOfferField('helpline_text', event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Canada mark</span>
            <input
              type="text"
              value={jobOfferDraft.canada_mark_text}
              onChange={(event) => updateJobOfferField('canada_mark_text', event.target.value)}
            />
          </label>

          <label className="admin-field admin-field-full">
            <span>Small print</span>
            <textarea
              rows="2"
              value={jobOfferDraft.small_print_text}
              onChange={(event) => updateJobOfferField('small_print_text', event.target.value)}
            />
          </label>
          
          <label className="admin-field admin-field-full">
            <span>Footer text</span>
            <textarea
              rows="3"
              value={jobOfferDraft.footer_text}
              onChange={(event) => updateJobOfferField('footer_text', event.target.value)}
            />
          </label>
        </div>
      </form>

      <aside className="certificate-builder-preview">
        <div className="job-offer-preview">
          <div className="job-offer-stage">
            <div
              className="job-offer-page"
              style={{
                '--job-offer-page-bg': '#f5f5f4',
                background: `url('${JOB_OFFER_TEMPLATE_IMAGE}') center top / cover no-repeat, var(--job-offer-page-bg)`,
              }}
            >
            <img
              className="job-offer-header-image"
              src={JOB_OFFER_TEMPLATE_IMAGE}
              alt=""
              aria-hidden="true"
              crossOrigin="anonymous"
            />
            <div className="job-offer-watermark" aria-hidden="true">
              <div className="job-offer-watermark-ring" />
              <div className="job-offer-watermark-text">The Cardinal Residence</div>
            </div>

            <div className={`job-offer-company-logo${jobOfferPreview.company_logo_url ? ' has-image' : ''}`}>
              {jobOfferPreview.company_logo_url ? (
                <img
                  src={jobOfferPreview.company_logo_url}
                  alt="Company logo"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>Company logo</span>
              )}
            </div>

            <div className="job-offer-top-row">
              <div className="job-offer-meta">
                <div className="job-offer-reference">{jobOfferPreview.offer_reference}</div>
              </div>
            </div>

            <div className="job-offer-headshot">
              <div className={`job-offer-headshot-frame${jobOfferPreview.applicant_photo_url ? ' has-image' : ''}`}>
                {jobOfferPreview.applicant_photo_url ? (
                  <img
                    className="job-offer-headshot-image"
                    src={jobOfferPreview.applicant_photo_url}
                    alt="Applicant"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="job-offer-headshot-silhouette" />
                )}
              </div>
            </div>

              <div className="job-offer-heading-block">
                <div className="job-offer-heading">{jobOfferPreview.subject_heading}</div>
              </div>

              <div className="job-offer-body">
                <div className="job-offer-body-inner">
                  {renderJobOfferTextBlocks(jobOfferPreview.recipient_block, 'recipient-block')}
                  {renderJobOfferTextBlocks(jobOfferPreview.offer_body, 'offer-body')}
                  {renderJobOfferTextBlocks(jobOfferPreview.job_details, 'job-details')}
                  {renderJobOfferTextBlocks(jobOfferPreview.signoff, 'signoff')}
                  {renderJobOfferTextBlocks(jobOfferPreview.footer_text, 'footer-text')}
                </div>
              </div>

            <div className="job-offer-signature-area">
              <div className="job-offer-signature-column">
                  <div className="job-offer-signature-label">
                    {jobOfferPreview.signature_label}
                  </div>
                  <div className={`job-offer-signature-line${jobOfferPreview.signature_image_url ? ' has-image' : ''}`}>
                    {jobOfferPreview.signature_image_url ? (
                      <img
                        className="job-offer-signature-image"
                        src={jobOfferPreview.signature_image_url}
                        alt="Digital signature"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="job-offer-script-signature">H</span>
                    )}
                  </div>
                  <div className="job-offer-signature-name">{jobOfferPreview.signature_name}</div>
                </div>

                <div className="job-offer-applicant-signature">
                  <div className="job-offer-applicant-line" />
                  <div className="job-offer-applicant-label">{jobOfferPreview.applicant_label}</div>
                </div>

                <div className={`job-offer-stamp${jobOfferPreview.stamp_image_url ? ' has-image' : ''}`}>
                  <div className={`job-offer-stamp-inner${jobOfferPreview.stamp_image_url ? ' has-image' : ''}`}>
                    {jobOfferPreview.stamp_image_url ? (
                      <img
                        className="job-offer-stamp-image"
                        src={jobOfferPreview.stamp_image_url}
                        alt="Stamp"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <>
                        <span className="job-offer-stamp-title">RECEIVED</span>
                        <span className="job-offer-stamp-date">DATE--/--/--</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="job-offer-footer">
                <div className="job-offer-helpline">{jobOfferPreview.helpline_text}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="certificate-records-panel">
          <div className="admin-panel-card-header compact">
            <div>
              <h3>Job Offer Preview</h3>
              <p>Edit the fields on the left to update the preview. Click "Download PDF" to export.</p>
            </div>
          </div>
          <div className="certificate-record-list">
            <div className="certificate-record-item active">
              <div>
                <strong>Current Job Offer</strong>
                <span>{jobOfferDraft.subject_heading || 'No subject set'}</span>
                <small>Ready for PDF export</small>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default JobOfferBuilder

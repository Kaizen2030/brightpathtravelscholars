import { useEffect, useMemo, useState } from 'react'
import { Copy, Download, GripVertical, Plus, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import './CertificateBuilder.css'

const STORAGE_KEY = 'brightpath-ielts-builder-cache-v2'
const TABLE_NAME = 'ielts_reports'
const IMAGE_BUCKET = 'site-assets'
const TEMPLATE_VERSION = '2026'
const WORK_PERMIT_TEMPLATE_IMAGE = '/documents/work-permit-template-v5.png'

const WORK_PERMIT_DECOR_LINES = [
  { key: 'title_rule', style: { left: '4.4%', top: '31.95%', width: '88.5%' } },
  { key: 'client_rule_top', style: { left: '4.4%', top: '36.11%', width: '89.6%' } },
  { key: 'client_rule_bottom', style: { left: '2.4%', top: '54.31%', width: '85.8%' } },
  { key: 'additional_rule_top', style: { left: '2.4%', top: '58.46%', width: '85.8%' } },
  { key: 'footer_rule', style: { left: '21.5%', top: '96.68%', width: '46.9%' } },
]

const WORK_PERMIT_EDITABLE_FIELDS = [
  { key: 'permit_number', type: 'input', style: { left: '68.19%', top: '8.13%', width: '16.01%', height: '2.01%' } },
  { key: 'uci_application', type: 'textarea', style: { left: '61.47%', top: '19.02%', width: '15.22%', height: '4.11%' } },
  { key: 'work_permit_title', type: 'input', style: { left: '33.35%', top: '29.31%', width: '37.19%', height: '1.79%' } },
  { key: 'top_left', type: 'textarea', style: { left: '4.80%', top: '17.53%', width: '26.88%', height: '7.31%' } },
  { key: 'client_heading', type: 'input', style: { left: '4.50%', top: '30.21%', width: '89.54%', height: '2.01%' } },
  { key: 'client_labels', type: 'textarea', style: { left: '2.49%', top: '37.84%', width: '52.95%', height: '20.83%' } },
  { key: 'client_values', type: 'textarea', style: { left: '56.34%', top: '37.90%', width: '13.62%', height: '14.43%' } },
  { key: 'additional_heading', type: 'input', style: { left: '20.73%', top: '55.49%', width: '32.64%', height: '2.01%' } },
  { key: 'additional_labels', type: 'textarea', style: { left: '5.78%', top: '60.07%', width: '32.19%', height: '14.43%' } },
  { key: 'additional_values', type: 'textarea', style: { left: '42.80%', top: '60.09%', width: '53.17%', height: '14.43%' } },
  { key: 'conditions_heading', type: 'input', style: { left: '6.62%', top: '78.39%', width: '12.60%', height: '2.01%' } },
  { key: 'condition_1', type: 'textarea', style: { left: '7.04%', top: '81.83%', width: '79.64%', height: '1.52%' } },
  { key: 'condition_2', type: 'textarea', style: { left: '7.04%', top: '83.54%', width: '79.64%', height: '2.65%' } },
  { key: 'condition_3', type: 'textarea', style: { left: '7.04%', top: '86.34%', width: '79.64%', height: '2.35%' } },
  { key: 'condition_4', type: 'textarea', style: { left: '7.04%', top: '88.92%', width: '79.64%', height: '1.66%' } },
  { key: 'remarks_heading', type: 'input', style: { left: '7.71%', top: '90.45%', width: '19.20%', height: '1.57%' } },
  { key: 'reentry_text', type: 'textarea', style: { left: '21.47%', top: '93.72%', width: '46.92%', height: '2.40%' } },
  { key: 'footer_text', type: 'textarea', style: { left: '7.00%', top: '96.88%', width: '82.50%', height: '2.60%' } },
  { key: 'footer_code', type: 'input', style: { left: '4.20%', top: '98.74%', width: '12.10%', height: '0.82%' } },
]

const WORK_PERMIT_FIELD_LABELS = {
  permit_number: 'Permit number',
  uci_application: 'UCI / Application block',
  work_permit_title: 'Permit title',
  top_left: 'Name and address block',
  client_heading: 'Client heading',
  client_labels: 'Client labels',
  client_values: 'Client values',
  additional_heading: 'Additional heading',
  additional_labels: 'Additional labels',
  additional_values: 'Additional values',
  conditions_heading: 'Conditions heading',
  condition_1: 'Condition 1',
  condition_2: 'Condition 2',
  condition_3: 'Condition 3',
  condition_4: 'Condition 4',
  remarks_heading: 'Remarks heading',
  reentry_text: 'Re-entry text',
  footer_text: 'Footer legal text',
  footer_code: 'Footer code',
}

const WORK_PERMIT_MOVE_STEPS = [0.05, 0.15, 0.3]
const WORK_PERMIT_GRID_STEPS = [0.1, 0.25, 0.5]
const WORK_PERMIT_CUSTOM_KEY_PREFIX = 'work-permit-custom'

function createInitialWorkPermitFieldPositions() {
  return Object.fromEntries(WORK_PERMIT_EDITABLE_FIELDS.map((field) => [field.key, { ...field.style }]))
}

function createWorkPermitCustomTextItem(kind, index = 0, placement = null) {
  const key = `${WORK_PERMIT_CUSTOM_KEY_PREFIX}-${kind}-${createId()}`
  const hasPlacement = Number.isFinite(placement?.left) && Number.isFinite(placement?.top)
  const baseStyle = hasPlacement
    ? {
        left: formatPercentValue(clampNumber(placement.left, 0, 100)),
        top: formatPercentValue(clampNumber(placement.top, 0, 100)),
        width:
          kind === 'footer'
            ? '82.50%'
            : kind === 'image'
              ? '18.00%'
              : kind === 'text'
                ? '28.00%'
                : '79.64%',
        height:
          kind === 'footer'
            ? '2.35%'
            : kind === 'image'
              ? '12.00%'
              : kind === 'text'
                ? '5.80%'
                : '1.20%',
      }
    : kind === 'footer'
      ? {
          left: '7.00%',
          top: formatPercentValue(97.72 + index * 0.88),
          width: '82.50%',
          height: '1.55%',
        }
      : kind === 'text'
        ? {
            left: '12.00%',
            top: '12.00%',
            width: '28.00%',
            height: '5.80%',
          }
        : kind === 'image'
          ? {
              left: '12.00%',
              top: '20.00%',
              width: '18.00%',
              height: '12.00%',
            }
          : {
              left: '7.04%',
              top: formatPercentValue(90.95 + index * 1.38),
              width: '79.64%',
              height: '1.20%',
            }

  return {
    key,
    kind,
    label:
      kind === 'footer'
        ? `Footer line ${index + 1}`
        : kind === 'text'
          ? `Text box ${index + 1}`
          : kind === 'image'
            ? `Image box ${index + 1}`
            : `Condition line ${index + 1}`,
    type: kind === 'image' ? 'image' : 'textarea',
    value: '',
    src: '',
    style: baseStyle,
  }
}

function parsePercentValue(value) {
  const parsed = Number.parseFloat(`${value}`.replace('%', ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function formatPercentValue(value) {
  return `${value.toFixed(2)}%`
}

function snapPercentValue(value, step) {
  if (!Number.isFinite(step) || step <= 0) return value
  return Math.round(value / step) * step
}

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

function createBlankPermitRecord() {
  return {
    id: createId(),
    ea_number: 'E 12086856989',
    client_number: '11-4120-5426',
    application_number: 'S186308598568',
    ucu_number: '',
    full_name_line: 'RAMNATH BHANDARI',
    family_name: 'BHANDARI',
    given_names: 'RAMNATH',
    address_line1: '34-389 BALMORAL STREET',
    address_line2: 'WINNIPEG MB R3B 2P7',
    country_line: 'CANADA',
    date_of_birth: '14 APR 1994',
    sex: 'MALE',
    country_of_birth: 'NEPAL',
    nationality: 'NEPAL',
    travel_doc: '12474494',
    travel_doc_type: 'PASSPORT',
    date_issued: '08/05/2025',
    expiry_date: '07/05/2027',
    case_type: 'WORK PERMIT TWO YEARS CANADA TORONTO',
    lmia_number: '',
    employer: 'EDEN FOODS COMPANY IN CANADA TORONTO',
    employment_location: 'EDEN FOODS COMPANY IN CANADA',
    occupation: 'FOOD PACKING WORKER',
    in_force_from: '08/05/2025',
    remarks: 'TEMPORARY RESIDENT STATUS MAINTAINED AS PER R183(B)',
    conditions: [
      '1. MUST LEAVE CANADA BY.   2027-05-07',
      '2. NOT VALID FOR EMPLOYMENT IN BUSINESSES RELATED TO THE SEX TRADE SUCH AS STRIP CLUBS, MASSAGE PARLOURS OR ESCORT SERVICES.',
      '3. MAY ACCEPT EMPLOYMENT ON OR OFF CAMPUS IF MEETING ELIGIBILITY CRITERIA AS PER R186(F), (V) OR (W).',
      '. MUST CEASE WORKING IF NO LONGER MEETING THESE CRITERIA',
    ],
    reentry_text: "THIS DOES NOT AUTHORIZE RE-ENTRY/CECI N'AUTORISE PAS LA RE-ENTREE",
  }
}

function buildWorkPermitPreview(record) {
  return {
    ea_number: record.ea_number || 'E 12086856989',
    client_number: record.client_number || '11-4120-5426',
    application_text: record.application_number || 'S186308598568',
    ucu_text: record.ucu_number || '',
    family_name: record.family_name || 'BHANDARI',
    given_names: record.given_names || 'RAMNATH',
    full_name_line:
      record.full_name_line || `${record.given_names || 'RAMNATH'} ${record.family_name || 'BHANDARI'}`.trim(),
    address_line1: record.address_line1 || '34-389 BALMORAL STREET',
    address_line2: record.address_line2 || 'WINNIPEG MB R3B 2P7',
    country_line: record.country_line || 'CANADA',
    date_of_birth: record.date_of_birth || '14 APR 1994',
    sex: record.sex || 'MALE',
    country_of_birth: record.country_of_birth || 'NEPAL',
    nationality: record.nationality || 'NEPAL',
    travel_doc_display: record.travel_doc || '12474494',
    date_issued: record.date_issued || '08/05/2025',
    expiry_date: record.expiry_date || '07/05/2027',
    case_type: record.case_type || 'WORK PERMIT TWO YEARS CANADA TORONTO',
    lmia_number: record.lmia_number || '',
    employer: record.employer || 'EDEN FOODS COMPANY IN CANADA TORONTO',
    employment_location: record.employment_location || 'EDEN FOODS COMPANY IN CANADA',
    occupation: record.occupation || 'FOOD PACKING WORKER',
    in_force_from: record.in_force_from || '08/05/2025',
    conditions:
      Array.isArray(record.conditions) && record.conditions.length
        ? record.conditions
        : [
            '1. MUST LEAVE CANADA BY.   2027-05-07',
            '2. NOT VALID FOR EMPLOYMENT IN BUSINESSES RELATED TO THE SEX TRADE SUCH AS STRIP CLUBS, MASSAGE PARLOURS OR ESCORT SERVICES.',
            '3. MAY ACCEPT EMPLOYMENT ON OR OFF CAMPUS IF MEETING ELIGIBILITY CRITERIA AS PER R186(F), (V) OR (W).',
            '. MUST CEASE WORKING IF NO LONGER MEETING THESE CRITERIA',
          ],
    remarks_display: record.remarks || 'No additional remarks.',
    reentry_text: record.reentry_text || "THIS DOES NOT AUTHORIZE RE-ENTRY/CECI N'AUTORISE PAS LA RE-ENTREE",
  }
}

function getWorkPermitEditableValue(fieldKey, preview) {
  switch (fieldKey) {
    case 'permit_number':
      return preview.ea_number
    case 'uci_application':
      return `UCI NO:${preview.client_number}\nAPPLICATION\nNO:${preview.application_text}`
    case 'work_permit_title':
      return 'WORK PERMIT TWO YEARS CANADA'
    case 'top_left':
      return `${preview.full_name_line}\n${preview.address_line1}\n ${preview.address_line2}\n${preview.country_line}`
    case 'client_heading':
      return 'CLIENT INFORMATION/INFORMATION DU CLIENT'
    case 'client_labels':
      return [
        'Family Name/Nom de Familie:',
        'Given Name(s)/Prénom(s):',
        'Date of Birth/Date de naissance:',
        'Sex/Sexe:',
        'Country of Birth/Pays de naissance:',
        'Country of Citizenship/Citoyenneté:',
        'Travel Doc No./N" du document de voyage:',
      ].join('\n')
    case 'client_values':
      return [
        preview.family_name,
        preview.given_names,
        preview.date_of_birth,
        preview.sex,
        preview.country_of_birth,
        preview.nationality,
        preview.travel_doc_display,
      ].join('\n')
    case 'additional_heading':
      return 'ADDITIONAL INFORMATION/INFORMATION SUPPLÉMENTAIRE'
    case 'additional_labels':
      return [
        'Issue Date/Date',
        "Expiry Date/Date d'expiration:",
        'Case Type/Genre de cas',
        'Work Place Employee',
        ' Company Name',
        'Job Designation',
        'In Force From/En vigueur le:',
      ].join('\n')
    case 'additional_values':
      return [
        preview.date_issued,
        preview.expiry_date,
        preview.case_type,
        preview.employer,
        preview.employment_location,
        preview.occupation,
        preview.in_force_from,
      ].join('\n')
    case 'conditions_heading':
      return 'Conditions:'
    case 'condition_1':
      return Array.isArray(preview.conditions) ? preview.conditions[0] || '' : ''
    case 'condition_2':
      return Array.isArray(preview.conditions) ? preview.conditions[1] || '' : ''
    case 'condition_3':
      return Array.isArray(preview.conditions) ? preview.conditions[2] || '' : ''
    case 'condition_4':
      return Array.isArray(preview.conditions) ? preview.conditions[3] || '' : ''
    case 'remarks_heading':
      return 'Remarks/Observations'
    case 'reentry_text':
      return "***THIS DOES NOT AUTHORIZE RE-ENTRY/CECI N'AUTORISE PAS LA RE-ENTREE***"
    case 'footer_text':
      return "THIS FORM HAS BEEN ESTABLISHED BY THE MINISTER OF IMMIGRATION, REFUGEES AND CITIZENSHIP CANADA - THIS DOCUMENT IS THE PROPERTY OF THE GOVERNMENT OF CANADA.\nFORMULAIRE ÉTABLI PAR LE MINISTRE DE L'IMMIGRATION, RÉFUGIÉS ET CITOYENNETÉ CANADA - LE PRÉSENT DOCUMENT EST LA PROPRIÉTÉ DU GOUVERNEMENT DU CANADA."
    case 'footer_code':
      return 'IMM 1442B (1-2019)'
    default:
      return ''
  }
}

function createBlankWorkPermitTextDraft() {
  const preview = buildWorkPermitPreview(createBlankPermitRecord())

  return {
    permit_number: preview.ea_number,
    uci_application: `UCI NO:${preview.client_number}\nAPPLICATION\nNO:${preview.application_text}`,
    work_permit_title: 'WORK PERMIT TWO YEARS CANADA',
    top_left: `${preview.full_name_line}\n${preview.address_line1}\n ${preview.address_line2}\n${preview.country_line}`,
    client_heading: 'CLIENT INFORMATION/INFORMATION DU CLIENT',
    client_labels: [
      'Family Name/Nom de Familie:',
      'Given Name(s)/Prénom(s):',
      'Date of Birth/Date de naissance:',
      'Sex/Sexe:',
      'Country of Birth/Pays de naissance:',
      'Country of Citizenship/Citoyenneté:',
      'Travel Doc No./N" du document de voyage:',
    ].join('\n'),
    client_values: [
      preview.family_name,
      preview.given_names,
      preview.date_of_birth,
      preview.sex,
      preview.country_of_birth,
      preview.nationality,
      preview.travel_doc_display,
    ].join('\n'),
    additional_heading: 'ADDITIONAL INFORMATION/INFORMATION SUPPLÉMENTAIRE',
    additional_labels: [
      'Issue Date/Date',
      "Expiry Date/Date d'expiration:",
      'Case Type/Genre de cas',
      'Work Place Employee',
      ' Company Name',
      'Job Designation',
      'In Force From/En vigueur le:',
    ].join('\n'),
    additional_values: [
      preview.date_issued,
      preview.expiry_date,
      preview.case_type,
      preview.employer,
      preview.employment_location,
      preview.occupation,
      preview.in_force_from,
    ].join('\n'),
    conditions_heading: 'Conditions:',
    condition_1: Array.isArray(preview.conditions) ? preview.conditions[0] || '' : '',
    condition_2: Array.isArray(preview.conditions) ? preview.conditions[1] || '' : '',
    condition_3: Array.isArray(preview.conditions) ? preview.conditions[2] || '' : '',
    condition_4: Array.isArray(preview.conditions) ? preview.conditions[3] || '' : '',
    remarks_heading: 'Remarks/Observations',
    reentry_text: "***THIS DOES NOT AUTHORIZE RE-ENTRY/CECI N'AUTORISE PAS LA RE-ENTREE***",
    footer_text:
      "THIS FORM HAS BEEN ESTABLISHED BY THE MINISTER OF IMMIGRATION, REFUGEES AND CITIZENSHIP CANADA - THIS DOCUMENT IS THE PROPERTY OF THE GOVERNMENT OF CANADA.\nFORMULAIRE ÉTABLI PAR LE MINISTRE DE L'IMMIGRATION, RÉFUGIÉS ET CITOYENNETÉ CANADA - LE PRÉSENT DOCUMENT EST LA PROPRIÉTÉ DU GOUVERNEMENT DU CANADA.",
    footer_code: 'IMM 1442B (1-2019)',
  }
}

function getWorkPermitTextValueUpdates(record) {
  const preview = buildWorkPermitPreview(record)

  return {
    permit_number: preview.ea_number,
    uci_application: `UCI NO:${preview.client_number}\nAPPLICATION\nNO:${preview.application_text}`,
    top_left: `${preview.full_name_line}\n${preview.address_line1}\n ${preview.address_line2}\n${preview.country_line}`,
    client_values: [
      preview.family_name,
      preview.given_names,
      preview.date_of_birth,
      preview.sex,
      preview.country_of_birth,
      preview.nationality,
      preview.travel_doc_display,
    ].join('\n'),
    additional_values: [
      preview.date_issued,
      preview.expiry_date,
      preview.case_type,
      preview.employer,
      preview.employment_location,
      preview.occupation,
      preview.in_force_from,
    ].join('\n'),
    conditions_body: Array.isArray(preview.conditions) ? preview.conditions.join('\n') : '',
    condition_1: Array.isArray(preview.conditions) ? preview.conditions[0] || '' : '',
    condition_2: Array.isArray(preview.conditions) ? preview.conditions[1] || '' : '',
    condition_3: Array.isArray(preview.conditions) ? preview.conditions[2] || '' : '',
    condition_4: Array.isArray(preview.conditions) ? preview.conditions[3] || '' : '',
    reentry_text: preview.reentry_text,
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
  const [permitDraft, setPermitDraft] = useState(createBlankPermitRecord())
  const [workPermitTextDraft, setWorkPermitTextDraft] = useState(createBlankWorkPermitTextDraft())
  const [workPermitFieldPositions, setWorkPermitFieldPositions] = useState(() => createInitialWorkPermitFieldPositions())
  const [workPermitCustomTextItems, setWorkPermitCustomTextItems] = useState([])
  const [workPermitArrangeMode, setWorkPermitArrangeMode] = useState(false)
  const [selectedWorkPermitField, setSelectedWorkPermitField] = useState(WORK_PERMIT_EDITABLE_FIELDS[0].key)
  const [workPermitDraggingField, setWorkPermitDraggingField] = useState('')
  const [workPermitNudgeStep, setWorkPermitNudgeStep] = useState(0.15)
  const [workPermitSnapEnabled, setWorkPermitSnapEnabled] = useState(true)
  const [workPermitSnapStep, setWorkPermitSnapStep] = useState(0.25)
  const [workPermitExporting, setWorkPermitExporting] = useState(false)
  const [templateMode, setTemplateMode] = useState('ielts')
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
  const permitPreview = useMemo(() => buildWorkPermitPreview(permitDraft), [permitDraft])
  const workPermitOverlayItems = useMemo(
    () => [
      ...WORK_PERMIT_EDITABLE_FIELDS.map((field) => ({
        key: field.key,
        label: WORK_PERMIT_FIELD_LABELS[field.key] || field.key,
        type: field.type,
        style: workPermitFieldPositions[field.key] || field.style,
        value: workPermitTextDraft[field.key] ?? '',
        isCustom: false,
      })),
      ...workPermitCustomTextItems.map((item) => ({
        key: item.key,
        label: item.label,
        type: item.type,
        style: item.style,
        value: item.type === 'image' ? item.src : item.value,
        kind: item.kind,
        isCustom: true,
      })),
    ],
    [workPermitCustomTextItems, workPermitFieldPositions, workPermitTextDraft],
  )
  const workPermitBarcode = useMemo(() => {
    const widths = [3,1,2,1,3,2,1,1,2,3,1,2,1,1,3,1,2,1,2,3,1,1,2,1,3,2,1,3,1,2,1,1,2,3,1,2,1,2,1,3,1,1,2,3,1]
    return widths.map((w, index) => ({
      key: `${index}-${w}`,
      width: w * 1.5,
      height: 20 + (index % 3) * 8,
      filled: index % 2 === 0,
    }))
  }, [])
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

  function updatePermitField(key, value) {
    setPermitDraft((current) => {
      if (key === 'full_name_line') {
        const clean = `${value ?? ''}`.trim()
        const parts = clean.split(/\s+/).filter(Boolean)
        if (parts.length <= 1) {
          return {
            ...current,
            full_name_line: clean,
          }
        }

        return {
          ...current,
          full_name_line: clean,
          given_names: parts.slice(0, -1).join(' '),
          family_name: parts.slice(-1).join(' '),
        }
      }

      const next = { ...current, [key]: value }
      if (key === 'given_names' || key === 'family_name') {
        next.full_name_line = `${key === 'given_names' ? value : current.given_names || ''} ${key === 'family_name' ? value : current.family_name || ''}`.trim()
      }

      const valueUpdates = getWorkPermitTextValueUpdates(next)
      setWorkPermitTextDraft((currentText) => ({ ...currentText, ...valueUpdates }))

      return next
    })
  }

  function getWorkPermitCurrentStyle(fieldKey) {
    const fixedField = WORK_PERMIT_EDITABLE_FIELDS.find((field) => field.key === fieldKey)
    if (fixedField) {
      return workPermitFieldPositions[fieldKey] || fixedField.style
    }

    const customField = workPermitCustomTextItems.find((item) => item.key === fieldKey)
    return customField?.style || null
  }

  function addWorkPermitCustomTextItem(kind) {
    const nextIndex = workPermitCustomTextItems.filter((item) => item.kind === kind).length
    const nextItem = createWorkPermitCustomTextItem(kind, nextIndex)

    setWorkPermitCustomTextItems((current) => [...current, nextItem])
    setWorkPermitArrangeMode(true)
    setSelectedWorkPermitField(nextItem.key)

    return nextItem
  }

  function addWorkPermitCustomImageItem(src) {
    const nextIndex = workPermitCustomTextItems.filter((item) => item.kind === 'image').length
    const nextItem = createWorkPermitCustomTextItem('image', nextIndex)

    nextItem.src = src

    setWorkPermitCustomTextItems((current) => [...current, nextItem])
    setWorkPermitArrangeMode(true)
    setSelectedWorkPermitField(nextItem.key)

    return nextItem
  }

  function updateWorkPermitCustomTextItem(fieldKey, value) {
    setWorkPermitCustomTextItems((current) =>
      current.map((item) =>
        item.key === fieldKey
          ? item.kind === 'image'
            ? { ...item, src: value }
            : { ...item, value }
          : item,
      ),
    )
  }

  function updateWorkPermitFieldPosition(fieldKey, deltaLeft, deltaTop) {
    const fixedField = WORK_PERMIT_EDITABLE_FIELDS.find((field) => field.key === fieldKey)
    const customField = workPermitCustomTextItems.find((item) => item.key === fieldKey)
    const currentStyle = getWorkPermitCurrentStyle(fieldKey)
    if (!currentStyle) return

    const width = parsePercentValue(currentStyle.width)
    const height = parsePercentValue(currentStyle.height)
    const rawLeft = parsePercentValue(currentStyle.left) + deltaLeft
    const rawTop = parsePercentValue(currentStyle.top) + deltaTop
    const snappedLeft = workPermitSnapEnabled ? snapPercentValue(rawLeft, workPermitSnapStep) : rawLeft
    const snappedTop = workPermitSnapEnabled ? snapPercentValue(rawTop, workPermitSnapStep) : rawTop
    const nextLeft = clampNumber(snappedLeft, 0, Math.max(0, 100 - width))
    const nextTop = clampNumber(snappedTop, 0, Math.max(0, 100 - height))

    if (fixedField) {
      setWorkPermitFieldPositions((current) => ({
        ...current,
        [fieldKey]: {
          ...currentStyle,
          left: formatPercentValue(nextLeft),
          top: formatPercentValue(nextTop),
        },
      }))
      return
    }

    if (!customField) return

    setWorkPermitCustomTextItems((current) =>
      current.map((item) =>
        item.key === fieldKey
          ? {
              ...item,
              style: {
                ...item.style,
                left: formatPercentValue(nextLeft),
                top: formatPercentValue(nextTop),
              },
            }
          : item,
      ),
    )
  }

  function removeWorkPermitCustomTextItem(fieldKey) {
    setWorkPermitCustomTextItems((current) => current.filter((item) => item.key !== fieldKey))
    if (selectedWorkPermitField === fieldKey) {
      setSelectedWorkPermitField(WORK_PERMIT_EDITABLE_FIELDS[0].key)
    }
  }

  function clearWorkPermitCustomTextItems() {
    setWorkPermitCustomTextItems([])
    setSelectedWorkPermitField(WORK_PERMIT_EDITABLE_FIELDS[0].key)
  }

  function handleAddWorkPermitImage() {
    const picker = document.createElement('input')
    picker.type = 'file'
    picker.accept = 'image/*'
    picker.onchange = () => {
      const file = picker.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        const src = typeof reader.result === 'string' ? reader.result : ''
        if (!src) return
        addWorkPermitCustomImageItem(src)
      }
      reader.readAsDataURL(file)
    }
    picker.click()
  }

  function handleWorkPermitStageDoubleClick(event) {
    if (!workPermitArrangeMode) return
    if (event.target !== event.currentTarget) return

    const stageRect = event.currentTarget.getBoundingClientRect()
    if (!stageRect) return

    const left = ((event.clientX - stageRect.left) / stageRect.width) * 100
    const top = ((event.clientY - stageRect.top) / stageRect.height) * 100
    addWorkPermitCustomTextItem('text', workPermitCustomTextItems.filter((item) => item.kind === 'text').length, {
      left,
      top,
    })
  }

  function resetWorkPermitLayout() {
    setWorkPermitFieldPositions(createInitialWorkPermitFieldPositions())
    setWorkPermitCustomTextItems([])
    setSelectedWorkPermitField(WORK_PERMIT_EDITABLE_FIELDS[0].key)
    setWorkPermitDraggingField('')
  }

  function beginWorkPermitDrag(event, fieldKey) {
    if (!workPermitArrangeMode) return
    if (event.button != null && event.button !== 0) return

    const stageElement = event.currentTarget.closest('.work-permit-stage')
    const stageRect = stageElement?.getBoundingClientRect()
    const currentStyle = getWorkPermitCurrentStyle(fieldKey)

    if (!stageRect || !currentStyle) return

    event.preventDefault()
    event.stopPropagation()

    setSelectedWorkPermitField(fieldKey)
    setWorkPermitDraggingField(fieldKey)

    const startX = event.clientX
    const startY = event.clientY
    const baseLeft = parsePercentValue(currentStyle.left)
    const baseTop = parsePercentValue(currentStyle.top)
    const width = parsePercentValue(currentStyle.width)
    const height = parsePercentValue(currentStyle.height)

    function updateFromPointer(clientX, clientY) {
      const deltaLeft = ((clientX - startX) / stageRect.width) * 100
      const deltaTop = ((clientY - startY) / stageRect.height) * 100
      const rawLeft = baseLeft + deltaLeft
      const rawTop = baseTop + deltaTop
      const snappedLeft = workPermitSnapEnabled ? snapPercentValue(rawLeft, workPermitSnapStep) : rawLeft
      const snappedTop = workPermitSnapEnabled ? snapPercentValue(rawTop, workPermitSnapStep) : rawTop
      const nextLeft = clampNumber(snappedLeft, 0, Math.max(0, 100 - width))
      const nextTop = clampNumber(snappedTop, 0, Math.max(0, 100 - height))

      setWorkPermitFieldPositions((current) => {
        const existing = current[fieldKey] || currentStyle
        return {
          ...current,
          [fieldKey]: {
            ...existing,
            left: formatPercentValue(nextLeft),
            top: formatPercentValue(nextTop),
          },
        }
      })
    }

    function finishDrag() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
      setWorkPermitDraggingField('')
    }

    function handlePointerMove(moveEvent) {
      moveEvent.preventDefault()
      updateFromPointer(moveEvent.clientX, moveEvent.clientY)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)

    updateFromPointer(event.clientX, event.clientY)
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
    if (templateMode === 'ielts') {
      setDraft(createBlankRecord())
      setNotice('New IELTS applicant started.')
    } else {
      setPermitDraft(createBlankPermitRecord())
      setWorkPermitTextDraft(createBlankWorkPermitTextDraft())
      resetWorkPermitLayout()
      setWorkPermitArrangeMode(false)
      setNotice('New work permit preview started.')
    }
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
    if (templateMode !== 'workpermit') {
      window.print()
      return
    }

    async function exportWorkPermitPdf() {
      const stage = document.querySelector('.work-permit-stage')
      if (!stage) {
        setNotice('Could not find the work permit canvas.')
        return
      }

      try {
        setWorkPermitExporting(true)
        setNotice('Preparing work permit PDF...')

        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

        const canvas = await html2canvas(stage, {
          backgroundColor: null,
          scale: Math.max(2, window.devicePixelRatio || 1),
          useCORS: true,
          allowTaint: false,
        })

        const imageData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'px',
          format: [canvas.width, canvas.height],
          hotfixes: ['px_scaling'],
        })

        pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height)
        pdf.save('brightpath-work-permit.pdf')
        setNotice('Work permit PDF downloaded.')
      } catch (error) {
        console.error('[CertificateBuilder] Work permit PDF export failed:', error)
        setNotice('Could not generate the work permit PDF.')
      } finally {
        setWorkPermitExporting(false)
      }
    }

    exportWorkPermitPdf()
  }

  function handleCopySummary() {
    if (templateMode === 'workpermit') {
      const lines = [
        `Permit No: ${permitDraft.ea_number}`,
        `UCI No: ${permitDraft.client_number}`,
        `Application No: ${permitDraft.application_number}`,
        `Name: ${permitDraft.given_names} ${permitDraft.family_name}`.trim(),
        `Address: ${permitDraft.address_line1}`,
        `${permitDraft.address_line2}`,
        `${permitDraft.country_line}`,
        `Family name: ${permitDraft.family_name}`,
        `Given names: ${permitDraft.given_names}`,
        `DOB: ${permitDraft.date_of_birth}`,
        `Nationality: ${permitDraft.nationality}`,
        `Travel Doc: ${permitDraft.travel_doc}`,
        `Employer: ${permitDraft.employer}`,
        `Occupation: ${permitDraft.occupation}`,
        `Issue Date: ${permitDraft.date_issued}`,
        `Expiry Date: ${permitDraft.expiry_date}`,
      ]
      const copyOperation = navigator.clipboard?.writeText(lines.join('\n'))
      if (copyOperation?.then) {
        copyOperation.then(
          () => setNotice('Work permit summary copied to clipboard.'),
          () => setNotice('Copy failed. You can still print to PDF.'),
        )
      } else {
        setNotice('Copy failed. You can still print to PDF.')
      }
      return
    }

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

  function renderWorkPermitPreview() {
    return (
      <div className="work-permit-preview">
        <div className="work-permit-arrange-toolbar no-print">
          <div className="work-permit-arrange-copy">
            <strong>Arrange layout</strong>
            <span>Choose a field and nudge it without changing the permit background or artwork.</span>
          </div>
          <button
            type="button"
            className={`admin-btn admin-btn-soft work-permit-arrange-toggle${workPermitArrangeMode ? ' is-active' : ''}`}
            onClick={() => {
              if (workPermitArrangeMode) {
                setWorkPermitDraggingField('')
              }
              setWorkPermitArrangeMode((current) => !current)
            }}
          >
            {workPermitArrangeMode ? 'Finish arranging' : 'Arrange text'}
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={resetWorkPermitLayout}>
            Reset positions
          </button>
          <button
            type="button"
            className={`admin-btn admin-btn-soft work-permit-arrange-toggle${workPermitSnapEnabled ? ' is-active' : ''}`}
            onClick={() => setWorkPermitSnapEnabled((current) => !current)}
          >
            {workPermitSnapEnabled ? 'Snap on' : 'Snap off'}
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={() => addWorkPermitCustomTextItem('text')}>
            + Text box
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleAddWorkPermitImage}>
            + Image
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={() => addWorkPermitCustomTextItem('condition')}>
            + Condition line
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={() => addWorkPermitCustomTextItem('footer')}>
            + Footer line
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={clearWorkPermitCustomTextItems}>
            Clear extras
          </button>
          {selectedWorkPermitField.startsWith(WORK_PERMIT_CUSTOM_KEY_PREFIX) ? (
            <button
              type="button"
              className="admin-btn admin-btn-soft"
              onClick={() => removeWorkPermitCustomTextItem(selectedWorkPermitField)}
            >
              Remove selected
            </button>
          ) : null}
          <label className="work-permit-arrange-field">
            <span>Field</span>
            <select value={selectedWorkPermitField} onChange={(event) => setSelectedWorkPermitField(event.target.value)}>
              {workPermitOverlayItems.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="work-permit-arrange-field">
            <span>Grid</span>
            <select value={workPermitSnapStep} onChange={(event) => setWorkPermitSnapStep(Number.parseFloat(event.target.value) || 0.25)}>
              {WORK_PERMIT_GRID_STEPS.map((step) => (
                <option key={step} value={step}>
                  {step.toFixed(2)}%
                </option>
              ))}
            </select>
          </label>
          <label className="work-permit-arrange-field">
            <span>Step</span>
            <select
              value={workPermitNudgeStep}
              onChange={(event) => setWorkPermitNudgeStep(Number.parseFloat(event.target.value) || 0.15)}
            >
              {WORK_PERMIT_MOVE_STEPS.map((step) => (
                <option key={step} value={step}>
                  {step.toFixed(2)}%
                </option>
              ))}
            </select>
          </label>
          <div className="work-permit-nudge-pad">
            <button type="button" className="work-permit-nudge-btn" onClick={() => updateWorkPermitFieldPosition(selectedWorkPermitField, 0, -workPermitNudgeStep)}>
              Up
            </button>
            <div className="work-permit-nudge-middle">
              <button type="button" className="work-permit-nudge-btn" onClick={() => updateWorkPermitFieldPosition(selectedWorkPermitField, -workPermitNudgeStep, 0)}>
                Left
              </button>
              <button type="button" className="work-permit-nudge-btn" onClick={() => updateWorkPermitFieldPosition(selectedWorkPermitField, workPermitNudgeStep, 0)}>
                Right
              </button>
            </div>
            <button type="button" className="work-permit-nudge-btn" onClick={() => updateWorkPermitFieldPosition(selectedWorkPermitField, 0, workPermitNudgeStep)}>
              Down
            </button>
          </div>
        </div>
        <div
          className={`work-permit-stage${workPermitArrangeMode ? ' is-arrange-mode' : ''}${workPermitExporting ? ' is-exporting' : ''}`}
          onDoubleClick={handleWorkPermitStageDoubleClick}
        >
          <img className="work-permit-preview-image" src={WORK_PERMIT_TEMPLATE_IMAGE} alt="Work permit template preview" />
          <div className="work-permit-rules" aria-hidden="true">
            {WORK_PERMIT_DECOR_LINES.map((line) => (
              <span key={line.key} className={`work-permit-rule is-${line.key}`} style={line.style} />
            ))}
          </div>
          <div className="work-permit-overlay" aria-label="Editable work permit fields">
            {workPermitOverlayItems.map((item) => {
              const value = item.value ?? ''
              const style = item.style
              const kindClass = item.isCustom ? ` is-custom-text is-${item.kind}` : ''

              return (
                <div
                  key={item.key}
                  className={`work-permit-hotspot is-${item.type} is-${item.key}${kindClass}${selectedWorkPermitField === item.key ? ' is-selected' : ''}${workPermitDraggingField === item.key ? ' is-dragging' : ''}`}
                  style={style}
                  onPointerDown={
                    workPermitArrangeMode
                      ? (event) => {
                          beginWorkPermitDrag(event, item.key)
                        }
                      : undefined
                  }
                  onClick={() => {
                    if (workPermitArrangeMode) {
                      setSelectedWorkPermitField(item.key)
                    }
                  }}
                >
                  {workPermitArrangeMode ? (
                    <button
                      type="button"
                      className="work-permit-drag-handle"
                      aria-label={`Move ${item.label}`}
                      onPointerDown={(event) => beginWorkPermitDrag(event, item.key)}
                    >
                      <GripVertical size={14} />
                    </button>
                  ) : null}
                  {item.type === 'textarea' ? (
                    <textarea
                      aria-label={item.key}
                      spellCheck={false}
                      value={value}
                      onChange={(event) => {
                        if (item.isCustom) {
                          updateWorkPermitCustomTextItem(item.key, event.target.value)
                          return
                        }

                        setWorkPermitTextDraft((current) => ({ ...current, [item.key]: event.target.value }))
                      }}
                    />
                  ) : item.type === 'image' ? (
                    value ? (
                      <img className="work-permit-freeform-image" src={value} alt={item.label} draggable={false} />
                    ) : (
                      <div className="work-permit-freeform-image-placeholder">{item.label}</div>
                    )
                  ) : (
                    <input
                      aria-label={item.key}
                      spellCheck={false}
                      value={value}
                      onChange={(event) => setWorkPermitTextDraft((current) => ({ ...current, [item.key]: event.target.value }))}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )

    return (
      <div className="work-permit-preview">
        <div className="work-permit-page">
          <div className="top-header">
            <div className="header-left">
              <div className="canada-banner">CANADA</div>
            </div>

            <div className="header-center">
              <div className="canada-crest">
                <div className="crest-symbol" aria-hidden="true">ðŸ‡¨ðŸ‡¦</div>
              </div>
            </div>

            <div className="header-right">
              <div className="permit-number-box">{permitPreview.ea_number}</div>
              <div className="client-number">UCI NO: {permitPreview.client_number}</div>
              <div className="barcode-wrap">
                {workPermitBarcode.map((bar) => (
                  <span
                    key={bar.key}
                    style={{
                      width: `${bar.width}px`,
                      height: `${bar.height}px`,
                      background: bar.filled ? '#111' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="header-subtext">
            <span>Immigration, Refugees and Citizenship Canada</span>
            <span>Immigration, RÃ©fugiÃ©s et citoyennetÃ© Canada</span>
          </div>

          <div className="permit-meta-row">
            <div className="permit-meta-left">
              <div className="permit-meta-line">{permitPreview.full_name_line}</div>
              <div className="permit-meta-line">{permitPreview.address_line1}</div>
              <div className="permit-meta-line">{permitPreview.address_line2}</div>
              <div className="permit-meta-pill">{permitPreview.country_line}</div>
            </div>
            <div className="permit-meta-right">
              <div className="permit-meta-line">APPLICATION NO: {permitPreview.application_text}</div>
              <div className="permit-meta-line">UCU/UC: {permitPreview.ucu_text}</div>
            </div>
          </div>

          <div className="permit-title">WORK PERMIT/PERMIS DE TRAVAIL</div>

          <div className="section-label">CLIENT INFORMATION/INFORMATION DU CLIENT</div>
          <table>
            <tbody>
              <tr>
                <td style={{ width: '38%' }}>
                  <span className="lbl">Family name / Nom de famille</span>
                  <span className="val">{permitPreview.family_name}</span>
                </td>
                <td>
                  <span className="lbl">Given names / PrÃ©nom(s)</span>
                  <span className="val">{permitPreview.given_names}</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="lbl">Date of birth / Date de naissance</span>
                  <span className="val">{permitPreview.date_of_birth}</span>
                  <span className="val-small">(yyyy/mm/dd - aaaa/mm/jj)</span>
                </td>
                <td>
                  <span className="lbl">Sex / Sexe</span>
                  <span className="val">{permitPreview.sex}</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="lbl">Country of birth / Pays de naissance</span>
                  <span className="val">{permitPreview.country_of_birth}</span>
                </td>
                <td>
                  <span className="lbl">Country of citizenship / Citoyenneté</span>
                  <span className="val">{permitPreview.nationality}</span>
                </td>
              </tr>
              <tr>
                <td colSpan="2">
                  <span className="lbl">Travel document number / NumÃ©ro du document de voyage</span>
                  <span className="val" style={{ whiteSpace: 'pre-wrap' }}>
                    {permitPreview.travel_doc_display}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="section-label">ADDITIONAL INFORMATION / INFORMATION SUPPLÃ‰MENTAIRE</div>
          <table>
            <tbody>
              <tr>
                <td style={{ width: '38%' }}>
                  <span className="lbl">Date issued / DÃ©livrÃ© le</span>
                  <span className="val">{permitPreview.date_issued}</span>
                  <span className="val-small">(yyyy/mm/dd - aaaa/mm/jj)</span>
                </td>
                <td>
                  <span className="lbl">Expiry date / Date d'expiration</span>
                  <span className="val">{permitPreview.expiry_date}</span>
                  <span className="val-small">(yyyy/mm/dd - aaaa/mm/jj)</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="lbl">Case type / Type de dossier</span>
                  <span className="val">{permitPreview.case_type}</span>
                </td>
                <td>
                  <span className="lbl">LMIA or exempt no. / NÂ° d'EIMT ou de dispense</span>
                  <span className="val">{permitPreview.lmia_number}</span>
                </td>
              </tr>
              <tr>
                <td colSpan="2">
                  <span className="lbl">Employer / Employeur</span>
                  <span className="val">{permitPreview.employer}</span>
                </td>
              </tr>
              <tr>
                <td colSpan="2">
                  <span className="lbl">Employment location / Emplacement de l'emploi</span>
                  <span className="val">{permitPreview.employment_location}</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="lbl">Occupation / Profession</span>
                  <span className="val">{permitPreview.occupation}</span>
                </td>
                <td>
                  <span className="lbl">In force from / En vigueur le</span>
                  <span className="val">{permitPreview.in_force_from}</span>
                  <span className="val-small">(yyyy/mm/dd - aaaa/mm/jj)</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="conditions-box">
            <div className="conditions-title">Conditions / Conditions</div>
            {permitPreview.conditions.map((condition, index) => (
              <div key={index} className="cond-item">
                {condition}
              </div>
            ))}
          </div>

          <div className="remarks-box">
            <div className="remarks-title">Remarks / Observations</div>
            <div className="remarks-text">{permitPreview.remarks_display}</div>
          </div>

          <div className="reentry">{permitPreview.reentry_text}</div>

          <div className="footer-legal">
            THIS FORM HAS BEEN ESTABLISHED BY THE MINISTER OF IMMIGRATION, REFUGEES AND CITIZENSHIP CANADA. THIS DOCUMENT IS THE PROPERTY OF THE GOVERNMENT OF CANADA.
            <br />FORMULAIRE Ã‰TABLI PAR LE MINISTRE DE L'IMMIGRATION, RÃ‰FUGIÃ‰S ET CITOYENNETÃ‰ CANADA. LE PRÃ‰SENT DOCUMENT EST LA PROPRIÃ‰TÃ‰ DU GOUVERNEMENT DU CANADA.
          </div>

          <div className="canada-logo-row">
            <div className="canada-logo">
              Canad<span>Ã¤</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="admin-panel-card certificate-builder-shell">
      <div className="admin-panel-card-header certificate-builder-header">
        <div>
          <h2>{templateMode === 'ielts' ? 'IELTS Builder' : 'Work Permit Preview'}</h2>
          <p>
            {templateMode === 'ielts'
              ? 'Shared applicant report generator with live preview and print-to-PDF export.'
              : 'Canada work permit layout wired into the admin page with the same visual background as the PDF sample.'}
          </p>
          <div className="certificate-builder-template-tabs">
            <button
              type="button"
              className={`template-tab${templateMode === 'ielts' ? ' active' : ''}`}
              onClick={() => setTemplateMode('ielts')}
            >
              IELTS
            </button>
            <button
              type="button"
              className={`template-tab${templateMode === 'workpermit' ? ' active' : ''}`}
              onClick={() => setTemplateMode('workpermit')}
            >
              Work Permit
            </button>
          </div>
        </div>
        <div className="certificate-builder-actions">
          <span className="certificate-builder-storage">{storageBadge}</span>
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleCopySummary}>
            <Copy size={16} />
            Copy Summary
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={handlePrint} disabled={workPermitExporting}>
            <Download size={16} />
            {workPermitExporting ? 'Creating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <p className="certificate-builder-warning">
        This layout is for Brightpath internal use only. It is clearly labeled and styled as a custom report, not an
        official certificate.
      </p>

      {notice ? <p className="certificate-builder-status">{notice}</p> : null}

      <div className="certificate-builder-layout">
        <form className="certificate-builder-form" onSubmit={templateMode === 'ielts' ? handleSave : (event) => event.preventDefault()}>
          <div className="certificate-form-actions">
            <button type="button" className="admin-btn admin-btn-soft" onClick={handleReset}>
              <Plus size={16} />
              {templateMode === 'ielts' ? 'New Applicant' : 'New Work Permit'}
            </button>
            {templateMode === 'ielts' ? (
              <>
                <button type="button" className="admin-btn admin-btn-soft" onClick={handleDuplicate}>
                  <RotateCcw size={16} />
                  Duplicate
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </>
            ) : null}
          </div>

          {templateMode === 'ielts' ? (
            <>
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
            </>
          ) : (
            <div className="certificate-form-grid work-permit-form-grid">
              <label className="admin-field">
                <span>Permit No.</span>
                <input type="text" value={permitDraft.ea_number} onChange={(event) => updatePermitField('ea_number', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>UCI No.</span>
                <input type="text" value={permitDraft.client_number} onChange={(event) => updatePermitField('client_number', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Application No.</span>
                <input type="text" value={permitDraft.application_number} onChange={(event) => updatePermitField('application_number', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Family name / Nom</span>
                <input type="text" value={permitDraft.family_name} onChange={(event) => updatePermitField('family_name', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Given names / PrÃ©nom(s)</span>
                <input type="text" value={permitDraft.given_names} onChange={(event) => updatePermitField('given_names', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Address Line 1</span>
                <input type="text" value={permitDraft.address_line1 || ''} onChange={(event) => updatePermitField('address_line1', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Address Line 2</span>
                <input type="text" value={permitDraft.address_line2 || ''} onChange={(event) => updatePermitField('address_line2', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Country</span>
                <input type="text" value={permitDraft.country_line || ''} onChange={(event) => updatePermitField('country_line', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Date of Birth</span>
                <input type="text" value={permitDraft.date_of_birth} onChange={(event) => updatePermitField('date_of_birth', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Sex</span>
                <input type="text" value={permitDraft.sex} onChange={(event) => updatePermitField('sex', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Country of Birth</span>
                <input type="text" value={permitDraft.country_of_birth} onChange={(event) => updatePermitField('country_of_birth', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Nationality</span>
                <input type="text" value={permitDraft.nationality} onChange={(event) => updatePermitField('nationality', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Travel Doc No</span>
                <input type="text" value={permitDraft.travel_doc} onChange={(event) => updatePermitField('travel_doc', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Document Type</span>
                <input type="text" value={permitDraft.travel_doc_type} onChange={(event) => updatePermitField('travel_doc_type', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Date Issued</span>
                <input type="text" value={permitDraft.date_issued} onChange={(event) => updatePermitField('date_issued', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Expiry Date</span>
                <input type="text" value={permitDraft.expiry_date} onChange={(event) => updatePermitField('expiry_date', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Case Type</span>
                <input type="text" value={permitDraft.case_type} onChange={(event) => updatePermitField('case_type', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>LMIA / Exempt No.</span>
                <input type="text" value={permitDraft.lmia_number} onChange={(event) => updatePermitField('lmia_number', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Employer</span>
                <input type="text" value={permitDraft.employer} onChange={(event) => updatePermitField('employer', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Employment Location</span>
                <input type="text" value={permitDraft.employment_location} onChange={(event) => updatePermitField('employment_location', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Occupation</span>
                <input type="text" value={permitDraft.occupation} onChange={(event) => updatePermitField('occupation', event.target.value)} />
              </label>
              <label className="admin-field">
                <span>In Force From</span>
                <input type="text" value={permitDraft.in_force_from} onChange={(event) => updatePermitField('in_force_from', event.target.value)} />
              </label>
              <label className="admin-field admin-field-full">
                <span>Remarks</span>
                <textarea rows="3" value={permitDraft.remarks} onChange={(event) => updatePermitField('remarks', event.target.value)} />
              </label>
            </div>
          )}
        </form>

        <aside className="certificate-preview-column">
          {templateMode === 'ielts' ? (
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
          ) : renderWorkPermitPreview()}

          {templateMode === 'ielts' ? (
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
          ) : (
            <div className="certificate-records-panel">
              <div className="admin-panel-card-header compact">
                <div>
                  <h3>Work Permit Preview</h3>
                  <p>This mode shows the work permit layout and does not store records in Supabase.</p>
                </div>
              </div>
              <p className="admin-empty">
                Use the form above to update the work permit preview data.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

export default CertificateBuilder




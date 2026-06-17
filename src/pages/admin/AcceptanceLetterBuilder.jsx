import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Download, Plus, Search, Upload, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import { getAllUniversities, getUniversityBySlug, getUniversityByName } from './acceptance-letters/universities'
import './CertificateBuilder.css'
import './AcceptanceLetterBuilder.css'

const IMAGE_BUCKET = 'site-assets'
const TEMPLATE_VERSION = '2026'

const ACCEPTANCE_IMAGE_FIELDS = [
  { key: 'university_logo_url', label: 'University Logo', helper: 'Shown in the header brand box.', fit: 'contain' },
  { key: 'seal_image_url', label: 'University Seal', helper: 'Shown beside the signature block.', fit: 'contain' },
  { key: 'stamp_image_url', label: 'Admission Stamp', helper: 'Shown in the lower-right stamp area.', fit: 'contain' },
  { key: 'signature_image_url', label: 'Registrar Signature', helper: 'Shown on the signature line.', fit: 'contain' },
]

const DESTINATION_ORDER = ['Canada', 'United Kingdom', 'United States', 'Australia', 'Dubai/UAE', 'Europe']

function buildUniversitySelectionDirectory() {
  return getAllUniversities()
    .map((item) => ({
      ...item,
      destinationSlug: item.destinationSlug || slugify(item.destination),
      city: item.city || '',
      type: item.layoutName || item.presentationLabel || item.type || 'Study abroad university',
    }))
    .sort((left, right) => {
      const destinationDelta = (DESTINATION_ORDER.indexOf(left.destination) + 1 || 999) - (DESTINATION_ORDER.indexOf(right.destination) + 1 || 999)
      if (destinationDelta !== 0) return destinationDelta
      return left.name.localeCompare(right.name)
    })
}

const ACCEPTANCE_UNIVERSITY_OPTIONS = buildUniversitySelectionDirectory()

const PRESENTATION_FAMILIES = {
  canada: {
    family: 'research',
    badge: 'Canadian admissions format',
    accent: '#002f6c',
    accentSoft: '#e7effb',
    accentInk: '#0f2442',
    pageBg: '#f6f9fd',
    pageInk: '#111827',
  },
  uk: {
    family: 'heritage',
    badge: 'British collegiate format',
    accent: '#112f4a',
    accentSoft: '#eef3fb',
    accentInk: '#0f2237',
    pageBg: '#fcfbf8',
    pageInk: '#1c1b1f',
  },
  usa: {
    family: 'ivy',
    badge: 'US academic format',
    accent: '#7c1022',
    accentSoft: '#fbebee',
    accentInk: '#4d0a15',
    pageBg: '#fbf9f6',
    pageInk: '#1d1b1f',
  },
  australia: {
    family: 'sunlit',
    badge: 'Australian campus format',
    accent: '#0f5b9c',
    accentSoft: '#ebf4fb',
    accentInk: '#173d61',
    pageBg: '#fafaf7',
    pageInk: '#1c1b1f',
  },
  dubai: {
    family: 'diplomatic',
    badge: 'Dubai and UAE format',
    accent: '#8a5a2b',
    accentSoft: '#f5eadf',
    accentInk: '#553315',
    pageBg: '#fcf8f2',
    pageInk: '#1f1c19',
  },
  europe: {
    family: 'continental',
    badge: 'European academic format',
    accent: '#395c73',
    accentSoft: '#eef3f5',
    accentInk: '#20323f',
    pageBg: '#fbfaf8',
    pageInk: '#1d1b1f',
  },
  default: {
    family: 'editorial',
    badge: 'Brightpath admissions format',
    accent: '#27415e',
    accentSoft: '#eef2f6',
    accentInk: '#173044',
    pageBg: '#faf9f5',
    pageInk: '#1d1b1f',
  },
}

const UNIVERSITY_PRESENTATION_OVERRIDES = {
  'university-of-toronto': {
    variant: 'crest',
    accent: '#ce1126',
    accentSoft: '#f6e8ea',
    accentInk: '#2d0f19',
    kicker: 'Official Admission',
  },
  'university-of-british-columbia': {
    variant: 'ubc-letter',
    accent: '#00677f',
    accentSoft: '#dbeff4',
    accentInk: '#0c2b39',
    kicker: 'Admission Notice',
    layoutName: 'UBC Offer Letter',
  },
  'mcgill-university': {
    variant: 'mcgill-letter',
    accent: '#c8102e',
    accentSoft: '#f7e3e5',
    accentInk: '#2d121c',
    kicker: 'Offer of Admission',
    layoutName: 'McGill Offer Letter',
  },
  'university-of-manitoba': {
    variant: 'manitoba-letter',
    accent: '#004f86',
    accentSoft: '#e9f4fb',
    accentInk: '#122d40',
    kicker: 'Letter of Offer',
    layoutName: 'Letter of Offer',
  },
  'university-of-alberta': {
    variant: 'panel',
    accent: '#003366',
    accentSoft: '#e9f0f6',
    accentInk: '#13213a',
    kicker: 'Admission Notification',
  },
  'york-university': {
    variant: 'editorial',
    accent: '#991b38',
    accentSoft: '#f9e7ee',
    accentInk: '#3d1118',
    kicker: 'Official Offer',
  },
  'university-of-waterloo': {
    variant: 'classic',
    accent: '#000000',
    accentSoft: '#f0f0f0',
    accentInk: '#121212',
    kicker: 'Admission Letter',
  },
  'university-of-ottawa': {
    variant: 'ottawa-letter',
    accent: '#e31837',
    accentSoft: '#fbe7ea',
    accentInk: '#3a1219',
    kicker: 'Letter of Offer',
    layoutName: 'Letter of Offer',
  },
  'university-of-calgary': {
    variant: 'panel',
    accent: '#b5171f',
    accentSoft: '#f8e7e8',
    accentInk: '#3b1217',
    kicker: 'Offer of Admission',
  },
  'simon-fraser-university': {
    variant: 'classic',
    accent: '#008281',
    accentSoft: '#def3f4',
    accentInk: '#102c2d',
    kicker: 'Admission Confirmation',
  },
  'university-of-regina': {
    variant: 'classic',
    accent: '#01225e',
    accentSoft: '#e6eef7',
    accentInk: '#122841',
    kicker: 'Official Offer',
  },
  'university-of-saskatchewan': {
    variant: 'saskatchewan-letter',
    accent: '#00502f',
    accentSoft: '#e5f2ea',
    accentInk: '#122b2a',
    kicker: 'Letter of Offer',
    layoutName: 'Letter of Offer',
  },
  'university-of-guelph': {
    variant: 'editorial',
    accent: '#9b1f24',
    accentSoft: '#f9e8ea',
    accentInk: '#32141a',
    kicker: 'Formal Offer',
  },
  'carleton-university': {
    variant: 'classic',
    accent: '#262626',
    accentSoft: '#f3f3f3',
    accentInk: '#111111',
    kicker: 'Official Admission',
  },
  'university-of-victoria': {
    variant: 'banner',
    accent: '#002b5c',
    accentSoft: '#e7eff9',
    accentInk: '#102342',
    kicker: 'Admission Notice',
  },
  'dalhousie-university': {
    variant: 'heritage',
    accent: '#002d62',
    accentSoft: '#e7eff8',
    accentInk: '#102243',
    kicker: 'Official Offer',
  },
  'university-of-windsor': {
    variant: 'classic',
    accent: '#8c1d40',
    accentSoft: '#f7e6ec',
    accentInk: '#351324',
    kicker: 'Admission Letter',
  },
  'university-of-leeds': {
    variant: 'classic',
    accent: '#003366',
    accentSoft: '#e8effa',
    accentInk: '#11213d',
    kicker: 'Admission Notice',
  },
  'university-of-birmingham': {
    variant: 'panel',
    accent: '#005b8c',
    accentSoft: '#e8f2f6',
    accentInk: '#112d41',
    kicker: 'Official Offer',
  },
  'university-of-manchester': {
    variant: 'heritage',
    accent: '#d0021b',
    accentSoft: '#f8e8ea',
    accentInk: '#321318',
    kicker: 'Admissions Letter',
  },
  'university-of-oxford': {
    variant: 'classic',
    accent: '#002147',
    accentSoft: '#e8edf5',
    accentInk: '#121d38',
    kicker: 'Formal Admission',
  },
  'university-of-cambridge': {
    variant: 'panel',
    accent: '#002147',
    accentSoft: '#eef0f5',
    accentInk: '#121d38',
    kicker: 'Admissions Letter',
  },
  'imperial-college-london': {
    variant: 'banner',
    accent: '#003366',
    accentSoft: '#e9eff7',
    accentInk: '#122b4a',
    kicker: 'Offer of Study',
  },
  'university-college-london-ucl': {
    variant: 'editorial',
    accent: '#8e1f51',
    accentSoft: '#f7e6f0',
    accentInk: '#33162b',
    kicker: 'Official Offer',
  },
  'london-school-of-economics-lse': {
    variant: 'classic',
    accent: '#0066a1',
    accentSoft: '#e8f2fb',
    accentInk: '#122f45',
    kicker: 'Admission Confirmation',
  },
  'university-of-edinburgh': {
    variant: 'heritage',
    accent: '#1f448b',
    accentSoft: '#e7eff9',
    accentInk: '#142451',
    kicker: 'Formal Offer',
  },
  'king-s-college-london': {
    variant: 'editorial',
    accent: '#003366',
    accentSoft: '#e7eff7',
    accentInk: '#122945',
    kicker: 'Admission Letter',
  },
  'university-of-glasgow': {
    variant: 'classic',
    accent: '#005eb8',
    accentSoft: '#e4effc',
    accentInk: '#10294a',
    kicker: 'Admission Notice',
  },
  'university-of-bristol': {
    variant: 'panel',
    accent: '#20285a',
    accentSoft: '#eaedf9',
    accentInk: '#121a36',
    kicker: 'Official Offer',
  },
  'university-of-warwick': {
    variant: 'classic',
    accent: '#003366',
    accentSoft: '#e6eef7',
    accentInk: '#11243c',
    kicker: 'Formal Admission',
  },
  'university-of-southampton': {
    variant: 'banner',
    accent: '#231f20',
    accentSoft: '#f1f0f1',
    accentInk: '#121011',
    kicker: 'Admission Notice',
  },
  'university-of-sheffield': {
    variant: 'editorial',
    accent: '#002d72',
    accentSoft: '#e6effb',
    accentInk: '#112047',
    kicker: 'Admission Letter',
  },
  'university-of-nottingham': {
    variant: 'classic',
    accent: '#003366',
    accentSoft: '#e9eff8',
    accentInk: '#122342',
    kicker: 'Official Offer',
  },
  'university-of-york': {
    variant: 'panel',
    accent: '#002c57',
    accentSoft: '#e8eff7',
    accentInk: '#112243',
    kicker: 'Admission Letter',
  },
  'university-of-st-andrews': {
    variant: 'crest',
    accent: '#002d62',
    accentSoft: '#e9f1fb',
    accentInk: '#102248',
    kicker: 'Formal Admission',
  },
  'stanford-university': {
    variant: 'editorial',
    accent: '#8c1515',
    accentSoft: '#fbefef',
    accentInk: '#2f1212',
    kicker: 'Admission Offer',
  },
  'harvard-university': {
    variant: 'banner',
    accent: '#a51c30',
    accentSoft: '#f9e7ea',
    accentInk: '#31151a',
    kicker: 'Admissions Letter',
  },
  'massachusetts-institute-of-technology-mit': {
    variant: 'panel',
    accent: '#a31f34',
    accentSoft: '#f8e8ea',
    accentInk: '#32141b',
    kicker: 'Official Notice',
  },
  'university-of-california-berkeley': {
    variant: 'classic',
    accent: '#003262',
    accentSoft: '#e6edf9',
    accentInk: '#12223f',
    kicker: 'Admission Confirmation',
  },
  'columbia-university': {
    variant: 'banner',
    accent: '#7c9ed9',
    accentSoft: '#eef4fc',
    accentInk: '#1a2d4b',
    kicker: 'Admissions Letter',
  },
  'yale-university': {
    variant: 'panel',
    accent: '#00356b',
    accentSoft: '#e6eef9',
    accentInk: '#121f38',
    kicker: 'Admission Letter',
  },
  'princeton-university': {
    variant: 'classic',
    accent: '#ff8f00',
    accentSoft: '#fff1d9',
    accentInk: '#3f2400',
    kicker: 'Official Offer',
  },
  'university-of-chicago': {
    variant: 'editorial',
    accent: '#a71930',
    accentSoft: '#f9e7ea',
    accentInk: '#31151a',
    kicker: 'Formal Admission',
  },
  'university-of-pennsylvania': {
    variant: 'classic',
    accent: '#011f5b',
    accentSoft: '#e6eef8',
    accentInk: '#122149',
    kicker: 'Admission Notice',
  },
  'cornell-university': {
    variant: 'crest',
    accent: '#b31b1b',
    accentSoft: '#f9e5e5',
    accentInk: '#3b1214',
    kicker: 'Official Offer',
  },
  'brown-university': {
    variant: 'classic',
    accent: '#532f10',
    accentSoft: '#f4ece6',
    accentInk: '#3f2716',
    kicker: 'Admission Letter',
  },
  'duke-university': {
    variant: 'panel',
    accent: '#0736a4',
    accentSoft: '#e7ecfb',
    accentInk: '#13235c',
    kicker: 'Admissions Letter',
  },
  'northwestern-university': {
    variant: 'editorial',
    accent: '#4e2a84',
    accentSoft: '#eee6f7',
    accentInk: '#241a46',
    kicker: 'Official Offer',
  },
  'university-of-michigan': {
    variant: 'classic',
    accent: '#00274c',
    accentSoft: '#e5eff8',
    accentInk: '#122047',
    kicker: 'Admission Notice',
  },
  'university-of-california-los-angeles-ucla': {
    variant: 'banner',
    accent: '#2774ae',
    accentSoft: '#e6f1fb',
    accentInk: '#0f2f52',
    kicker: 'Admission Letter',
  },
  'new-york-university-nyu': {
    variant: 'panel',
    accent: '#57068c',
    accentSoft: '#f2e8fb',
    accentInk: '#24124d',
    kicker: 'Formal Offer',
  },
  'university-of-southern-california-usc': {
    variant: 'classic',
    accent: '#990000',
    accentSoft: '#f7e8e8',
    accentInk: '#3f1215',
    kicker: 'Offer of Admission',
  },
  'university-of-texas-at-austin': {
    variant: 'banner',
    accent: '#bf5700',
    accentSoft: '#fbe8d8',
    accentInk: '#3e1f0f',
    kicker: 'Admission Confirmation',
  },
  'university-of-washington': {
    variant: 'editorial',
    accent: '#4b2e83',
    accentSoft: '#eee8f7',
    accentInk: '#2c1b44',
    kicker: 'Official Offer',
  },
  'boston-university': {
    variant: 'classic',
    accent: '#cc0000',
    accentSoft: '#fde9e9',
    accentInk: '#3e1414',
    kicker: 'Admission Letter',
  },
  'carnegie-mellon-university': {
    variant: 'panel',
    accent: '#8c1515',
    accentSoft: '#f9e8e8',
    accentInk: '#341516',
    kicker: 'Admissions Notice',
  },
  'university-of-illinois-urbana-champaign': {
    variant: 'classic',
    accent: '#db2a2a',
    accentSoft: '#fbe9e9',
    accentInk: '#431716',
    kicker: 'Official Offer',
  },
  'university-of-wisconsin-madison': {
    variant: 'heritage',
    accent: '#c5050c',
    accentSoft: '#fde6e9',
    accentInk: '#40121a',
    kicker: 'Admission Letter',
  },
  'university-of-north-carolina-at-chapel-hill': {
    variant: 'panel',
    accent: '#7ba0cf',
    accentSoft: '#eaf0f8',
    accentInk: '#25364e',
    kicker: 'Admission Notice',
  },
  'university-of-virginia': {
    variant: 'classic',
    accent: '#232d4b',
    accentSoft: '#e8eff8',
    accentInk: '#142243',
    kicker: 'Official Offer',
  },
  'georgia-institute-of-technology': {
    variant: 'editorial',
    accent: '#b3a369',
    accentSoft: '#f3f0e3',
    accentInk: '#3f3b26',
    kicker: 'Admission Letter',
  },
  'university-of-california-davis': {
    variant: 'panel',
    accent: '#1e5f20',
    accentSoft: '#e5f2e6',
    accentInk: '#10321f',
    kicker: 'Formal Offer',
  },
  'university-of-california-san-diego-ucsd': {
    variant: 'classic',
    accent: '#00274d',
    accentSoft: '#e7eff8',
    accentInk: '#122146',
    kicker: 'Admission Confirmation',
  },
  'university-of-california-santa-barbara-ucsb': {
    variant: 'banner',
    accent: '#2d4073',
    accentSoft: '#e7eff9',
    accentInk: '#162345',
    kicker: 'Offer of Admission',
  },
  'university-of-colorado-boulder': {
    variant: 'crest',
    accent: '#c8102e',
    accentSoft: '#f9eaec',
    accentInk: '#3d1218',
    kicker: 'Official Offer',
  },
  'university-of-new-south-wales-unsw': {
    variant: 'panel',
    accent: '#012b5c',
    accentSoft: '#e7eff9',
    accentInk: '#112544',
    kicker: 'Admission Notice',
  },
  'monash-university': {
    variant: 'classic',
    accent: '#003366',
    accentSoft: '#e7eff9',
    accentInk: '#11243f',
    kicker: 'Official Offer',
  },
  'university-of-queensland': {
    variant: 'banner',
    accent: '#00305d',
    accentSoft: '#e7eff9',
    accentInk: '#122340',
    kicker: 'Admission Letter',
  },
  'university-of-western-australia': {
    variant: 'editorial',
    accent: '#00204d',
    accentSoft: '#e8effa',
    accentInk: '#10233a',
    kicker: 'Admission Offer',
  },
  'university-of-adelaide': {
    variant: 'classic',
    accent: '#660000',
    accentSoft: '#f7e8e8',
    accentInk: '#3e1515',
    kicker: 'Official Offer',
  },
  'university-of-technology-sydney': {
    variant: 'panel',
    accent: '#021d3a',
    accentSoft: '#e4eef9',
    accentInk: '#12243d',
    kicker: 'Admission Letter',
  },
  'queensland-university-of-technology': {
    variant: 'banner',
    accent: '#0082c8',
    accentSoft: '#e5f2fb',
    accentInk: '#0f2a45',
    kicker: 'Admissions Letter',
  },
  'rmit-university': {
    variant: 'editorial',
    accent: '#c9252f',
    accentSoft: '#fde9ea',
    accentInk: '#3b1218',
    kicker: 'Official Offer',
  },
  'deakin-university': {
    variant: 'classic',
    accent: '#005292',
    accentSoft: '#e7eef9',
    accentInk: '#102447',
    kicker: 'Formal Admission',
  },
  'university-of-wollongong': {
    variant: 'panel',
    accent: '#002d5c',
    accentSoft: '#e7eff9',
    accentInk: '#102540',
    kicker: 'Admission Notice',
  },
  'curtin-university': {
    variant: 'banner',
    accent: '#bd0000',
    accentSoft: '#fde8e9',
    accentInk: '#3d1215',
    kicker: 'Offer of Admission',
  },
  'manipal-university-dubai': {
    variant: 'classic',
    accent: '#004c7d',
    accentSoft: '#e5f1fb',
    accentInk: '#112a42',
    kicker: 'Official Offer',
  },
  'university-of-copenhagen-denmark': {
    variant: 'editorial',
    accent: '#00274c',
    accentSoft: '#e8eff8',
    accentInk: '#122246',
    kicker: 'Admission Notice',
  },
  'university-of-amsterdam-netherlands': {
    variant: 'banner',
    accent: '#da291c',
    accentSoft: '#f8e7e8',
    accentInk: '#3d1218',
    kicker: 'Official Offer',
  },
  'technical-university-of-munich-germany': {
    variant: 'classic',
    accent: '#000000',
    accentSoft: '#e8e8e8',
    accentInk: '#101010',
    kicker: 'Admission Letter',
  },
  'university-of-paris-france': {
    variant: 'crest',
    accent: '#003d7d',
    accentSoft: '#e8eff9',
    accentInk: '#112245',
    kicker: 'Formal Admission',
  },
  'university-of-barcelona-spain': {
    variant: 'classic',
    accent: '#004174',
    accentSoft: '#e7eef9',
    accentInk: '#102544',
    kicker: 'Official Offer',
  },
  'university-of-rome-italy': {
    variant: 'heritage',
    accent: '#b31b1b',
    accentSoft: '#fbe7e7',
    accentInk: '#3f1416',
    kicker: 'Admission Letter',
  },
  'university-of-oslo-norway': {
    variant: 'panel',
    accent: '#002147',
    accentSoft: '#e8eff5',
    accentInk: '#122141',
    kicker: 'Admissions Notice',
  },
  'university-of-helsinki-finland': {
    variant: 'editorial',
    accent: '#003771',
    accentSoft: '#e7eff9',
    accentInk: '#122548',
    kicker: 'Official Offer',
  },
  'university-of-vienna-austria': {
    variant: 'classic',
    accent: '#002147',
    accentSoft: '#e8eff5',
    accentInk: '#122146',
    kicker: 'Admission Letter',
  },
  'ku-leuven-belgium': {
    variant: 'banner',
    accent: '#002f6c',
    accentSoft: '#e7effb',
    accentInk: '#112541',
    kicker: 'Admission Confirmation',
  },
  'university-of-stockholm-sweden': {
    variant: 'panel',
    accent: '#003366',
    accentSoft: '#e8eff9',
    accentInk: '#122446',
    kicker: 'Official Offer',
  },
  'university-of-porto-portugal': {
    variant: 'classic',
    accent: '#003366',
    accentSoft: '#e7eff9',
    accentInk: '#112343',
    kicker: 'Admission Letter',
  },
}

const PRESENTATION_VARIANTS = ['panel', 'banner', 'ubc-letter', 'mcgill-letter', 'editorial', 'classic', 'crest', 'heritage', 'ticket', 'tech-box', 'space-tech', 'gift-box']

const PRESENTATION_LABELS = {
  panel: 'Research Panel',
  banner: 'Campus Banner',
  'ubc-letter': 'UBC Offer Letter',
  'mcgill-letter': 'McGill Offer Letter',
  editorial: 'Editorial Offer',
  classic: 'Classic Academic',
  crest: 'Crest & Seal',
  heritage: 'Heritage Edition',
  'manitoba-letter': 'Letter of Offer',
  'ottawa-letter': 'Letter of Offer',
  'saskatchewan-letter': 'Letter of Offer',
  ticket: 'Admissions Pass',
  'tech-box': 'Tech Box',
  'space-tech': 'Space Tech',
  'gift-box': 'Gift Box',
}

function hashString(value) {
  const text = `${value ?? ''}`
  let hash = 0

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }

  return hash
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `acceptance-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function slugify(value) {
  return `${value ?? ''}`
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

function getInitials(value) {
  const words = `${value ?? ''}`
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (!words.length) return 'BP'
  return words.slice(0, 3).map((part) => part[0]?.toUpperCase() || '').join('')
}

function createBlankAcceptanceRecord() {
  return {
    id: createId(),
    university_slug: '',
    university_name: '',
    university_destination: '',
    university_city: '',
    reference_number: `ACC-${Date.now().toString().slice(-6)}`,
    student_number: '',
    nsid: '',
    student_name: '',
    program_name: '',
    program_level: 'Undergraduate',
    intake_term: '',
    offer_date: new Date().toISOString().slice(0, 10),
    start_date: '',
    acceptance_deadline: '',
    offer_text:
      'We are pleased to confirm that your application has been reviewed and you have been offered admission to the program outlined below. Please review the details carefully and respond within the stated deadline.',
    conditions:
      'This offer is subject to final document verification, tuition deposit requirements, and any additional university or immigration conditions that may apply.',
    closing_text:
      'We look forward to welcoming you to the Brightpath academic community. Please contact the admissions office if you require any clarification.',
    signatory_name: 'Registrar',
    signatory_title: 'Registrar and Secretary',
    footer_text: 'This letter is issued for admission purposes and may be used for visa or enrollment support where applicable.',
    ottawa_wordmark: 'uExcellence',
    ottawa_dept_left: "Universite d'Excellence\nAdmissions",
    ottawa_dept_right: 'University of Excellence\nAdmissions',
    ottawa_date_line: 'May 19, 2026',
    ottawa_recipient_name: 'Firstname Lastname',
    ottawa_recipient_address: '1401-3099 Riverside Drive\nWindsor ON N8S 3P1',
    ottawa_student_number: '30000134',
    ottawa_program_block: 'Bachelor of Social Sciences\n2025 Fall Term\nOffered in English',
    ottawa_salutation: 'Dear Firstname Lastname,',
    ottawa_intro_text:
      'Congratulations! We are pleased to inform you that you have been admitted to the University of Excellence in the:',
    ottawa_next_text:
      'We ask that you carefully read this offer and respond by the prescribed deadline in order to secure your place in the program.',
    ottawa_program_text:
      "The Faculty of Social Sciences' flexible programs, excellent research opportunities and commitment to a positive student experience will enable you to acquire the solid, diversified skills required to achieve academic excellence and to meet the needs of today's world. We are committed to supporting you in your university studies, to ensure that you have a positive and successful experience with us.",
    ottawa_housing_text:
      'The University guarantees you a room in residence in order to hold your room, follow the instructions on the housing Portal and be sure to pay the housing deposit by the deadline.',
    ottawa_enrolment_text:
      'We are sending you more information on course enrolment once you have accepted your offer of admission.',
    ottawa_contact_text:
      "If you have any questions regarding this offer or about the University of Excellence, do not hesitate to contact us at admissions@uexcellence.ca. In the meantime, check your emails as we will send you information on what's going on at the University.",
    ottawa_closing_text: 'We look forward to welcoming you as a University of Excellence student!',
    ottawa_signature_script: 'Jordan Lee',
    ottawa_signature_name: 'Jordan Lee',
    ottawa_signature_title: 'Admissions Officer',
    ottawa_signature_unit: 'Extended Education',
    ottawa_footer_left:
      '550 rue Cumberland\nOttawa (Ontario) K1N 6N5 Canada\nhttp://www.uexcellence.ca/admissions/apply-undergraduate',
    ottawa_footer_right:
      '550 Cumberland St.\nOttawa, Ontario K1N 6N5 Canada\nhttp://www.uexcellence.ca/admissions/apply-undergraduate',
    manitoba_header_brand: 'Your University',
    manitoba_header_department: 'Extended Education',
    manitoba_contact_block:
      'Student and Ancillary Services\n120 Extended Education Complex\nYourcity, Province\nCountry A1B 2C3\nT: 204-474-8800  F: 204-275-1839\nadmissions@youruniversity.edu',
    manitoba_title: 'Letter of Offer',
    manitoba_salutation: 'Dear Firstname Lastname,',
    manitoba_student_address: '',
    manitoba_passport_number: 'L0000000',
    manitoba_student_number: '00000000',
    manitoba_birth_date: '01 Jan 2000',
    manitoba_bu_number: 'U00000000',
    manitoba_intro_text:
      'Thank you for submitting your application to the Applied Business Management (ABM) program at Your University. I am pleased to inform you that you meet the requirements for admission, with a start date of September 4, 2026. Your non-refundable application fee of $100.00 has been received.',
    manitoba_deposit_text:
      'In order to secure your seat, you are required to make a non-refundable tuition deposit of $2,500.00. This payment is due by July 15, 2026. For information on how to make this payment, please refer to the attached payment options.',
    manitoba_admission_text:
      'Once your $2,500.00 deposit is received, a letter of admission will be issued. The letter of admission is a required document for your study permit application.',
    manitoba_failure_text:
      'Failure to pay the deposit by the due date will result in the cancellation of your admission offer.',
    manitoba_decline_text:
      'If you do not intend to accept this admission offer, please contact us as soon as possible.',
    manitoba_contact_text:
      'If you have any questions or concerns regarding your offer, please contact Student Services at admissions@youruniversity.edu.',
    manitoba_closing_text: 'Sincerely,',
    manitoba_signature_script: 'Jordan Lee',
    manitoba_signature_name: 'Jordan Lee',
    manitoba_signature_title: 'Admissions Officer',
    manitoba_signature_unit: 'Extended Education',
    manitoba_footnotes_text:
      'This is a 12-month full-time program package that includes: Certificate in Management and Administration, Letter of Accomplishment in Career Preparation, language support, and 175 hours of work placement.\nA determination of admissibility for your application is verified and final documentation from the Canadian Embassy is provided.\nFees are subject to change without notice.',
    ubc_intro_text:
      'We are pleased to offer you admission to the University of British Columbia for the program shown below.',
    ubc_summary_text:
      'Your application has been reviewed by the admissions committee and you have been offered admission to the program outlined above.',
    ubc_conditions_text:
      'All offers are subject to final document verification, payment of the required tuition deposit, and review of your study permit application.',
    ubc_next_steps_text:
      'Please review the conditions carefully and follow the next steps to confirm your offer and prepare for immigration and enrolment.',
    ubc_contact_text:
      'If you have any questions, contact UBC Admissions at admissions@ubc.ca or visit the UBC international admissions page.',
    ubc_signature_script: 'Registrar',
    ubc_closing_text:
      'This letter is issued for admission purposes and may be used as part of your study permit or enrolment documentation where applicable.',
    ottawa_wordmark: 'uExcellence',
    ottawa_dept_left: "Université d'Excellence\nAdmissions",
    ottawa_dept_right: 'University of Excellence\nAdmissions',
    ottawa_date_line: 'May 19, 2026',
    ottawa_recipient_name: 'Firstname Lastname',
    ottawa_recipient_address: '1401-3099 Riverside Drive\nWindsor ON N8S 3P1',
    ottawa_student_number: '30000134',
    ottawa_program_block: 'Bachelor of Social Sciences\n2025 Fall Term\nOffered in English',
    ottawa_salutation: 'Dear Firstname Lastname,',
    ottawa_intro_text:
      'Congratulations! We are pleased to inform you that you have been admitted to the University of Excellence in the:',
    ottawa_next_text:
      'We ask that you carefully read this offer and respond by the prescribed deadline in order to secure your place in the program.',
    ottawa_program_text:
      "The Faculty of Social Sciences' flexible programs, excellent research opportunities and commitment to a positive student experience will enable you to acquire the solid, diversified skills required to achieve academic excellence and to meet the needs of today's world. We are committed to supporting you in your university studies, to ensure that you have a positive and successful experience with us.",
    ottawa_housing_text:
      'The University guarantees you a room in residence in order to hold your room, follow the instructions on the housing Portal and be sure to pay the housing deposit by the deadline.',
    ottawa_enrolment_text:
      'We are sending you more information on course enrolment once you have accepted your offer of admission.',
    ottawa_contact_text:
      'If you have any questions regarding this offer or about the University of Excellence, do not hesitate to contact us at admissions@uexcellence.ca in the meantime, check your emails as we will send you information on what\'s going on at the University.',
    ottawa_closing_text: 'We look forward to welcoming you as a University of Excellence student!',
    ottawa_signature_script: 'Jordan Lee',
    ottawa_signature_name: 'Jordan Lee',
    ottawa_signature_title: 'Admissions Officer',
    ottawa_signature_unit: 'Extended Education',
    ottawa_footer_left:
      '550 rue Cumberland\nOttawa (Ontario) K1N 6N5 Canada\nhttp://www.uexcellence.ca/admissions/apply-undergraduate',
    ottawa_footer_right:
      '550 Cumberland St.\nOttawa, Ontario K1N 6N5 Canada\nhttp://www.uexcellence.ca/admissions/apply-undergraduate',
    university_logo_url: '',
    seal_image_url: '',
    stamp_image_url: '',
    signature_image_url: '',
    template_version: TEMPLATE_VERSION,
  }
}

function buildUniversityPresentation(entry) {
  const destination = `${entry?.destinationSlug || ''}`.toLowerCase()
  const base = PRESENTATION_FAMILIES[destination] || PRESENTATION_FAMILIES.default
  const override = UNIVERSITY_PRESENTATION_OVERRIDES[entry?.slug || ''] || {}
  const hash = hashString(`${entry?.name || ''}|${entry?.slug || ''}|${destination}`)
  const variant = override.variant || entry?.presentationVariant || entry?.layout || PRESENTATION_VARIANTS[hash % PRESENTATION_VARIANTS.length]
  const toneShift = (hash % 7) / 100
  const accent = override.accent || entry?.colors?.accent || base.accent
  const accentSoft = override.accentSoft || entry?.colors?.primaryLight || base.accentSoft
  const accentInk = override.accentInk || entry?.colors?.primaryDark || base.accentInk

  return {
    ...base,
    variant,
    toneShift,
    accent,
    accentSoft,
    accentInk,
    familyLabel: base.badge,
    kicker: override.kicker || base.badge,
    layoutName: override.layoutName || entry?.layoutName || PRESENTATION_LABELS[variant] || 'Academic Edition',
    shortFamilyLabel: base.family === 'heritage' ? 'Heritage' : base.family === 'research' ? 'Research' : base.family === 'ivy' ? 'Ivy' : base.family === 'sunlit' ? 'Sunlit' : base.family === 'diplomatic' ? 'Diplomatic' : base.family === 'continental' ? 'Continental' : 'Editorial',
  }
}

function buildAcceptancePreview(record) {
  const university = getUniversityBySlug(record.university_slug) || getUniversityByName(record.university_name) || ACCEPTANCE_UNIVERSITY_OPTIONS.find((item) => item.slug === record.university_slug || item.name === record.university_name) || null
  const presentation = buildUniversityPresentation(university)
  const theme = {
    ...presentation,
    pageBg: university?.colors?.pageBg || presentation.pageBg,
    pageInk: university?.colors?.text || presentation.pageInk,
    accent: university?.colors?.accent || presentation.accent,
    accentSoft: university?.colors?.primaryLight || presentation.accentSoft,
    accentInk: university?.colors?.primaryDark || presentation.accentInk,
  }

  return {
    university,
    presentation,
    theme,
    university_slug: record.university_slug || university?.slug || '',
    university_name: record.university_name || university?.name || 'University Name',
    university_destination: record.university_destination || university?.destination || 'International',
    university_city: record.university_city || university?.city || '',
    reference_number: record.reference_number || 'ACC-000000',
    student_name: record.student_name || 'Student Name',
    student_number: record.student_number || '',
    nsid: record.nsid || '',
    program_name: record.program_name || 'Program Name',
    program_level: record.program_level || 'Undergraduate',
    intake_term: record.intake_term || 'Fall Intake',
    offer_date: record.offer_date || new Date().toISOString().slice(0, 10),
    start_date: record.start_date || '',
    acceptance_deadline: record.acceptance_deadline || '',
    offer_text: record.offer_text || '',
    conditions: record.conditions || '',
    closing_text: record.closing_text || '',
    signatory_name: record.signatory_name || 'Registrar',
    signatory_title: record.signatory_title || 'Registrar and Secretary',
    footer_text: record.footer_text || '',
    ottawa_wordmark: record.ottawa_wordmark || 'uExcellence',
    ottawa_dept_left: record.ottawa_dept_left || '',
    ottawa_dept_right: record.ottawa_dept_right || '',
    ottawa_date_line: record.ottawa_date_line || '',
    ottawa_recipient_name: record.ottawa_recipient_name || '',
    ottawa_recipient_address: record.ottawa_recipient_address || '',
    ottawa_student_number: record.ottawa_student_number || '',
    ottawa_program_block: record.ottawa_program_block || '',
    ottawa_salutation: record.ottawa_salutation || '',
    ottawa_intro_text: record.ottawa_intro_text || '',
    ottawa_next_text: record.ottawa_next_text || '',
    ottawa_program_text: record.ottawa_program_text || '',
    ottawa_housing_text: record.ottawa_housing_text || '',
    ottawa_enrolment_text: record.ottawa_enrolment_text || '',
    ottawa_contact_text: record.ottawa_contact_text || '',
    ottawa_closing_text: record.ottawa_closing_text || '',
    ottawa_signature_script: record.ottawa_signature_script || '',
    ottawa_signature_name: record.ottawa_signature_name || '',
    ottawa_signature_title: record.ottawa_signature_title || '',
    ottawa_signature_unit: record.ottawa_signature_unit || '',
    ottawa_footer_left: record.ottawa_footer_left || '',
    ottawa_footer_right: record.ottawa_footer_right || '',
    manitoba_header_brand: record.manitoba_header_brand || 'Your University',
    manitoba_header_department: record.manitoba_header_department || 'Extended Education',
    manitoba_contact_block: record.manitoba_contact_block || '',
    manitoba_title: record.manitoba_title || 'Letter of Offer',
    manitoba_salutation: record.manitoba_salutation || 'Dear Firstname Lastname,',
    manitoba_student_address: record.manitoba_student_address || '',
    manitoba_passport_number: record.manitoba_passport_number || '',
    manitoba_student_number: record.manitoba_student_number || '',
    manitoba_birth_date: record.manitoba_birth_date || '',
    manitoba_bu_number: record.manitoba_bu_number || '',
    manitoba_intro_text: record.manitoba_intro_text || '',
    manitoba_deposit_text: record.manitoba_deposit_text || '',
    manitoba_admission_text: record.manitoba_admission_text || '',
    manitoba_failure_text: record.manitoba_failure_text || '',
    manitoba_decline_text: record.manitoba_decline_text || '',
    manitoba_contact_text: record.manitoba_contact_text || '',
    manitoba_closing_text: record.manitoba_closing_text || '',
    manitoba_signature_script: record.manitoba_signature_script || '',
    manitoba_signature_name: record.manitoba_signature_name || '',
    manitoba_signature_title: record.manitoba_signature_title || '',
    manitoba_signature_unit: record.manitoba_signature_unit || '',
    manitoba_footnotes_text: record.manitoba_footnotes_text || '',
    ubc_intro_text: record.ubc_intro_text || '',
    ubc_summary_text: record.ubc_summary_text || '',
    ubc_conditions_text: record.ubc_conditions_text || '',
    ubc_next_steps_text: record.ubc_next_steps_text || '',
    ubc_contact_text: record.ubc_contact_text || '',
    ubc_signature_script: record.ubc_signature_script || record.signatory_name || '',
    ubc_closing_text: record.ubc_closing_text || '',
    mcgill_wordmark_text: record.mcgill_wordmark_text || 'McGill University',
    mcgill_tagline_text: record.mcgill_tagline_text || 'Office of Admissions',
    mcgill_sender_dept_name: record.mcgill_sender_dept_name || 'Student Recruitment & Admissions',
    mcgill_sender_address: record.mcgill_sender_address || 'McGill University\n3450 McTavish Street\nMontreal, QC H3A 0E8\nCanada\nTel: 514-398-4455\nadmissions@mcgill.ca',
    mcgill_subject_line: record.mcgill_subject_line || `Re: Offer of Admission – ${record.program_name || 'Program Name'}`,
    mcgill_date_line: record.mcgill_date_line || formatDate(record.offer_date) || '',
    mcgill_recipient_block: record.mcgill_recipient_block || `${record.student_name || 'Patrick Dennis'}\n${record.nsid || 'Elton K5XM49 – EG51 233'}\n${record.university_city || 'Kumasi, Ghana'}`,
    mcgill_salutation: record.mcgill_salutation || `Dear ${record.student_name ? record.student_name.split(' ')[0] : 'Mr. Dennis'},`,
    mcgill_intro_text: record.mcgill_intro_text || 'On behalf of McGill University, I am pleased to offer you admission to the program indicated below.',
    mcgill_paragraph_two: record.mcgill_paragraph_two || 'Please review this offer carefully and ensure that you complete all next steps by the dates shown.',
    mcgill_paragraph_three: record.mcgill_paragraph_three || 'The Admissions Committee has reviewed your application and is confident you have the academic profile to succeed at McGill.',
    mcgill_paragraph_four: record.mcgill_paragraph_four || 'Please visit the McGill admissions website for full details about registration, international student services, and arrival planning.',
    mcgill_closing_text: record.mcgill_closing_text || 'We look forward to welcoming you to McGill University and supporting your academic journey.',
    mcgill_signature_script: record.mcgill_signature_script || 'Cynthia Henderson',
    mcgill_signature_name: record.mcgill_signature_name || 'Cynthia Henderson',
    mcgill_signature_title: record.mcgill_signature_title || 'Director, Admissions and Recruitment',
    mcgill_footer_text: record.mcgill_footer_text || 'McGill University · 3450 McTavish Street, Montreal, QC H3A 0E8 · admissions@mcgill.ca · 514-398-4455',
    university_logo_url: record.university_logo_url || '',
    seal_image_url: record.seal_image_url || '',
    stamp_image_url: record.stamp_image_url || '',
    signature_image_url: record.signature_image_url || '',
  }
}

function renderAcceptanceLetter(preview) {
  const styles = {
    '--acceptance-accent': preview.theme.accent,
    '--acceptance-accent-soft': preview.theme.accentSoft,
    '--acceptance-accent-ink': preview.theme.accentInk,
    '--acceptance-page-bg': preview.theme.pageBg,
    '--acceptance-page-ink': preview.theme.pageInk,
  }

  switch (preview.presentation.variant) {
    case 'ottawa-letter':
      return renderOttawaLayout(preview, styles)
    case 'manitoba-letter':
      return renderManitobaLayout(preview, styles)
    case 'saskatchewan-letter':
      return renderSaskatchewanLayout(preview, styles)
    case 'ubc-letter':
      return renderUBCLayout(preview, styles)
    case 'mcgill-letter':
      return renderMcGillLayout(preview, styles)
    case 'banner':
      return renderBannerLayout(preview, styles)
    case 'panel':
      return renderPanelLayout(preview, styles)
    case 'editorial':
      return renderEditorialLayout(preview, styles)
    case 'crest':
      return renderCrestLayout(preview, styles)
    case 'heritage':
      return renderHeritageLayout(preview, styles)
    case 'ticket':
      return renderTicketLayout(preview, styles)
    case 'tech-box':
      return renderTechBoxLayout(preview, styles)
    case 'space-tech':
      return renderSpaceTechLayout(preview, styles)
    case 'gift-box':
      return renderGiftBoxLayout(preview, styles)
    default:
      return renderClassicLayout(preview, styles)
  }
}

function renderTechBoxLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-tech-box" style={styles}>
      <div className="acceptance-letter-tech-box-header">
        <div>
          <div className="acceptance-letter-tech-box-tag">Admissions</div>
          <h3>{preview.university_name}</h3>
          <p>{preview.university_destination}</p>
        </div>
        <div className="acceptance-letter-banner-detail">
          {preview.university_logo_url ? (
            <img src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <div className="acceptance-letter-brand acceptance-letter-brand-banner">{getInitials(preview.university_name)}</div>
          )}
        </div>
      </div>

      <div className="acceptance-letter-body acceptance-letter-banner-body">
        <div className="acceptance-letter-meta-row acceptance-letter-meta-row-banner">
          <div className="acceptance-letter-meta-card">
            <span>Program</span>
            <strong>{preview.program_name || 'Not set'}</strong>
          </div>
          <div className="acceptance-letter-meta-card">
            <span>Level</span>
            <strong>{preview.program_level || 'Not set'}</strong>
          </div>
          <div className="acceptance-letter-meta-card">
            <span>Start date</span>
            <strong>{formatDate(preview.start_date) || 'TBC'}</strong>
          </div>
        </div>

        <div className="acceptance-letter-greeting">Dear {preview.student_name || 'Applicant'},</div>
        <div className="acceptance-letter-body-copy">
          {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
        </div>

        {preview.conditions ? (
          <div className="acceptance-letter-conditions acceptance-letter-conditions-banner">
            <h4>Admission Conditions</h4>
            {renderAcceptanceTextBlocks(preview.conditions, 'conditions')}
          </div>
        ) : null}
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-banner">
        <div className="acceptance-letter-signature-block">
          <div className="acceptance-letter-signature-label">Sincerely,</div>
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
        <div className={`acceptance-letter-stamp${preview.stamp_image_url ? ' has-image' : ''}`}>
          {preview.stamp_image_url ? (
            <img src={preview.stamp_image_url} alt="Admission stamp" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>ADMITTED</span>
          )}
        </div>
      </div>
    </div>
  )
}

function renderSaskatchewanLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-saskatchewan" style={styles}>
      <div className="acceptance-letter-saskatchewan-sheet">
        <div className="acceptance-letter-saskatchewan-letterhead">
          <div className="acceptance-letter-saskatchewan-logo-wrap">
            {preview.university_logo_url ? (
              <img className="acceptance-letter-saskatchewan-logo-image" src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <svg className="acceptance-letter-saskatchewan-shield-svg" viewBox="0 0 38 44" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1 H37 V28 C37 38 19 43 19 43 C19 43 1 38 1 28 Z" fill="#2d5a1b" stroke="#1e3f12" strokeWidth="0.6" />
                <path d="M4 4 H34 V27 C34 35 19 40 19 40 C19 40 4 35 4 27 Z" fill="none" stroke="#fff" strokeWidth="1.2" />
                <line x1="19" y1="9" x2="19" y2="33" stroke="#fff" strokeWidth="1.5" />
                <line x1="11" y1="16" x2="27" y2="16" stroke="#fff" strokeWidth="1.5" />
                <circle cx="19" cy="9" r="2.5" fill="#fff" />
              </svg>
            )}
            <div className="acceptance-letter-saskatchewan-uni-name-block">
              <div className="acceptance-letter-saskatchewan-uni-line1">University of</div>
              <div className="acceptance-letter-saskatchewan-uni-line2">Saskatchewan</div>
            </div>
          </div>
          <div className="acceptance-letter-saskatchewan-contact-block">
            Student and Enrolment Services<br />
            105 Administration Place<br />
            Saskatoon, SK&nbsp;S7N&nbsp;5A2&nbsp;Canada<br />
            Telephone: 306-966-5788<br />
            Email: <a href="mailto:admissions@usask.ca">admissions@usask.ca</a>
          </div>
        </div>

        <div className="acceptance-letter-saskatchewan-date">{formatDate(preview.offer_date) || '11/04/2026'}</div>

        <div className="acceptance-letter-saskatchewan-recipient">
          {preview.student_name || 'Applicant Name'}<br />
          {preview.student_number ? `${preview.student_number}` : 'Student ID'}<br />
          {preview.university_destination || 'City, Country'}
        </div>

        <div className="acceptance-letter-saskatchewan-body">
          <p>
            Congratulations, {preview.student_name || 'Applicant'}! We are pleased to offer you admission to the University of Saskatchewan in the following program, entry term and location:
          </p>

          <div className="acceptance-letter-saskatchewan-program-details">
            <div className="acceptance-letter-saskatchewan-field-row">
              <span className="acceptance-letter-saskatchewan-field-label">Program:</span>
              <span className="acceptance-letter-saskatchewan-field-value">{preview.program_name || 'Program Name'}</span>
            </div>
            <div className="acceptance-letter-saskatchewan-field-row">
              <span className="acceptance-letter-saskatchewan-field-label">Entry term:</span>
              <span className="acceptance-letter-saskatchewan-field-value">{preview.intake_term || '2026 Winter Term'}</span>
            </div>
            <div className="acceptance-letter-saskatchewan-field-row">
              <span className="acceptance-letter-saskatchewan-field-label">Location:</span>
              <span className="acceptance-letter-saskatchewan-field-value">{preview.university_name || 'University of Saskatchewan'}</span>
            </div>
            <div className="acceptance-letter-saskatchewan-field-row">
              <span className="acceptance-letter-saskatchewan-field-label">Student number:</span>
              <span className="acceptance-letter-saskatchewan-field-value">{preview.student_number || ''}</span>
            </div>
            <div className="acceptance-letter-saskatchewan-field-row">
              <span className="acceptance-letter-saskatchewan-field-label">Network access identification (NSID):</span>
              <span className="acceptance-letter-saskatchewan-field-value">{preview.nsid || ''}</span>
            </div>
          </div>

          <p>
            In selecting the University of Saskatchewan, you have chosen well. With a research infrastructure unique in Canada and a rich cultural community unlike anywhere else, the University of Saskatchewan is a place where opportunities to learn, grow and connect are without limit.
          </p>

          <div className="acceptance-letter-saskatchewan-section-heading">Next steps</div>

          <p>
            We know that navigating a path to university for international students can be complicated. As you read through the important information in this letter, know that the University of Saskatchewan is here to help you if you have questions about any of the following information or actions you need to take.
          </p>

          <p>
            If you have questions about your admission or the process to accept your offer, you can find our contact information and a link to book an appointment with the University of Saskatchewan Admissions Office at this address:<br />
            <a href="https://admissions.usask.ca/contact.php">https://admissions.usask.ca/contact.php</a>
          </p>

          <p>
            If you have questions about immigration matters or other information about living and studying in Canada, the University of Saskatchewan's International Student and Study Abroad Centre is here to help. Check out the international student guide and watch for upcoming drop-in advising sessions delivered online at this address:<br />
            <a href="https://students.usask.ca/international/issac.php">https://students.usask.ca/international/issac.php</a>
          </p>

          <div className="acceptance-letter-saskatchewan-deadline-heading">
            DEADLINE TO ACCEPT YOUR OFFER OF ADMISSION AND PAY YOUR TUITION DEPOSIT
          </div>

          <p>
            To confirm your seat in your program, you must accept your offer of admission and pay a non-refundable international student tuition deposit of $1,000.00 by no later than 11:59 pm (Central Standard Time – CST) on <strong>{preview.acceptance_deadline || '05/Aug/2026'}</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}

function renderManitobaLayout(preview, styles) {
  const footnotes = splitTextBlocks(preview.manitoba_footnotes_text)

  return (
    <div className="acceptance-letter-page acceptance-letter-page-manitoba" style={styles}>
      <div className="acceptance-letter-manitoba-sheet">
        <div className="acceptance-letter-manitoba-header">
          <div className="acceptance-letter-manitoba-branding">
            <div className="acceptance-letter-manitoba-brand">
              {preview.university_logo_url ? (
                <img src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : (
                <div className="acceptance-letter-manitoba-mark">{getInitials(preview.manitoba_header_brand || preview.university_name)}</div>
              )}
            </div>
            <div className="acceptance-letter-manitoba-brand-copy">
              <div className="acceptance-letter-manitoba-brand-name">{preview.manitoba_header_brand || 'Your University'}</div>
              <div className="acceptance-letter-manitoba-brand-dept">{preview.manitoba_header_department || 'Extended Education'}</div>
            </div>
          </div>

          <div className="acceptance-letter-manitoba-contact">
            {renderAcceptanceTextBlocks(preview.manitoba_contact_block, 'manitoba-contact', 'acceptance-letter-manitoba-contact-line')}
          </div>
        </div>

        <div className="acceptance-letter-manitoba-meta-grid">
          <div className="acceptance-letter-manitoba-meta-col">
            <div><strong>Student Name:</strong> {preview.student_name || 'Firstname Lastname'}</div>
            <div><strong>Address:</strong> {preview.manitoba_student_address || 'Street address, City, Province'}</div>
            <div><strong>Date of Birth:</strong> {preview.manitoba_birth_date || '01 Jan 2000'}</div>
          </div>
          <div className="acceptance-letter-manitoba-meta-col">
            <div><strong>Date:</strong> {formatDate(preview.offer_date) || 'June 17, 2026'}</div>
            <div><strong>Passport #:</strong> {preview.manitoba_passport_number || 'L0000000'}</div>
            <div><strong>Student #:</strong> {preview.manitoba_student_number || '00000000'}</div>
            <div><strong>BU #:</strong> {preview.manitoba_bu_number || 'U00000000'}</div>
          </div>
        </div>

        <h1 className="acceptance-letter-manitoba-title">{preview.manitoba_title || 'Letter of Offer'}</h1>

        <div className="acceptance-letter-manitoba-body">
          <div className="acceptance-letter-manitoba-salutation">{preview.manitoba_salutation || `Dear ${preview.student_name || 'Firstname Lastname'},`}</div>
          <p className="acceptance-letter-manitoba-paragraph">{preview.manitoba_intro_text || preview.offer_text}</p>
          <p className="acceptance-letter-manitoba-paragraph">{preview.manitoba_deposit_text || preview.conditions}</p>
          <p className="acceptance-letter-manitoba-paragraph">{preview.manitoba_admission_text || preview.closing_text}</p>
          <p className="acceptance-letter-manitoba-paragraph">{preview.manitoba_failure_text || 'Failure to pay the deposit by the due date will result in the cancellation of your admission offer.'}</p>
          <p className="acceptance-letter-manitoba-paragraph">{preview.manitoba_decline_text || 'If you do not intend to accept this admission offer, please contact us as soon as possible.'}</p>
          <p className="acceptance-letter-manitoba-paragraph">{preview.manitoba_contact_text || 'If you have any questions or concerns regarding your offer, please contact Student Services.'}</p>

          <div className="acceptance-letter-manitoba-signoff">
            <div className="acceptance-letter-manitoba-closing">{preview.manitoba_closing_text || 'Sincerely,'}</div>
            <div className="acceptance-letter-manitoba-signature-line">
              {preview.signature_image_url ? (
                <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : (
                <span className="acceptance-letter-manitoba-script">{preview.manitoba_signature_script || preview.manitoba_signature_name || preview.signatory_name}</span>
              )}
            </div>
            <div className="acceptance-letter-manitoba-signature-name">{preview.manitoba_signature_name || preview.signatory_name}</div>
            <div className="acceptance-letter-manitoba-signature-title">{preview.manitoba_signature_title || preview.signatory_title}</div>
            <div className="acceptance-letter-manitoba-signature-unit">{preview.manitoba_signature_unit || 'Extended Education'}</div>
          </div>
        </div>

        <div className="acceptance-letter-manitoba-footnotes">
          <ol>
            {footnotes.map((note, index) => (
              <li key={`manitoba-footnote-${index}`}>{note}</li>
            ))}
          </ol>
          <div className="acceptance-letter-manitoba-footer-link">{preview.footer_text || 'www.youruniversity.edu'}</div>
        </div>
      </div>
    </div>
  )
}

function renderOttawaLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-ottawa" style={styles}>
      <div className="acceptance-letter-ottawa-sheet">
        <div className="acceptance-letter-ottawa-letterhead">
          <div className="acceptance-letter-ottawa-logo-wrap">
            <div className="acceptance-letter-ottawa-logo">
              {preview.university_logo_url ? (
                <img src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : (
                <svg viewBox="0 0 42 42" aria-hidden="true">
                  <rect x="8" y="14" width="26" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <polyline points="5,14 21,4 37,14" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="17" y="26" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="10" y="18" width="5" height="4" fill="none" stroke="currentColor" strokeWidth="1" />
                  <rect x="27" y="18" width="5" height="4" fill="none" stroke="currentColor" strokeWidth="1" />
                  <rect x="18" y="1" width="6" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
                  <line x1="21" y1="0" x2="21" y2="2" stroke="currentColor" strokeWidth="1" />
                </svg>
              )}
            </div>
            <div className="acceptance-letter-ottawa-wordmark">{preview.ottawa_wordmark || 'uExcellence'}</div>
          </div>

          <div className="acceptance-letter-ottawa-dept-row">
            <div className="acceptance-letter-ottawa-dept-col">
              {renderAcceptanceTextBlocks(preview.ottawa_dept_left, 'ottawa-dept-left', 'acceptance-letter-ottawa-dept-text')}
            </div>
            <div className="acceptance-letter-ottawa-dept-divider" />
            <div className="acceptance-letter-ottawa-dept-col">
              {renderAcceptanceTextBlocks(preview.ottawa_dept_right, 'ottawa-dept-right', 'acceptance-letter-ottawa-dept-text')}
            </div>
          </div>
        </div>

        <div className="acceptance-letter-ottawa-date">{preview.ottawa_date_line || formatDate(preview.offer_date) || 'May 19, 2026'}</div>

        <div className="acceptance-letter-ottawa-recipient">
          <div>{preview.ottawa_recipient_name || preview.student_name || 'Firstname Lastname'}</div>
          {renderAcceptanceTextBlocks(preview.ottawa_recipient_address, 'ottawa-recipient-address', 'acceptance-letter-ottawa-recipient-line')}
        </div>

        <div className="acceptance-letter-ottawa-student-number">
          Student number: {preview.ottawa_student_number || '30000134'}
        </div>

        <div className="acceptance-letter-ottawa-salutation">{preview.ottawa_salutation || `Dear ${preview.student_name || 'Firstname Lastname'},`}</div>

        <div className="acceptance-letter-ottawa-body">
          <p>{preview.ottawa_intro_text || preview.offer_text}</p>
          <div className="acceptance-letter-ottawa-program-block">
            {renderAcceptanceTextBlocks(preview.ottawa_program_block, 'ottawa-program-block', 'acceptance-letter-ottawa-program-line')}
          </div>
          <p>{preview.ottawa_next_text || 'We ask that you carefully read this offer and respond by the prescribed deadline in order to secure your place in the program.'}</p>
          <p>{preview.ottawa_program_text || preview.offer_text}</p>
          <p>{preview.ottawa_housing_text || 'The University guarantees you a room in residence in order to hold your room, follow the instructions on the housing Portal and be sure to pay the housing deposit by the deadline.'}</p>
          <p>{preview.ottawa_enrolment_text || 'We are sending you more information on course enrolment once you have accepted your offer of admission.'}</p>
          <p>{preview.ottawa_contact_text || 'If you have any questions regarding this offer or about the University of Excellence, do not hesitate to contact us.'}</p>
          <p>{preview.ottawa_closing_text || 'We look forward to welcoming you as a University of Excellence student!'}</p>

          <div className="acceptance-letter-ottawa-signoff">
            <div className="acceptance-letter-ottawa-closing">Sincerely,</div>
            <div className="acceptance-letter-ottawa-signature-script">
              {preview.signature_image_url ? (
                <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : (
                <span>{preview.ottawa_signature_script || preview.ottawa_signature_name || preview.signatory_name}</span>
              )}
            </div>
            <div className="acceptance-letter-ottawa-signature-name">{preview.ottawa_signature_name || preview.signatory_name}</div>
            <div className="acceptance-letter-ottawa-signature-title">{preview.ottawa_signature_title || preview.signatory_title}</div>
            <div className="acceptance-letter-ottawa-signature-unit">{preview.ottawa_signature_unit || 'Extended Education'}</div>
          </div>
        </div>

        <div className="acceptance-letter-ottawa-footers">
          <div className="acceptance-letter-ottawa-footer-col">
            {renderAcceptanceTextBlocks(preview.ottawa_footer_left, 'ottawa-footer-left', 'acceptance-letter-ottawa-footer-line')}
          </div>
          <div className="acceptance-letter-ottawa-footer-col">
            {renderAcceptanceTextBlocks(preview.ottawa_footer_right, 'ottawa-footer-right', 'acceptance-letter-ottawa-footer-line')}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderUBCLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-ubc" style={styles}>
      <div className="acceptance-letter-ubc-sheet">
        <div className="acceptance-letter-ubc-letterhead">
          <div className="acceptance-letter-ubc-logo-wrap">
            {preview.university_logo_url ? (
              <img className="acceptance-letter-ubc-crest-svg" src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <svg className="acceptance-letter-ubc-crest-svg" viewBox="0 0 52 60" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2 H50 V36 C50 50 26 58 26 58 C26 58 2 50 2 36 Z" fill="#002145" stroke="#001530" strokeWidth="0.8" />
                <path d="M5.5 5.5 H46.5 V35 C46.5 47 26 54.5 26 54.5 C26 54.5 5.5 47 5.5 35 Z" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
                <ellipse cx="19" cy="30" rx="9" ry="6" fill="none" stroke="#fff" strokeWidth="1.2" />
                <ellipse cx="33" cy="30" rx="9" ry="6" fill="none" stroke="#fff" strokeWidth="1.2" />
                <line x1="26" y1="24.5" x2="26" y2="35.5" stroke="#fff" strokeWidth="1.2" />
                <line x1="26" y1="10" x2="26" y2="23" stroke="#fff" strokeWidth="1.5" />
                <ellipse cx="26" cy="8.5" rx="3" ry="4" fill="#FFD700" stroke="#FFD700" strokeWidth="0.5" />
                <ellipse cx="26" cy="9.5" rx="1.8" ry="2.5" fill="#fff" />
                <circle cx="14" cy="14" r="1.2" fill="#FFD700" />
                <circle cx="38" cy="14" r="1.2" fill="#FFD700" />
              </svg>
            )}
            <div className="acceptance-letter-ubc-name-block">
              <div className="acceptance-letter-ubc-top">The University of</div>
              <div className="acceptance-letter-ubc-main">{preview.university_name}</div>
              <div className="acceptance-letter-ubc-sub">Est. 1908 · {preview.university_city || 'Vancouver'}</div>
            </div>
          </div>
          <div className="acceptance-letter-ubc-dept-block">
            <div className="acceptance-letter-ubc-dept-title">Student and Enrolment Services</div>
            Office of Admissions<br />
            105 Administration Place<br />
            {preview.university_city || 'Vancouver'}, BC&nbsp;V6T&nbsp;1Z4<br />
            Canada<br />
            Tel: 604-822-2211<br />
            <a href="mailto:admissions@ubc.ca">admissions@ubc.ca</a><br />
            <a href="https://www.ubc.ca">www.ubc.ca</a>
          </div>
        </div>

        <div className="acceptance-letter-ubc-date-line">{formatDate(preview.offer_date) || 'July 1, 2026'}</div>

        <div className="acceptance-letter-ubc-recipient-block">
          <div>{preview.student_name || 'Applicant Name'}</div>
          <div>{preview.nsid || 'NS000000'}</div>
          <div>{preview.university_city || 'Vancouver, Canada'}</div>
        </div>

        <div className="acceptance-letter-ubc-subject-line">Re: Offer of Admission – {preview.university_name}</div>

        <div className="acceptance-letter-ubc-salutation">Dear {preview.student_name || 'Applicant'},</div>

        <div className="acceptance-letter-ubc-body-text">
          <p>{preview.ubc_intro_text || preview.offer_text || 'On behalf of the Admissions and Financial Aid Committee, it is our pleasure to offer you admission to the University of British Columbia. You must now satisfy the admission and enrolment conditions outlined in this letter, and abide by all University policies and procedures.'}</p>
          <p>{preview.ubc_summary_text || 'The Admissions Committee has taken great care to review your transcripts, your extracurricular involvement, and your references. Through your documents and references we have come to understand who you are as a student and community member. We look forward to welcoming you into the UBC community this coming year.'}</p>
          <p>{preview.ubc_offer_intro || `Congratulations, ${preview.student_name || 'Applicant'}! We are pleased to offer you admission to the following program, entry term and location:`}</p>

          <div className="acceptance-letter-ubc-program-details">
            <div className="field-row">
              <span className="field-label">Program:</span>
              <span className="field-value">{preview.program_name || 'Program Name'}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Entry term:</span>
              <span className="field-value">{preview.intake_term || 'Fall 2026'}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Location:</span>
              <span className="field-value">{preview.university_name || 'University Name'}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Student number:</span>
              <span className="field-value">{preview.student_number || '00000000'}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Network access ID (NSID):</span>
              <span className="field-value">{preview.nsid || 'NS000000'}</span>
            </div>
          </div>

          <p>{preview.ubc_why_text || 'In selecting UBC, you have chosen well. With a research infrastructure unique in Canada and a rich cultural community unlike anywhere else, UBC is a place where opportunities to learn, grow and connect are without limit.'}</p>

          <div className="acceptance-letter-ubc-conditions-heading">Conditions of your Offer of Admission</div>
          <p>{preview.ubc_conditions_text || preview.conditions || 'Your offer of admission is conditional upon your continued satisfactory performance in your current studies. You are expected to maintain the academic standing required for admission and to provide official final transcripts confirming the completion of all requirements before your first day of classes.'}</p>
          <p>{preview.ubc_next_steps_text || 'To let us know if you will accept your offer of admission, log on to your UBC Student Centre and follow the steps to confirm your enrolment no later than the deadline shown below. A non-refundable tuition deposit is required to secure your place in the program.'}</p>
          <p>{preview.ubc_contact_text || 'If you have any questions about your admission or the offer process, contact UBC Admissions by email or visit the UBC international admissions page.'}</p>
        </div>

        <div className="acceptance-letter-ubc-signature-block">
          <div>Sincerely,</div>
          <div className="acceptance-letter-ubc-signature-name">{preview.ubc_signature_script || preview.signatory_name}</div>
          <div className="acceptance-letter-ubc-signature-title">{preview.signatory_title}</div>
          <div>{preview.university_name}</div>
        </div>

        <hr className="acceptance-letter-ubc-footer-rule" />
        <div className="acceptance-letter-ubc-footer-text">{preview.ubc_closing_text || preview.footer_text || 'University of British Columbia · 2329 West Mall, Vancouver, BC V6T 1Z4 Canada · admissions@ubc.ca · www.ubc.ca'}</div>
      </div>
    </div>
  )
}

function renderMcGillLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-mcgill" style={styles}>
      <div className="acceptance-letter-mcgill-sheet">
        <header className="acceptance-letter-mcgill-letterhead">
          <div className="acceptance-letter-mcgill-wordmark">{preview.mcgill_wordmark_text}</div>
          <div className="acceptance-letter-mcgill-tagline">{preview.mcgill_tagline_text}</div>
        </header>

        <div className="acceptance-letter-mcgill-headline">
          <div className="acceptance-letter-mcgill-headmark">
            <div className="acceptance-letter-mcgill-wordmark">{preview.mcgill_wordmark_text}</div>
            <div className="acceptance-letter-mcgill-tagline">{preview.mcgill_tagline_text}</div>
          </div>
          <div className="acceptance-letter-mcgill-address-block">
            <div className="acceptance-letter-mcgill-sender-dept">{preview.mcgill_sender_dept_name}</div>
            {preview.mcgill_sender_address.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>

        <div className="acceptance-letter-mcgill-top-row">
          <div className="acceptance-letter-mcgill-date-line">{preview.mcgill_date_line}</div>
          <div className="acceptance-letter-mcgill-subject-line">{preview.mcgill_subject_line}</div>
        </div>

        <div className="acceptance-letter-mcgill-recipient-block">
          {preview.mcgill_recipient_block.split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>

        <div className="acceptance-letter-mcgill-salutation">{preview.mcgill_salutation}</div>

        <div className="acceptance-letter-mcgill-copy">
          <p>{preview.mcgill_intro_text}</p>
          <p>{preview.mcgill_paragraph_two}</p>
          <p>{preview.mcgill_paragraph_three}</p>
          <p>{preview.mcgill_paragraph_four}</p>
          <p>{preview.mcgill_closing_text}</p>
        </div>

        <div className="acceptance-letter-mcgill-signature">
          <div className="acceptance-letter-mcgill-signature-script">{preview.mcgill_signature_script}</div>
          <div className="acceptance-letter-mcgill-signature-name">{preview.mcgill_signature_name}</div>
          <div className="acceptance-letter-mcgill-signature-title">{preview.mcgill_signature_title}</div>
        </div>

        <footer className="acceptance-letter-mcgill-footer">{preview.mcgill_footer_text}</footer>
      </div>
    </div>
  )
}

function renderSpaceTechLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-space-tech" style={styles}>
      <div className="acceptance-letter-space-tech-header">
        <div>
          <div className="acceptance-letter-space-tech-tag">Admission Brief</div>
          <h3>{preview.university_name}</h3>
          <p>{preview.university_destination}</p>
        </div>
        <div className="acceptance-letter-banner-detail">
          {preview.university_logo_url ? (
            <img src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <div className="acceptance-letter-brand acceptance-letter-brand-banner">{getInitials(preview.university_name)}</div>
          )}
        </div>
      </div>

      <div className="acceptance-letter-space-tech-grid">
        <div className="acceptance-letter-space-tech-copy">
          <div className="acceptance-letter-greeting">Dear {preview.student_name || 'Applicant'},</div>
          <div className="acceptance-letter-body-copy">
            {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
          </div>
          {preview.conditions ? (
            <div className="acceptance-letter-space-tech-panel">
              <strong>Conditions</strong>
              {renderAcceptanceTextBlocks(preview.conditions, 'conditions')}
            </div>
          ) : null}
        </div>
        <aside className="acceptance-letter-space-tech-aside">
          <div className="acceptance-letter-meta-card">
            <span>Reference</span>
            <strong>{preview.reference_number}</strong>
          </div>
          <div className="acceptance-letter-meta-card">
            <span>Start date</span>
            <strong>{formatDate(preview.start_date) || 'TBC'}</strong>
          </div>
          <div className="acceptance-letter-meta-card">
            <span>Deadline</span>
            <strong>{formatDate(preview.acceptance_deadline) || 'Within 30 days'}</strong>
          </div>
          <div className="acceptance-letter-gift-box-accent">
            <strong>{preview.program_name || 'Program not set'}</strong>
            <p>{preview.program_level}</p>
          </div>
        </aside>
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-banner">
        <div className="acceptance-letter-signature-block">
          <div className="acceptance-letter-signature-label">Sincerely,</div>
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
        <div className={`acceptance-letter-stamp${preview.stamp_image_url ? ' has-image' : ''}`}>
          {preview.stamp_image_url ? (
            <img src={preview.stamp_image_url} alt="Admission stamp" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>ADMITTED</span>
          )}
        </div>
      </div>
    </div>
  )
}

function renderGiftBoxLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-gift-box" style={styles}>
      <div className="acceptance-letter-gift-box-header">
        <div>
          <div className="acceptance-letter-gift-box-tag">Admission Offer</div>
          <h3>{preview.university_name}</h3>
          <p>{preview.university_destination}</p>
        </div>
        <div className="acceptance-letter-banner-detail">
          {preview.university_logo_url ? (
            <img src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <div className="acceptance-letter-brand acceptance-letter-brand-banner">{getInitials(preview.university_name)}</div>
          )}
        </div>
      </div>

      <div className="acceptance-letter-gift-box-body">
        <div className="acceptance-letter-greeting">Dear {preview.student_name || 'Applicant'},</div>
        <div className="acceptance-letter-body-copy">
          {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
        </div>

        <div className="acceptance-letter-gift-box-panel">
          <div className="acceptance-letter-meta-card">
            <span>Program</span>
            <strong>{preview.program_name || 'Not set'}</strong>
          </div>
          <div className="acceptance-letter-meta-card">
            <span>Start</span>
            <strong>{formatDate(preview.start_date) || 'TBC'}</strong>
          </div>
          <div className="acceptance-letter-gift-box-accent">
            <strong>Offer expires</strong>
            <p>{formatDate(preview.acceptance_deadline) || 'Within 30 days'}</p>
          </div>
        </div>
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-banner">
        <div className="acceptance-letter-signature-block">
          <div className="acceptance-letter-signature-label">Sincerely,</div>
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
        <div className={`acceptance-letter-stamp${preview.stamp_image_url ? ' has-image' : ''}`}>
          {preview.stamp_image_url ? (
            <img src={preview.stamp_image_url} alt="Admission stamp" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>ADMITTED</span>
          )}
        </div>
      </div>
    </div>
  )
}

function renderClassicLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-classic" style={styles}>
      <div className="acceptance-letter-header acceptance-letter-header-classic">
        <div className="acceptance-letter-header-copy">
          <div className="acceptance-letter-kicker">{preview.presentation.kicker || 'Official Admission'}</div>
          <h3>{preview.university_name}</h3>
          <p>
            {preview.university_destination}
            {preview.university_city ? ` • ${preview.university_city}` : ''}
          </p>
        </div>
        <div className="acceptance-letter-brand">
          {preview.university_logo_url ? (
            <img src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>{getInitials(preview.university_name)}</span>
          )}
        </div>
      </div>

      <div className="acceptance-letter-meta-row acceptance-letter-meta-row-classic">
        <div className="acceptance-letter-meta-card">
          <span>Reference</span>
          <strong>{preview.reference_number}</strong>
        </div>
        <div className="acceptance-letter-meta-card">
          <span>Offer date</span>
          <strong>{formatDate(preview.offer_date) || 'To be confirmed'}</strong>
        </div>
        <div className="acceptance-letter-meta-card">
          <span>Intake</span>
          <strong>{preview.intake_term || 'Not set'}</strong>
        </div>
      </div>

      <div className="acceptance-letter-body acceptance-letter-body-classic">
        <div className="acceptance-letter-greeting">Dear {preview.student_name || 'Applicant'},</div>
        <div className="acceptance-letter-body-copy">
          {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
        </div>

        <div className="acceptance-letter-details acceptance-letter-details-classic">
          <div className="acceptance-letter-details-grid">
            <div className="acceptance-letter-detail">
              <span>Program</span>
              <strong>{preview.program_name || 'Not set'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Level</span>
              <strong>{preview.program_level || 'Not set'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Start date</span>
              <strong>{formatDate(preview.start_date) || 'To be confirmed'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Deadline</span>
              <strong>{formatDate(preview.acceptance_deadline) || 'Please respond within 30 days'}</strong>
            </div>
          </div>
        </div>

        {preview.conditions ? (
          <div className="acceptance-letter-conditions acceptance-letter-conditions-classic">
            <h4>Conditions of Offer</h4>
            {renderAcceptanceTextBlocks(preview.conditions, 'conditions')}
          </div>
        ) : null}
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-classic">
        <div className="acceptance-letter-seal">
          {preview.seal_image_url ? (
            <img src={preview.seal_image_url} alt="University seal" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <div className="acceptance-letter-seal-fallback">{getInitials(preview.university_name)}</div>
          )}
        </div>
        <div className="acceptance-letter-signature-block">
          <div className="acceptance-letter-signature-label">Sincerely,</div>
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
        <div className={`acceptance-letter-stamp${preview.stamp_image_url ? ' has-image' : ''}`}>
          {preview.stamp_image_url ? (
            <img src={preview.stamp_image_url} alt="Admission stamp" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>ADMITTED</span>
          )}
        </div>
      </div>

      <div className="acceptance-letter-footer acceptance-letter-footer-classic">
        <span>{preview.footer_text}</span>
        <strong>{preview.university_slug ? preview.university_slug.toUpperCase() : 'BRIGHTPATH'}</strong>
      </div>
    </div>
  )
}

function renderBannerLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-banner" style={styles}>
      <div className="acceptance-letter-banner-top">
        <div>
          <span className="acceptance-letter-banner-label">Official Admission</span>
          <h3>{preview.university_name}</h3>
          <p>{preview.presentation.kicker || 'Admission Notice'}</p>
        </div>
        <div className="acceptance-letter-banner-detail">
          {preview.university_logo_url ? (
            <img src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <div className="acceptance-letter-brand acceptance-letter-brand-banner">{getInitials(preview.university_name)}</div>
          )}
        </div>
      </div>

      <div className="acceptance-letter-body acceptance-letter-banner-body">
        <div className="acceptance-letter-meta-row acceptance-letter-meta-row-banner">
          <div className="acceptance-letter-meta-card">
            <span>Program</span>
            <strong>{preview.program_name || 'Not set'}</strong>
          </div>
          <div className="acceptance-letter-meta-card">
            <span>Level</span>
            <strong>{preview.program_level || 'Not set'}</strong>
          </div>
          <div className="acceptance-letter-meta-card">
            <span>Start date</span>
            <strong>{formatDate(preview.start_date) || 'TBC'}</strong>
          </div>
        </div>

        <div className="acceptance-letter-greeting">Dear {preview.student_name || 'Applicant'},</div>
        <div className="acceptance-letter-body-copy">
          {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
        </div>

        {preview.conditions ? (
          <div className="acceptance-letter-conditions acceptance-letter-conditions-banner">
            <h4>Terms of Offer</h4>
            {renderAcceptanceTextBlocks(preview.conditions, 'conditions')}
          </div>
        ) : null}
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-banner">
        <div className="acceptance-letter-signature-block">
          <div className="acceptance-letter-signature-label">Sincerely,</div>
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
        <div className="acceptance-letter-stamp acceptance-letter-stamp-banner">
          {preview.stamp_image_url ? (
            <img src={preview.stamp_image_url} alt="Admission stamp" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>ADMITTED</span>
          )}
        </div>
      </div>
    </div>
  )
}

function renderPanelLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-panel" style={styles}>
      <div className="acceptance-letter-header acceptance-letter-header-panel">
        <div className="acceptance-letter-header-copy">
          <div className="acceptance-letter-kicker">{preview.presentation.kicker || 'Admission Letter'}</div>
          <h3>{preview.university_name}</h3>
          <p>{preview.university_destination}</p>
        </div>
        <div className="acceptance-letter-brand acceptance-letter-brand-panel">
          {preview.university_logo_url ? (
            <img src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>{getInitials(preview.university_name)}</span>
          )}
        </div>
      </div>

      <div className="acceptance-letter-panel-grid">
        <div>
          <div className="acceptance-letter-greeting">Dear {preview.student_name || 'Applicant'},</div>
          <div className="acceptance-letter-body-copy">
            {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
          </div>
          {preview.conditions ? (
            <div className="acceptance-letter-conditions acceptance-letter-conditions-panel">
              <h4>Offer Conditions</h4>
              {renderAcceptanceTextBlocks(preview.conditions, 'conditions')}
            </div>
          ) : null}
        </div>

        <aside className="acceptance-letter-side-panel">
          <div className="acceptance-letter-meta-card">
            <span>Reference</span>
            <strong>{preview.reference_number}</strong>
          </div>
          <div className="acceptance-letter-meta-card">
            <span>Offer date</span>
            <strong>{formatDate(preview.offer_date) || 'TBC'}</strong>
          </div>
          <div className="acceptance-letter-meta-card">
            <span>Deadline</span>
            <strong>{formatDate(preview.acceptance_deadline) || 'Within 30 days'}</strong>
          </div>
          <div className="acceptance-letter-detail acceptance-letter-detail-panel">
            <span>Start date</span>
            <strong>{formatDate(preview.start_date) || 'TBC'}</strong>
          </div>
        </aside>
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-panel">
        <div className="acceptance-letter-seal acceptance-letter-seal-panel">
          {preview.seal_image_url ? (
            <img src={preview.seal_image_url} alt="University seal" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <div className="acceptance-letter-seal-fallback">{getInitials(preview.university_name)}</div>
          )}
        </div>
        <div className="acceptance-letter-signature-block">
          <div className="acceptance-letter-signature-label">Sincerely,</div>
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
        <div className={`acceptance-letter-stamp${preview.stamp_image_url ? ' has-image' : ''}`}>
          {preview.stamp_image_url ? (
            <img src={preview.stamp_image_url} alt="Admission stamp" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>ADMITTED</span>
          )}
        </div>
      </div>
    </div>
  )
}

function renderEditorialLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-editorial" style={styles}>
      <div className="acceptance-letter-header acceptance-letter-header-editorial">
        <div className="acceptance-letter-header-copy">
          <div className="acceptance-letter-kicker">{preview.presentation.kicker || 'Official Offer'}</div>
          <h3>{preview.university_name}</h3>
          <p>{preview.university_destination}</p>
        </div>
      </div>

      <div className="acceptance-letter-editorial-mast">
        <div>
          <span>Ref:</span>
          <strong>{preview.reference_number}</strong>
        </div>
        <div>
          <span>Date:</span>
          <strong>{formatDate(preview.offer_date) || 'TBC'}</strong>
        </div>
      </div>

      <div className="acceptance-letter-body acceptance-letter-body-editorial">
        <div className="acceptance-letter-greeting">Dear {preview.student_name || 'Applicant'},</div>
        <div className="acceptance-letter-body-copy">
          {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
        </div>

        <div className="acceptance-letter-details editorial-details">
          <div className="acceptance-letter-details-grid">
            <div className="acceptance-letter-detail">
              <span>Program</span>
              <strong>{preview.program_name || 'Not set'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Level</span>
              <strong>{preview.program_level || 'Not set'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Start</span>
              <strong>{formatDate(preview.start_date) || 'TBC'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Deadline</span>
              <strong>{formatDate(preview.acceptance_deadline) || '30 days'}</strong>
            </div>
          </div>
        </div>

        {preview.conditions ? (
          <div className="acceptance-letter-conditions acceptance-letter-conditions-editorial">
            <h4>Conditions of Offer</h4>
            {renderAcceptanceTextBlocks(preview.conditions, 'conditions')}
          </div>
        ) : null}
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-editorial">
        <div className="acceptance-letter-signature-block">
          <div className="acceptance-letter-signature-label">Kind regards,</div>
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
      </div>
    </div>
  )
}

function renderCrestLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-crest" style={styles}>
      <div className="acceptance-letter-crest-hero">
        <div className="acceptance-letter-crest-badge">{preview.presentation.kicker || 'Official Admission'}</div>
        <div className="acceptance-letter-crest-title">
          <h3>{preview.university_name}</h3>
          <p>{preview.university_destination}</p>
        </div>
        <div className="acceptance-letter-brand acceptance-letter-brand-crest">
          {preview.university_logo_url ? (
            <img src={preview.university_logo_url} alt="University logo" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>{getInitials(preview.university_name)}</span>
          )}
        </div>
      </div>

      <div className="acceptance-letter-body acceptance-letter-body-crest">
        <div className="acceptance-letter-greeting">Dear {preview.student_name || 'Applicant'},</div>
        <div className="acceptance-letter-body-copy">
          {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
        </div>

        <div className="acceptance-letter-details acceptance-letter-details-crest">
          <div className="acceptance-letter-details-grid">
            <div className="acceptance-letter-detail">
              <span>Program</span>
              <strong>{preview.program_name || 'Not set'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Level</span>
              <strong>{preview.program_level || 'Not set'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Start</span>
              <strong>{formatDate(preview.start_date) || 'TBC'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Deadline</span>
              <strong>{formatDate(preview.acceptance_deadline) || '30 days'}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-crest">
        <div className="acceptance-letter-signature-block">
          <div className="acceptance-letter-signature-label">Sincerely,</div>
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
        <div className={`acceptance-letter-stamp${preview.stamp_image_url ? ' has-image' : ''}`}>
          {preview.stamp_image_url ? (
            <img src={preview.stamp_image_url} alt="Admission stamp" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>ADMITTED</span>
          )}
        </div>
      </div>
    </div>
  )
}

function renderHeritageLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-heritage" style={styles}>
      <div className="acceptance-letter-heritage-banner">
        <div className="acceptance-letter-heritage-mark">Heritage Edition</div>
        <div className="acceptance-letter-heritage-title">
          <h3>{preview.university_name}</h3>
          <p>{preview.university_destination}</p>
        </div>
      </div>

      <div className="acceptance-letter-body acceptance-letter-body-heritage">
        <div className="acceptance-letter-greeting">Dear {preview.student_name || 'Applicant'},</div>
        <div className="acceptance-letter-body-copy">
          {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
        </div>

        <div className="acceptance-letter-details acceptance-letter-details-heritage">
          <div className="acceptance-letter-details-grid">
            <div className="acceptance-letter-detail">
              <span>Program</span>
              <strong>{preview.program_name || 'Not set'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Level</span>
              <strong>{preview.program_level || 'Not set'}</strong>
            </div>
          </div>
          <div className="acceptance-letter-details-grid">
            <div className="acceptance-letter-detail">
              <span>Start date</span>
              <strong>{formatDate(preview.start_date) || 'TBC'}</strong>
            </div>
            <div className="acceptance-letter-detail">
              <span>Deadline</span>
              <strong>{formatDate(preview.acceptance_deadline) || '30 days'}</strong>
            </div>
          </div>
        </div>

        {preview.conditions ? (
          <div className="acceptance-letter-conditions acceptance-letter-conditions-heritage">
            <h4>Offer Conditions</h4>
            {renderAcceptanceTextBlocks(preview.conditions, 'conditions')}
          </div>
        ) : null}
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-heritage">
        <div className="acceptance-letter-crest-mark">
          {preview.seal_image_url ? (
            <img src={preview.seal_image_url} alt="University seal" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>{getInitials(preview.university_name)}</span>
          )}
        </div>

        <div className="acceptance-letter-signature-block">
          <div className="acceptance-letter-signature-label">With respect,</div>
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
      </div>
    </div>
  )
}

function renderTicketLayout(preview, styles) {
  return (
    <div className="acceptance-letter-page acceptance-letter-page-ticket" style={styles}>
      <div className="acceptance-letter-ticket-top">
        <div>
          <span className="acceptance-letter-ticket-badge">ADMISSIONS PASS</span>
          <h3>{preview.university_name}</h3>
        </div>
        <div className="acceptance-letter-ticket-meta">
          <span>{preview.presentation.kicker || 'Official Ticket'}</span>
          <strong>{preview.reference_number}</strong>
        </div>
      </div>

      <div className="acceptance-letter-body acceptance-letter-body-ticket">
        <div className="acceptance-letter-ticket-row">
          <div>
            <span>Student</span>
            <strong>{preview.student_name || 'Applicant'}</strong>
          </div>
          <div>
            <span>Program</span>
            <strong>{preview.program_name || 'Not set'}</strong>
          </div>
        </div>

        <div className="acceptance-letter-content-ticket">
          {renderAcceptanceTextBlocks(preview.offer_text, 'offer-text')}
        </div>

        <div className="acceptance-letter-ticket-row">
          <div>
            <span>Start</span>
            <strong>{formatDate(preview.start_date) || 'TBC'}</strong>
          </div>
          <div>
            <span>Deadline</span>
            <strong>{formatDate(preview.acceptance_deadline) || '30 days'}</strong>
          </div>
        </div>
      </div>

      <div className="acceptance-letter-signature acceptance-letter-signature-ticket">
        <div className="acceptance-letter-ticket-stamp">
          {preview.stamp_image_url ? (
            <img src={preview.stamp_image_url} alt="Admission stamp" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          ) : (
            <span>ADMITTED</span>
          )}
        </div>
        <div className="acceptance-letter-signature-block">
          <div className={`acceptance-letter-signature-line${preview.signature_image_url ? ' has-image' : ''}`}>
            {preview.signature_image_url ? (
              <img src={preview.signature_image_url} alt="Registrar signature" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span className="acceptance-letter-script">Registrar</span>
            )}
          </div>
          <div className="acceptance-letter-signatory-name">{preview.signatory_name}</div>
          <div className="acceptance-letter-signatory-title">{preview.signatory_title}</div>
        </div>
      </div>
    </div>
  )
}

function splitTextBlocks(text) {
  return `${text ?? ''}`
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function renderAcceptanceTextBlocks(text, keyPrefix, className = '') {
  const blocks = splitTextBlocks(text)
  return blocks.map((block, index) => {
    const lines = block.split(/\r?\n/).map((line) => line.trimEnd())
    const firstLine = lines[0] || ''
    const remainder = lines.slice(1).join('\n').trim()
    const headingMatch = firstLine.match(/^(.+?:)\s*$/)

    if (headingMatch && remainder) {
      return (
        <section key={`${keyPrefix}-${index}`} className={`acceptance-text-block has-heading ${className}`.trim()}>
          <h4>{headingMatch[1]}</h4>
          <p>{remainder}</p>
        </section>
      )
    }

    if (headingMatch) {
      return (
        <section key={`${keyPrefix}-${index}`} className={`acceptance-text-block has-heading ${className}`.trim()}>
          <h4>{headingMatch[1]}</h4>
        </section>
      )
    }

    return (
      <p key={`${keyPrefix}-${index}`} className={`acceptance-text-block ${className}`.trim()}>
        {block}
      </p>
    )
  })
}

function buildImageUploadPath(recordId, fieldKey, file) {
  const safeName = (file?.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `acceptance-letter-builder/${recordId}/${fieldKey}/${Date.now()}-${safeName || 'upload'}`
}

function getAcceptanceImageLabel(fieldKey) {
  const field = ACCEPTANCE_IMAGE_FIELDS.find((item) => item.key === fieldKey)
  return field?.label || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function AcceptanceLetterBuilder({ onNotice = () => {} }) {
  const [draft, setDraft] = useState(createBlankAcceptanceRecord())
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [uploadingField, setUploadingField] = useState('')
  const [exporting, setExporting] = useState(false)
  const [notice, setNotice] = useState('')
  const stageRef = useRef(null)

  const preview = buildAcceptancePreview(draft)

  useEffect(() => {
    if (!preview.university) return undefined

    setDraft((current) => ({
      ...current,
      university_slug: preview.university.slug,
      university_name: preview.university.name,
      university_destination: preview.university.destination,
      university_city: preview.university.city,
    }))

    return undefined
  }, [preview.university?.slug])

  useEffect(() => {
    if (draft.university_slug || !ACCEPTANCE_UNIVERSITY_OPTIONS.length) return

    const firstUniversity = ACCEPTANCE_UNIVERSITY_OPTIONS[0]
    if (!firstUniversity) return

    setDraft((current) => {
      if (current.university_slug) return current
      return {
        ...current,
        university_slug: firstUniversity.slug,
        university_name: firstUniversity.name,
        university_destination: firstUniversity.destination,
        university_city: firstUniversity.city,
      }
    })
  }, [])

  const availableUniversities = useMemo(() => ACCEPTANCE_UNIVERSITY_OPTIONS, [])

  const filteredUniversities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) return availableUniversities

    return availableUniversities.filter((item) => {
      const haystack = [item.name, item.destination, item.city, item.type].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [availableUniversities, searchTerm])

  const groupedUniversities = useMemo(() => {
    const groups = new Map()

    filteredUniversities.forEach((item) => {
      const destination = item.destination || 'Other'
      if (!groups.has(destination)) groups.set(destination, [])
      groups.get(destination).push(item)
    })

    return DESTINATION_ORDER.map((destination) => ({
      destination,
      items: groups.get(destination) || [],
    })).filter((group) => group.items.length)
  }, [filteredUniversities])

  const totalUniversities = ACCEPTANCE_UNIVERSITY_OPTIONS.length

  function notify(message) {
    setNotice(message)
    onNotice(message)
  }

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function handleUniversitySelect(university) {
    setDraft((current) => ({
      ...current,
      university_slug: university.slug,
      university_name: university.name,
      university_destination: university.destination,
      university_city: university.city,
    }))
    setSearchTerm(university.name)
    setDropdownOpen(false)
    notify(`Selected ${university.name}.`)
  }

  async function handleImageUpload(fieldKey, file) {
    if (!file) return

    setUploadingField(fieldKey)
    try {
      const filePath = buildImageUploadPath(draft.id, fieldKey, file)
      const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath)
      setDraft((current) => ({ ...current, [fieldKey]: data.publicUrl }))
      notify(`${getAcceptanceImageLabel(fieldKey)} uploaded.`)
    } catch (error) {
      console.error('[AcceptanceLetterBuilder] Image upload failed:', error)
      notify(error.message || 'Could not upload the image.')
    } finally {
      setUploadingField('')
    }
  }

  function clearImageField(fieldKey) {
    setDraft((current) => ({ ...current, [fieldKey]: '' }))
    notify(`${getAcceptanceImageLabel(fieldKey)} removed.`)
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
          {value ? <img src={value} alt={field.label} /> : <div className="certificate-image-placeholder"><span>{field.label}</span></div>}
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

  function handleCopySummary() {
    const lines = [
      `University: ${draft.university_name || 'Not set'}`,
      `Student: ${draft.student_name || 'Not set'}`,
      `Program: ${draft.program_name || 'Not set'}`,
      `Level: ${draft.program_level || 'Not set'}`,
      `Reference: ${draft.reference_number || 'Not set'}`,
      `Offer date: ${draft.offer_date || 'Not set'}`,
      `Start date: ${draft.start_date || 'Not set'}`,
    ]

    const copyOperation = navigator.clipboard?.writeText(lines.join('\n'))
    if (copyOperation?.then) {
      copyOperation.then(
        () => notify('Acceptance letter summary copied to clipboard.'),
        () => notify('Copy failed. You can still download the PDF.'),
      )
    } else {
      notify('Copy failed. You can still download the PDF.')
    }
  }

  async function handleExportPDF() {
    const stage = stageRef.current
    if (!stage) {
      notify('Could not find the acceptance letter canvas.')
      return
    }

    setExporting(true)
    notify('Preparing acceptance letter PDF...')

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
      const paperBg = preview.presentation.pageBg

      const canvas = await html2canvas(stage, {
        backgroundColor: paperBg,
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        width: stageBounds.width,
        height: stageBounds.height,
        onclone: (clonedDocument) => {
          const clonedStage = clonedDocument.querySelector('.acceptance-letter-stage')
          if (!clonedStage) return

          const clonedPage = clonedStage.querySelector('.acceptance-letter-page')
          if (clonedPage) {
            clonedPage.style.width = `${stageBounds.width}px`
            clonedPage.style.height = `${stageBounds.height}px`
            clonedPage.style.overflow = 'visible'
            clonedPage.style.background = stage.querySelector('.acceptance-letter-page')?.style.background || paperBg
          }

          clonedStage.style.width = `${stageBounds.width}px`
          clonedStage.style.maxWidth = `${stageBounds.width}px`
          clonedStage.style.height = `${stageBounds.height}px`
          clonedStage.style.overflow = 'visible'
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
      let imageWidth = pageWidth
      let imageHeight = (canvas.height * imageWidth) / canvas.width

      if (imageHeight > pageHeight) {
        imageHeight = pageHeight
        imageWidth = (canvas.width * imageHeight) / canvas.height
      }

      const offsetX = Math.max(0, (pageWidth - imageWidth) / 2)
      const offsetY = Math.max(0, (pageHeight - imageHeight) / 2)

      pdf.addImage(imageData, 'PNG', offsetX, offsetY, imageWidth, imageHeight)
      pdf.save(`brightpath-acceptance-letter-${slugify(draft.university_name || 'brightpath') || 'letter'}.pdf`)

      notify('Acceptance letter downloaded successfully!')
    } catch (error) {
      console.error('[AcceptanceLetterBuilder] PDF export failed:', error)
      notify('Could not generate the acceptance letter PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  function handleReset() {
    setDraft(createBlankAcceptanceRecord())
    setSearchTerm('')
    setDropdownOpen(false)
    setNotice('')
    notify('New acceptance letter started.')
  }

  const universityInitials = getInitials(preview.university_name)

  return (
    <section className="admin-panel-card acceptance-letter-shell">
      <div className="admin-panel-card-header acceptance-letter-shell-header">
        <div>
          <h2>Acceptance Letter Builder</h2>
          <p>Build Brightpath university acceptance letters with search, uploadable branding, and print-ready export.</p>
        </div>
        <div className="acceptance-letter-actions">
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleReset}>
            <Plus size={16} />
            New Letter
          </button>
          <button type="button" className="admin-btn admin-btn-soft" onClick={handleCopySummary}>
            Copy Summary
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleExportPDF} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Creating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {notice ? <p className="acceptance-letter-notice">{notice}</p> : null}

      <div className="certificate-builder-layout acceptance-letter-layout">
        <form className="certificate-builder-form acceptance-letter-form" onSubmit={(event) => event.preventDefault()}>
          <div className="acceptance-university-selector">
            <label className="admin-field">
              <span>Search university</span>
              <div className="acceptance-university-search-wrapper">
                <Search size={18} className="acceptance-search-icon" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                    setDropdownOpen(true)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Search universities by name, city, or country..."
                  className="acceptance-university-search-input"
                />
                <button type="button" className="acceptance-dropdown-toggle" onClick={() => setDropdownOpen((current) => !current)}>
                  <ChevronDown size={18} />
                </button>
              </div>
            </label>
            <div className="acceptance-university-count">{totalUniversities} universities loaded</div>

          {dropdownOpen && filteredUniversities.length ? (
              <div className="acceptance-university-dropdown">
                {groupedUniversities.map((group) => (
                  <div key={group.destination} className="acceptance-university-group">
                    <div className="acceptance-university-group-header">
                      <span>{group.destination}</span>
                      <strong>{group.items.length}</strong>
                    </div>
                    {group.items.map((university) => (
                      <button
                        key={university.slug}
                        type="button"
                        className={`acceptance-university-option${preview.university?.slug === university.slug ? ' active' : ''}`}
                        onClick={() => handleUniversitySelect(university)}
                      >
                        <span className="uni-name">{university.name}</span>
                        <span className="uni-meta">{university.city ? `${university.city}, ` : ''}{university.destination} | {university.layoutName || university.type}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {preview.university?.slug === 'university-of-ottawa' ? (
            <div className="acceptance-letter-ottawa-editor">
              <div className="acceptance-letter-ottawa-editor-title">Ottawa letter copy</div>
              <div className="certificate-form-grid work-permit-form-grid">
                <label className="admin-field">
                  <span>Wordmark</span>
                  <input type="text" value={draft.ottawa_wordmark} onChange={(event) => updateField('ottawa_wordmark', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Left department block</span>
                  <textarea rows="3" value={draft.ottawa_dept_left} onChange={(event) => updateField('ottawa_dept_left', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Right department block</span>
                  <textarea rows="3" value={draft.ottawa_dept_right} onChange={(event) => updateField('ottawa_dept_right', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Date line</span>
                  <input type="text" value={draft.ottawa_date_line} onChange={(event) => updateField('ottawa_date_line', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Recipient name</span>
                  <input type="text" value={draft.ottawa_recipient_name} onChange={(event) => updateField('ottawa_recipient_name', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Recipient address</span>
                  <textarea rows="3" value={draft.ottawa_recipient_address} onChange={(event) => updateField('ottawa_recipient_address', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Student number</span>
                  <input type="text" value={draft.ottawa_student_number} onChange={(event) => updateField('ottawa_student_number', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Program block</span>
                  <textarea rows="3" value={draft.ottawa_program_block} onChange={(event) => updateField('ottawa_program_block', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Salutation</span>
                  <input type="text" value={draft.ottawa_salutation} onChange={(event) => updateField('ottawa_salutation', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Intro paragraph</span>
                  <textarea rows="3" value={draft.ottawa_intro_text} onChange={(event) => updateField('ottawa_intro_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Program paragraph</span>
                  <textarea rows="4" value={draft.ottawa_program_text} onChange={(event) => updateField('ottawa_program_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Next step paragraph</span>
                  <textarea rows="3" value={draft.ottawa_next_text} onChange={(event) => updateField('ottawa_next_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Housing paragraph</span>
                  <textarea rows="3" value={draft.ottawa_housing_text} onChange={(event) => updateField('ottawa_housing_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Enrolment paragraph</span>
                  <textarea rows="3" value={draft.ottawa_enrolment_text} onChange={(event) => updateField('ottawa_enrolment_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Contact paragraph</span>
                  <textarea rows="4" value={draft.ottawa_contact_text} onChange={(event) => updateField('ottawa_contact_text', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Closing text</span>
                  <input type="text" value={draft.ottawa_closing_text} onChange={(event) => updateField('ottawa_closing_text', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signature script</span>
                  <input type="text" value={draft.ottawa_signature_script} onChange={(event) => updateField('ottawa_signature_script', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signer name</span>
                  <input type="text" value={draft.ottawa_signature_name} onChange={(event) => updateField('ottawa_signature_name', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signer title</span>
                  <input type="text" value={draft.ottawa_signature_title} onChange={(event) => updateField('ottawa_signature_title', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signer unit</span>
                  <input type="text" value={draft.ottawa_signature_unit} onChange={(event) => updateField('ottawa_signature_unit', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Left footer block</span>
                  <textarea rows="4" value={draft.ottawa_footer_left} onChange={(event) => updateField('ottawa_footer_left', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Right footer block</span>
                  <textarea rows="4" value={draft.ottawa_footer_right} onChange={(event) => updateField('ottawa_footer_right', event.target.value)} />
                </label>
              </div>
            </div>
          ) : null}

          {preview.university?.slug === 'university-of-manitoba' ? (
            <div className="acceptance-letter-manitoba-editor">
              <div className="acceptance-letter-manitoba-editor-title">
                Manitoba letter copy
              </div>
              <div className="certificate-form-grid work-permit-form-grid">
                <label className="admin-field">
                  <span>Header brand</span>
                  <input type="text" value={draft.manitoba_header_brand} onChange={(event) => updateField('manitoba_header_brand', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Department</span>
                  <input type="text" value={draft.manitoba_header_department} onChange={(event) => updateField('manitoba_header_department', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Contact block</span>
                  <textarea rows="5" value={draft.manitoba_contact_block} onChange={(event) => updateField('manitoba_contact_block', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Letter title</span>
                  <input type="text" value={draft.manitoba_title} onChange={(event) => updateField('manitoba_title', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Salutation</span>
                  <input type="text" value={draft.manitoba_salutation} onChange={(event) => updateField('manitoba_salutation', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Student address</span>
                  <input type="text" value={draft.manitoba_student_address} onChange={(event) => updateField('manitoba_student_address', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Passport number</span>
                  <input type="text" value={draft.manitoba_passport_number} onChange={(event) => updateField('manitoba_passport_number', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Student number</span>
                  <input type="text" value={draft.manitoba_student_number} onChange={(event) => updateField('manitoba_student_number', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>BU number</span>
                  <input type="text" value={draft.manitoba_bu_number} onChange={(event) => updateField('manitoba_bu_number', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Date of birth</span>
                  <input type="text" value={draft.manitoba_birth_date} onChange={(event) => updateField('manitoba_birth_date', event.target.value)} placeholder="01 Jan 2000" />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Intro paragraph</span>
                  <textarea rows="4" value={draft.manitoba_intro_text} onChange={(event) => updateField('manitoba_intro_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Deposit paragraph</span>
                  <textarea rows="4" value={draft.manitoba_deposit_text} onChange={(event) => updateField('manitoba_deposit_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Admission paragraph</span>
                  <textarea rows="4" value={draft.manitoba_admission_text} onChange={(event) => updateField('manitoba_admission_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Failure paragraph</span>
                  <textarea rows="3" value={draft.manitoba_failure_text} onChange={(event) => updateField('manitoba_failure_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Decline paragraph</span>
                  <textarea rows="3" value={draft.manitoba_decline_text} onChange={(event) => updateField('manitoba_decline_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Contact paragraph</span>
                  <textarea rows="3" value={draft.manitoba_contact_text} onChange={(event) => updateField('manitoba_contact_text', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Closing text</span>
                  <input type="text" value={draft.manitoba_closing_text} onChange={(event) => updateField('manitoba_closing_text', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Script signature</span>
                  <input type="text" value={draft.manitoba_signature_script} onChange={(event) => updateField('manitoba_signature_script', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signer name</span>
                  <input type="text" value={draft.manitoba_signature_name} onChange={(event) => updateField('manitoba_signature_name', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signer title</span>
                  <input type="text" value={draft.manitoba_signature_title} onChange={(event) => updateField('manitoba_signature_title', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signer unit</span>
                  <input type="text" value={draft.manitoba_signature_unit} onChange={(event) => updateField('manitoba_signature_unit', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Footnotes</span>
                  <textarea rows="4" value={draft.manitoba_footnotes_text} onChange={(event) => updateField('manitoba_footnotes_text', event.target.value)} />
                </label>
              </div>
            </div>
          ) : null}

          {preview.university?.slug === 'university-of-british-columbia' ? (
            <div className="acceptance-letter-ubc-editor">
              <div className="acceptance-letter-ubc-editor-title">UBC letter copy</div>
              <div className="certificate-form-grid work-permit-form-grid">
                <label className="admin-field admin-field-full">
                  <span>Intro paragraph</span>
                  <textarea rows="3" value={draft.ubc_intro_text} onChange={(event) => updateField('ubc_intro_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Summary paragraph</span>
                  <textarea rows="3" value={draft.ubc_summary_text} onChange={(event) => updateField('ubc_summary_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Conditions paragraph</span>
                  <textarea rows="4" value={draft.ubc_conditions_text} onChange={(event) => updateField('ubc_conditions_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Next steps paragraph</span>
                  <textarea rows="3" value={draft.ubc_next_steps_text} onChange={(event) => updateField('ubc_next_steps_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Contact paragraph</span>
                  <textarea rows="3" value={draft.ubc_contact_text} onChange={(event) => updateField('ubc_contact_text', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signature script</span>
                  <input type="text" value={draft.ubc_signature_script} onChange={(event) => updateField('ubc_signature_script', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Footer text</span>
                  <textarea rows="3" value={draft.ubc_closing_text} onChange={(event) => updateField('ubc_closing_text', event.target.value)} />
                </label>
              </div>
            </div>
          ) : null}

          {preview.university?.slug === 'mcgill-university' ? (
            <div className="acceptance-letter-mcgill-editor">
              <div className="acceptance-letter-mcgill-editor-title">McGill letter copy</div>
              <div className="certificate-form-grid work-permit-form-grid">
                <label className="admin-field">
                  <span>Wordmark text</span>
                  <input type="text" value={draft.mcgill_wordmark_text} onChange={(event) => updateField('mcgill_wordmark_text', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Tagline</span>
                  <input type="text" value={draft.mcgill_tagline_text} onChange={(event) => updateField('mcgill_tagline_text', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Sender department</span>
                  <input type="text" value={draft.mcgill_sender_dept_name} onChange={(event) => updateField('mcgill_sender_dept_name', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Sender address block</span>
                  <textarea rows="5" value={draft.mcgill_sender_address} onChange={(event) => updateField('mcgill_sender_address', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Date line</span>
                  <input type="text" value={draft.mcgill_date_line} onChange={(event) => updateField('mcgill_date_line', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Recipient block</span>
                  <textarea rows="4" value={draft.mcgill_recipient_block} onChange={(event) => updateField('mcgill_recipient_block', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Salutation</span>
                  <input type="text" value={draft.mcgill_salutation} onChange={(event) => updateField('mcgill_salutation', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Opening paragraph</span>
                  <textarea rows="4" value={draft.mcgill_intro_text} onChange={(event) => updateField('mcgill_intro_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Second paragraph</span>
                  <textarea rows="4" value={draft.mcgill_paragraph_two} onChange={(event) => updateField('mcgill_paragraph_two', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Third paragraph</span>
                  <textarea rows="4" value={draft.mcgill_paragraph_three} onChange={(event) => updateField('mcgill_paragraph_three', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Fourth paragraph</span>
                  <textarea rows="4" value={draft.mcgill_paragraph_four} onChange={(event) => updateField('mcgill_paragraph_four', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Closing paragraph</span>
                  <textarea rows="4" value={draft.mcgill_closing_text} onChange={(event) => updateField('mcgill_closing_text', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Subject line</span>
                  <input type="text" value={draft.mcgill_subject_line} onChange={(event) => updateField('mcgill_subject_line', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signature script</span>
                  <input type="text" value={draft.mcgill_signature_script} onChange={(event) => updateField('mcgill_signature_script', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Signature name</span>
                  <input type="text" value={draft.mcgill_signature_name} onChange={(event) => updateField('mcgill_signature_name', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Signature title</span>
                  <textarea rows="2" value={draft.mcgill_signature_title} onChange={(event) => updateField('mcgill_signature_title', event.target.value)} />
                </label>
                <label className="admin-field admin-field-full">
                  <span>Footer text</span>
                  <textarea rows="3" value={draft.mcgill_footer_text} onChange={(event) => updateField('mcgill_footer_text', event.target.value)} />
                </label>
              </div>
            </div>
          ) : null}

          <div className="certificate-form-grid work-permit-form-grid">
            <label className="admin-field">
              <span>University name</span>
              <input type="text" value={draft.university_name} onChange={(event) => updateField('university_name', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Country / region</span>
              <input type="text" value={draft.university_destination} onChange={(event) => updateField('university_destination', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>City</span>
              <input type="text" value={draft.university_city} onChange={(event) => updateField('university_city', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Reference number</span>
              <input type="text" value={draft.reference_number} onChange={(event) => updateField('reference_number', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Student number</span>
              <input type="text" value={draft.student_number} onChange={(event) => updateField('student_number', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>NSID</span>
              <input type="text" value={draft.nsid} onChange={(event) => updateField('nsid', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Student name</span>
              <input type="text" value={draft.student_name} onChange={(event) => updateField('student_name', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Program name</span>
              <input type="text" value={draft.program_name} onChange={(event) => updateField('program_name', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Program level</span>
              <select value={draft.program_level} onChange={(event) => updateField('program_level', event.target.value)}>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Master's">Master's</option>
                <option value="PhD">PhD</option>
                <option value="Diploma">Diploma</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Intake term</span>
              <input type="text" value={draft.intake_term} onChange={(event) => updateField('intake_term', event.target.value)} placeholder="Fall 2026" />
            </label>
            <label className="admin-field">
              <span>Offer date</span>
              <input type="date" value={draft.offer_date} onChange={(event) => updateField('offer_date', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Start date</span>
              <input type="date" value={draft.start_date} onChange={(event) => updateField('start_date', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Acceptance deadline</span>
              <input type="date" value={draft.acceptance_deadline} onChange={(event) => updateField('acceptance_deadline', event.target.value)} />
            </label>
            <div className="certificate-image-grid acceptance-image-grid">
              {ACCEPTANCE_IMAGE_FIELDS.map((field) => renderImageCard(field, draft[field.key], handleImageUpload, clearImageField))}
            </div>
            <label className="admin-field admin-field-full">
              <span>Acceptance letter text</span>
              <textarea rows="6" value={draft.offer_text} onChange={(event) => updateField('offer_text', event.target.value)} />
            </label>
            <label className="admin-field admin-field-full">
              <span>Conditions</span>
              <textarea rows="4" value={draft.conditions} onChange={(event) => updateField('conditions', event.target.value)} />
            </label>
            <label className="admin-field admin-field-full">
              <span>Closing text</span>
              <textarea rows="4" value={draft.closing_text} onChange={(event) => updateField('closing_text', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Signatory name</span>
              <input type="text" value={draft.signatory_name} onChange={(event) => updateField('signatory_name', event.target.value)} />
            </label>
            <label className="admin-field">
              <span>Signatory title</span>
              <input type="text" value={draft.signatory_title} onChange={(event) => updateField('signatory_title', event.target.value)} />
            </label>
            <label className="admin-field admin-field-full">
              <span>Footer text</span>
              <textarea rows="3" value={draft.footer_text} onChange={(event) => updateField('footer_text', event.target.value)} />
            </label>
          </div>
        </form>

        <aside className="certificate-builder-preview">
          <div className="acceptance-letter-preview-summary">
            <div>
              <span className="summary-kicker">{preview.presentation.familyLabel}</span>
              <strong>{preview.university_name}</strong>
              <p>
                {preview.presentation.kicker || preview.presentation.layoutName}
                {' '}| {preview.presentation.layoutName}
              </p>
            </div>
            <div className="summary-meta">
              <span>{preview.university_destination}</span>
              <strong>{preview.university_city || 'Campus location'}</strong>
            </div>
          </div>
          <div className="acceptance-letter-preview">
            <div className="acceptance-letter-stage" ref={stageRef}>
              {renderAcceptanceLetter(preview)}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

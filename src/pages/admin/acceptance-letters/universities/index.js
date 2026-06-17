import { canadaUniversities } from './canada/index.js'
import { ukUniversities } from './uk/index.js'
import { usaUniversities } from './usa/index.js'
import { australiaUniversities } from './australia/index.js'
import { dubaiUniversities } from './dubai/index.js'
import { europeUniversities } from './europe/index.js'

const PRESENTATION_VARIANTS = ['classic', 'banner', 'editorial', 'crest', 'heritage', 'panel', 'ticket', 'tech-box', 'space-tech', 'gift-box']

const DESTINATION_VARIANTS = {
  Canada: ['crest', 'banner', 'editorial', 'classic', 'panel'],
  'United Kingdom': ['classic', 'heritage', 'crest', 'editorial', 'panel'],
  'United States': ['heritage', 'editorial', 'crest', 'panel', 'classic'],
  Australia: ['banner', 'panel', 'classic', 'heritage', 'tech-box'],
  'Dubai/UAE': ['ticket', 'banner', 'tech-box', 'panel', 'gift-box'],
  Europe: ['editorial', 'classic', 'crest', 'panel', 'heritage'],
}

function hashString(value) {
  const text = `${value ?? ''}`
  let hash = 0

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }

  return hash
}

function titleCase(value) {
  return `${value ?? ''}`
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim()
}

function getPresentationVariant(university) {
  const destination = university?.destination || ''
  const baseVariants = DESTINATION_VARIANTS[destination] || PRESENTATION_VARIANTS
  const hash = hashString(`${university?.slug || ''}|${university?.name || ''}|${destination}`)
  return baseVariants[hash % baseVariants.length]
}

function getPresentationLabel(university, variant) {
  const destination = university?.destination || 'University'
  const labelMap = {
    classic: 'Classic Academic',
    banner: 'Campus Banner',
    editorial: 'Editorial Offer',
    crest: 'Crest & Seal',
    heritage: 'Heritage Edition',
    panel: 'Research Panel',
    ticket: 'Admissions Pass',
    'tech-box': 'Tech Box',
    'space-tech': 'Space Tech',
    'gift-box': 'Gift Box',
  }

  return `${labelMap[variant] || 'Academic Edition'}`
}

function augmentUniversity(university) {
  const presentationVariant = getPresentationVariant(university)

  return {
    ...university,
    presentationVariant,
    presentationLabel: getPresentationLabel(university, presentationVariant),
    layout: presentationVariant,
    layoutName: getPresentationLabel(university, presentationVariant),
    city: university.city || '',
    destination: university.destination || 'International',
    destinationSlug: university.destinationSlug || titleCase(university.destination).toLowerCase().replace(/\s+/g, '-'),
  }
}

export const ALL_UNIVERSITIES = [
  ...canadaUniversities,
  ...ukUniversities,
  ...usaUniversities,
  ...australiaUniversities,
  ...dubaiUniversities,
  ...europeUniversities,
].map(augmentUniversity)

export function getAllUniversities() {
  return ALL_UNIVERSITIES
}

export function getUniversityBySlug(slug) {
  return ALL_UNIVERSITIES.find((u) => u.slug === slug)
}

export function getUniversityByName(name) {
  if (!name) return undefined
  const normalized = `${name}`.trim().toLowerCase()
  return ALL_UNIVERSITIES.find((u) => `${u.name || ''}`.trim().toLowerCase() === normalized)
}

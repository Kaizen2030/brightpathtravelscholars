export const DEFAULT_FALLBACK_IMAGE = '/images/fallbacks/students-study.jpg'
export const HERO_FALLBACK_IMAGE = '/images/fallbacks/students-campus.jpg'
export const TRAVEL_FALLBACK_IMAGE = '/images/fallbacks/airport-terminal.jpg'
export const FLIGHT_FALLBACK_IMAGE = '/images/fallbacks/airplane-gate.jpg'
export const STUDY_GROUP_FALLBACK_IMAGE = '/images/fallbacks/extras/students-study-group.jpg'
export const STUDENT_LAPTOP_FALLBACK_IMAGE = '/images/fallbacks/extras/student-laptop.jpg'
export const GRADUATION_FALLBACK_IMAGE = '/images/fallbacks/extras/graduation.jpg'
export const PASSPORT_SUITCASE_FALLBACK_IMAGE = '/images/fallbacks/extras/passport-suitcase.jpg'
export const TRAVEL_MAP_FALLBACK_IMAGE = '/images/fallbacks/extras/travel-map-passport.jpg'

export const DESTINATION_FALLBACK_IMAGES = {
  uk: '/images/fallbacks/destinations/uk-london.jpg',
  australia: '/images/fallbacks/destinations/australia-sydney.jpg',
  canada: '/images/fallbacks/destinations/canada-toronto.jpg',
  usa: '/images/fallbacks/destinations/usa-new-york.jpg',
  'new-zealand': '/images/fallbacks/destinations/new-zealand-auckland.jpg',
  dubai: '/images/fallbacks/destinations/dubai-skyline.jpg',
  europe: '/images/fallbacks/destinations/europe-city.jpg',
  malaysia: '/images/fallbacks/destinations/malaysia-kuala-lumpur.jpg',
  turkey: '/images/fallbacks/destinations/turkey-istanbul.jpg',
  china: '/images/fallbacks/destinations/china-beijing.jpg',
}

export function getDestinationFallbackImage(slug) {
  return DESTINATION_FALLBACK_IMAGES[slug] || DEFAULT_FALLBACK_IMAGE
}

export const HERO_FALLBACK_IMAGES = [
  HERO_FALLBACK_IMAGE,
  STUDY_GROUP_FALLBACK_IMAGE,
  STUDENT_LAPTOP_FALLBACK_IMAGE,
]

export const BLOG_FALLBACK_IMAGES = [
  STUDENT_LAPTOP_FALLBACK_IMAGE,
  STUDY_GROUP_FALLBACK_IMAGE,
  GRADUATION_FALLBACK_IMAGE,
  TRAVEL_MAP_FALLBACK_IMAGE,
]

export const COMMUNITY_GALLERY_FALLBACK_IMAGES = {
  'Offer Letter Wins': [STUDY_GROUP_FALLBACK_IMAGE, STUDENT_LAPTOP_FALLBACK_IMAGE],
  'Visa Approval Moments': [PASSPORT_SUITCASE_FALLBACK_IMAGE, TRAVEL_MAP_FALLBACK_IMAGE],
  'Pre-Departure Sessions': [TRAVEL_FALLBACK_IMAGE, FLIGHT_FALLBACK_IMAGE],
  'Campus Arrival Stories': [HERO_FALLBACK_IMAGE, STUDENT_LAPTOP_FALLBACK_IMAGE],
  'Graduation Highlights': [GRADUATION_FALLBACK_IMAGE, STUDY_GROUP_FALLBACK_IMAGE],
  'Scholarship Successes': [GRADUATION_FALLBACK_IMAGE, TRAVEL_MAP_FALLBACK_IMAGE],
}

export const EVENT_FALLBACK_IMAGE_BY_CATEGORY = {
  university_open_day: STUDY_GROUP_FALLBACK_IMAGE,
  visa_talk: PASSPORT_SUITCASE_FALLBACK_IMAGE,
  pre_departure: FLIGHT_FALLBACK_IMAGE,
  webinar: STUDENT_LAPTOP_FALLBACK_IMAGE,
  scholarship: GRADUATION_FALLBACK_IMAGE,
}

export function getBlogFallbackImage(index = 0, category = '') {
  const normalized = (category || '').toLowerCase()
  if (normalized.includes('scholar')) return GRADUATION_FALLBACK_IMAGE
  if (normalized.includes('visa')) return PASSPORT_SUITCASE_FALLBACK_IMAGE
  if (normalized.includes('destination')) return TRAVEL_MAP_FALLBACK_IMAGE
  if (normalized.includes('study')) return STUDY_GROUP_FALLBACK_IMAGE
  return BLOG_FALLBACK_IMAGES[index % BLOG_FALLBACK_IMAGES.length]
}

export function getEventFallbackImage(category = '', isPast = false) {
  const base = EVENT_FALLBACK_IMAGE_BY_CATEGORY[category] || TRAVEL_FALLBACK_IMAGE
  if (!isPast) return base
  if (category === 'webinar') return STUDENT_LAPTOP_FALLBACK_IMAGE
  return base
}

export function getCommunityGalleryFallbackImages(title = '', index = 0) {
  const normalizedTitle = title.toLowerCase()
  const key = Object.keys(COMMUNITY_GALLERY_FALLBACK_IMAGES).find((item) => normalizedTitle.includes(item.toLowerCase()))
  if (key) return COMMUNITY_GALLERY_FALLBACK_IMAGES[key]

  const pools = Object.values(COMMUNITY_GALLERY_FALLBACK_IMAGES)
  return pools[index % pools.length] || [HERO_FALLBACK_IMAGE]
}

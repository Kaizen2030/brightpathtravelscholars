export const SITE_NAME = 'Brightpath Travel Scholars'
export const SITE_URL =
  import.meta.env.VITE_SITE_URL || 'https://brightpathtravelscholars.com'
export const SITE_TAGLINE = 'Your Travel. Our Vision.'
export const SITE_DESCRIPTION =
  'Brightpath Travel Scholars helps students study abroad through expert counselling, university applications, and visa support.'
export const SITE_IMAGE = import.meta.env.VITE_SITE_IMAGE || `${SITE_URL}/og-image.jpg`
export const WHATSAPP_URL = 'https://wa.me/254734004003'

export function getCanonicalUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return new URL(normalizedPath, SITE_URL).toString()
}

export const SITE_SETTING_FIELDS = [
  { key: 'site_name', label: 'Site Name', group: 'basic', defaultValue: 'Brightpath Travel Scholars' },
  {
    key: 'site_tagline',
    label: 'Site Tagline',
    group: 'basic',
    defaultValue: "Your Gateway to the World's Best Universities",
  },
  { key: 'site_url', label: 'Site URL', group: 'basic', defaultValue: 'https://brightpathtravelscholars.com' },
  { key: 'contact_email', label: 'Contact Email', group: 'contact', defaultValue: 'info@brightpathtravelscholars.com' },
  { key: 'contact_phone', label: 'Contact Phone', group: 'contact', defaultValue: '+18149274526' },
  { key: 'whatsapp_url', label: 'WhatsApp URL', group: 'contact', defaultValue: 'https://wa.me/18149274526' },
  { key: 'facebook_url', label: 'Facebook URL', group: 'social', defaultValue: 'https://facebook.com/brightpathtravelscholars' },
  { key: 'instagram_url', label: 'Instagram URL', group: 'social', defaultValue: 'https://instagram.com/brightpathtravelscholars' },
  { key: 'x_url', label: 'X URL', group: 'social', defaultValue: 'https://x.com/brightpathtravels' },
  { key: 'youtube_url', label: 'YouTube URL', group: 'social', defaultValue: 'https://youtube.com/@brightpathtravelscholars' },
  { key: 'linkedin_url', label: 'LinkedIn URL', group: 'social', defaultValue: 'https://linkedin.com/company/brightpath-travel-scholars' },
]

const SITE_SETTINGS_DEFAULT_MAP = SITE_SETTING_FIELDS.reduce((accumulator, field) => {
  accumulator[field.key] = field.defaultValue
  return accumulator
}, {})

const SITE_SETTINGS_CACHE_KEY = 'brightpath-site-settings-v1'

export function buildSiteSettings(rows = []) {
  return rows.reduce(
    (accumulator, row) => {
      if (row?.key) {
        accumulator[row.key] = row.value ?? accumulator[row.key] ?? ''
      }

      return accumulator
    },
    { ...SITE_SETTINGS_DEFAULT_MAP },
  )
}

export function getDefaultSiteSettings() {
  return { ...SITE_SETTINGS_DEFAULT_MAP }
}

export function readCachedSiteSettings() {
  if (typeof window === 'undefined') return getDefaultSiteSettings()

  try {
    const rawValue = window.localStorage.getItem(SITE_SETTINGS_CACHE_KEY)
    if (!rawValue) return getDefaultSiteSettings()

    const cached = JSON.parse(rawValue)
    return cached && typeof cached === 'object' ? { ...SITE_SETTINGS_DEFAULT_MAP, ...cached } : getDefaultSiteSettings()
  } catch {
    return getDefaultSiteSettings()
  }
}

export function writeCachedSiteSettings(settings) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SITE_SETTINGS_CACHE_KEY, JSON.stringify(settings))
  } catch {
    // Ignore cache write issues.
  }
}

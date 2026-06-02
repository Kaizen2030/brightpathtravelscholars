export const SITE_SETTING_FIELDS = [
  { key: 'site_name', label: 'Site Name', defaultValue: 'Brightpath Travel Scholars' },
  {
    key: 'site_tagline',
    label: 'Site Tagline',
    defaultValue: "Your Gateway to the World's Best Universities",
  },
  { key: 'site_url', label: 'Site URL', defaultValue: 'https://brightpathtravelscholars.com' },
  { key: 'contact_email', label: 'Contact Email', defaultValue: 'info@brightpathtravelscholars.com' },
  { key: 'contact_phone', label: 'Contact Phone', defaultValue: '+254 734 004 003' },
  { key: 'whatsapp_url', label: 'WhatsApp URL', defaultValue: 'https://wa.me/254734004003' },
  { key: 'facebook_url', label: 'Facebook URL', defaultValue: 'https://facebook.com/brightpathtravelscholars' },
  { key: 'instagram_url', label: 'Instagram URL', defaultValue: 'https://instagram.com/brightpathtravelscholars' },
  { key: 'x_url', label: 'X URL', defaultValue: 'https://x.com/brightpathtravels' },
  { key: 'youtube_url', label: 'YouTube URL', defaultValue: 'https://youtube.com/@brightpathtravelscholars' },
  { key: 'linkedin_url', label: 'LinkedIn URL', defaultValue: 'https://linkedin.com/company/brightpath-travel-scholars' },
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

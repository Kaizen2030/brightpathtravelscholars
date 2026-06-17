const fs = require('fs')
const path = require('path')

const root = path.resolve(process.cwd())
const publicDir = path.join(root, 'public')
const outputFile = path.join(publicDir, 'sitemap.xml')
const siteUrl = process.env.SITE_URL || 'https://brightpathtravelscholars.com'

function readJsFile(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function parseSlugs(fileContents) {
  const matches = [...fileContents.matchAll(/slug\s*:\s*['"]([^'"\n]+)['"]/g)]
  return matches.map((m) => m[1])
}

function parseJobIds(fileContents) {
  const matches = [...fileContents.matchAll(/\[\s*['"]([a-z0-9-]+)['"]/gi)]
  return matches.map((m) => m[1])
}

function buildUrlEntries() {
  const urls = new Set([
    '/',
    '/about',
    '/events',
    '/community',
    '/study-abroad',
    '/work-abroad',
    '/contact',
    '/apply',
    '/blog',
  ])

  const destinationFile = readJsFile('src/lib/destinationGuides.js')
  const scholarshipFile = readJsFile('src/lib/scholarshipCatalog.js')
  const universityFile = readJsFile('src/lib/universityCatalog.js')
  const jobFile = readJsFile('src/lib/jobCatalog.js')

  const destinationSlugs = parseSlugs(destinationFile)
  const scholarshipSlugs = parseSlugs(scholarshipFile)
  const universitySlugs = parseSlugs(universityFile)
  const jobIds = parseJobIds(jobFile)

  destinationSlugs.forEach((slug) => urls.add(`/study-abroad/${slug}`))
  scholarshipSlugs.forEach((slug) => {
    urls.add(`/scholarships/${slug}`)
    urls.add(`/scholarships/${slug}/apply`)
  })
  universitySlugs.forEach((slug) => urls.add(`/universities/${slug}`))
  jobIds.forEach((jobId) => urls.add(`/jobs/${jobId}`))

  return [...urls].sort()
}

function buildXml(urls) {
  const now = new Date().toISOString().slice(0, 10)
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ]

  urls.forEach((url) => {
    lines.push('  <url>')
    lines.push(`    <loc>${siteUrl.replace(/\/$/, '')}${url}</loc>`)
    lines.push(`    <lastmod>${now}</lastmod>`)
    lines.push('  </url>')
  })

  lines.push('</urlset>')
  return lines.join('\n')
}

function main() {
  const urls = buildUrlEntries()
  fs.mkdirSync(publicDir, { recursive: true })
  fs.writeFileSync(outputFile, buildXml(urls), 'utf8')
  console.log(`Generated sitemap with ${urls.length} URLs at ${outputFile}`)
}

try {
  main()
} catch (error) {
  console.error('Sitemap generation failed:', error)
  process.exit(1)
}

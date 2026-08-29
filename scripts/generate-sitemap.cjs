// Generates public/sitemap.xml with only the publicly indexable routes.
// Auth-walled content routes (redirect crawlers to /) and thin auth pages are
// excluded. Run: node scripts/generate-sitemap.cjs
const { writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

const SITE = 'https://al-azher-it-hub.vercel.app'
const LAST_MOD = new Date().toISOString().slice(0, 10)

const urls = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/catalog', changefreq: 'daily', priority: '0.9' },
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE}${u.path === '/' ? '/' : u.path}</loc>
    <lastmod>${LAST_MOD}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

const out = resolve(process.cwd(), 'public/sitemap.xml')
writeFileSync(out, xml)
console.log(`sitemap written: ${out}`)
